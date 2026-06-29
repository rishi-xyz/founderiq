import { describe, it, expect, mock, beforeEach } from "bun:test"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG_ID = "org_founderiq"

const mockDeliveries = [
  {
    id: "del_1",
    eventType: "startup.created",
    payload: { startupId: "s_1", name: "Alpha AI" },
    responseStatus: 200,
    success: true,
    createdAt: new Date("2025-06-15T10:00:00Z"),
  },
  {
    id: "del_2",
    eventType: "interview.completed",
    payload: { interviewId: "i_1", score: 85 },
    responseStatus: null,
    success: false,
    createdAt: new Date("2025-06-14T10:00:00Z"),
  },
  {
    id: "del_3",
    eventType: "startup.updated",
    payload: { startupId: "s_2", changes: ["stage"] },
    responseStatus: 500,
    success: false,
    createdAt: new Date("2025-06-13T10:00:00Z"),
  },
]

// ---------------------------------------------------------------------------
// Mock functions
// ---------------------------------------------------------------------------

const mockFindMany = mock<(q: any) => Promise<any[]>>()

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

mock.module("@founderiq/database", () => ({
  prisma: {
    webhookDelivery: {
      findMany: mockFindMany,
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { EventService } from "./service"

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EventService", () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  describe("listDeliveries", () => {
    it("returns deliveries for an organization", async () => {
      mockFindMany.mockImplementationOnce(() => Promise.resolve(mockDeliveries))

      const result = await EventService.listDeliveries(ORG_ID, 50)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        id: "del_1",
        eventType: "startup.created",
        success: true,
      })
      expect(result[1]).toMatchObject({
        id: "del_2",
        eventType: "interview.completed",
        success: false,
      })
      expect(result[2]).toMatchObject({
        id: "del_3",
        eventType: "startup.updated",
        success: false,
      })
    })

    it("respects the limit parameter", async () => {
      mockFindMany.mockImplementationOnce(() => Promise.resolve(mockDeliveries.slice(0, 1)))

      const result = await EventService.listDeliveries(ORG_ID, 1)

      expect(result).toHaveLength(1)
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 }),
      )
    })

    it("passes the correct organizationId and sort order", async () => {
      mockFindMany.mockImplementationOnce(() => Promise.resolve([]))

      await EventService.listDeliveries(ORG_ID, 50)

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID },
          orderBy: { createdAt: "desc" },
        }),
      )
    })

    it("returns empty array when no deliveries exist", async () => {
      mockFindMany.mockImplementationOnce(() => Promise.resolve([]))

      const result = await EventService.listDeliveries(ORG_ID, 50)

      expect(result).toEqual([])
    })
  })
})
