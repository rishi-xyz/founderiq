/**
 * @fileoverview Webhook dispatch — sends event notifications to registered endpoints.
 * Endpoints are filtered by event type, signed with HMAC-SHA256, and delivery is
 * logged to the database.
 */
import { createHmac } from "crypto"
import { prisma } from "@founderiq/database"

export type WebhookEvent =
  | "candidate.received"
  | "candidate.analyzed"
  | "interview.scheduled"
  | "interview.started"
  | "interview.completed"
  | "memo.generated"
  | "candidate.completed"

/**
 * HMAC-SHA256 signature for payload verification.
 */
function sign(secret: string, timestamp: number, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")
}

/**
 * Check whether an endpoint's registered events include the given event.
 * Supports wildcard `"*"`.
 */
function matches(endpointEvents: string[], event: WebhookEvent): boolean {
  return endpointEvents.includes("*") || endpointEvents.includes(event)
}

/**
 * Dispatch an event to all active webhook endpoints for the organization.
 * Delivery is fire-and-forget — failures are logged but not retried.
 *
 * @param organizationId - Scoping organization
 * @param event          - Event type discriminator
 * @param data           - Arbitrary JSON-serialisable payload
 */
export async function dispatchWebhook(
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  let endpoints: { id: string; url: string; secret: string; events: string[] }[] = []
  try {
    endpoints = await prisma.webhookEndPoint.findMany({
      where: { organizationId, active: true },
      select: { id: true, url: true, secret: true, events: true },
    })
  } catch {
    return
  }

  const timestamp = Date.now()
  const payload = {
    event,
    created_at: new Date(timestamp).toISOString(),
    data,
  }
  const body = JSON.stringify(payload)

  await Promise.all(
    endpoints
      .filter((e) => matches(e.events, event))
      .map(async (endpoint) => {
        const signature = sign(endpoint.secret, timestamp, body)
        let status: number | null = null
        let success = false
        let error: string | null = null
        try {
          const res = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-founderiq-event": event,
              "x-founderiq-signature": `t=${timestamp},v1=${signature}`,
            },
            body,
            signal: AbortSignal.timeout(8000),
          })
          status = res.status
          success = res.ok
        } catch (err) {
          error = err instanceof Error ? err.message : String(err)
        }
        prisma.webhookDelivery
          .create({
            data: {
              endpointId: endpoint.id,
              organizationId,
              eventType: event,
              payload: payload as any,
              responseStatus: status,
              success,
              error,
            },
          })
          .catch(() => {})
      }),
  )
}
