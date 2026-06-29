import { prisma } from "@founderiq/database"
import { ApiError } from "../../middleware"
import { generateWebhookSecret } from "../../lib/tokens"

function toEndpointResponse(e: {
  id: string
  url: string
  events: string[]
  active: boolean
  createdAt: Date
}) {
  return {
    id: e.id,
    url: e.url,
    events: e.events,
    active: e.active,
    created_at: e.createdAt.toISOString(),
  }
}

export const webhookEventTypes = [
  "candidate.received",
  "candidate.analyzed",
  "interview.scheduled",
  "interview.started",
  "interview.completed",
  "memo.generated",
  "candidate.completed",
] as const

export abstract class WebhookEndpointService {
  static async listEndpoints(organizationId: string) {
    const endpoints = await prisma.webhookEndPoint.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, events: true, active: true, createdAt: true },
    })
    return endpoints.map(toEndpointResponse)
  }

  static async createEndpoint(
    organizationId: string,
    body: { url: string; events: string[] },
  ) {
    for (const event of body.events) {
      if (event !== "*" && !(webhookEventTypes as readonly string[]).includes(event)) {
        throw new ApiError(422, "invalid_event", `Unknown event type "${event}".`)
      }
    }

    const secret = generateWebhookSecret()

    const endpoint = await prisma.webhookEndPoint.create({
      data: {
        url: body.url,
        secret,
        events: body.events,
        active: true,
        organizationId,
      },
    })

    return {
      id: endpoint.id,
      url: endpoint.url,
      secret: endpoint.secret,
      events: endpoint.events,
      active: endpoint.active,
      created_at: endpoint.createdAt.toISOString(),
    }
  }

  static async getEndpoint(organizationId: string, id: string) {
    const endpoint = await prisma.webhookEndPoint.findFirst({
      where: { id, organizationId },
      select: { id: true, url: true, events: true, active: true, createdAt: true },
    })
    if (!endpoint) throw new ApiError(404, "not_found", "Webhook endpoint not found.")
    return toEndpointResponse(endpoint)
  }

  static async updateEndpoint(
    organizationId: string,
    id: string,
    body: { url?: string; events?: string[]; active?: boolean },
  ) {
    const existing = await prisma.webhookEndPoint.findFirst({
      where: { id, organizationId },
    })
    if (!existing) throw new ApiError(404, "not_found", "Webhook endpoint not found.")

    if (body.events) {
      for (const event of body.events) {
        if (event !== "*" && !(webhookEventTypes as readonly string[]).includes(event)) {
          throw new ApiError(422, "invalid_event", `Unknown event type "${event}".`)
        }
      }
    }

    const endpoint = await prisma.webhookEndPoint.update({
      where: { id },
      data: {
        ...(body.url !== undefined && { url: body.url }),
        ...(body.events !== undefined && { events: body.events }),
        ...(body.active !== undefined && { active: body.active }),
      },
    })

    return toEndpointResponse(endpoint)
  }

  static async deleteEndpoint(organizationId: string, id: string) {
    const existing = await prisma.webhookEndPoint.findFirst({
      where: { id, organizationId },
    })
    if (!existing) throw new ApiError(404, "not_found", "Webhook endpoint not found.")

    await prisma.webhookEndPoint.delete({ where: { id } })
    return { deleted: true as const }
  }
}
