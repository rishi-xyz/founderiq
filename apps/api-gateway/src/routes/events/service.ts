/**
 * @fileoverview Event (webhook delivery) business logic — lists recent deliveries for an organization.
 */
import { prisma } from "@founderiq/database"

export interface WebhookDeliveryItem {
  id: string
  eventType: string
  payload: unknown
  responseStatus: number | null
  success: boolean
  createdAt: Date
}

export abstract class EventService {
  /**
   * Fetch the most recent webhook deliveries for an organization.
   *
   * @param {string} organizationId - Scoping org (from auth context)
   * @param {number} limit - Max records to return (default 50, max 100)
   * @returns {Promise<WebhookDeliveryItem[]>}
   *
   * @example const events = await EventService.listDeliveries("org_123", 20)
   */
  static async listDeliveries(
    organizationId: string,
    limit: number,
  ): Promise<WebhookDeliveryItem[]> {
    return prisma.webhookDelivery.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        eventType: true,
        payload: true,
        responseStatus: true,
        success: true,
        createdAt: true,
      },
    })
  }
}
