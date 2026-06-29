import { describe, it, expect, mock, beforeEach } from "bun:test"
import { ApiError } from "../../middleware"

const ORG_ID = "org_1"
const ENDPOINT_ID = "wh_1"
const NOW = new Date()

const mockFindMany = mock<(q: any) => Promise<any>>()
const mockFindFirst = mock<(q: any) => Promise<any>>()
const mockCreate = mock<(q: any) => Promise<any>>()
const mockUpdate = mock<(q: any) => Promise<any>>()
const mockDelete = mock<(q: any) => Promise<any>>()

const mockGenerateSecret = mock<() => string>()

mock.module("@founderiq/database", () => ({
  prisma: {
    webhookEndPoint: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}))

mock.module("../../lib/tokens", () => ({
  generateWebhookSecret: mockGenerateSecret,
}))

import { WebhookEndpointService } from "./service"

const mockRow = {
  id: ENDPOINT_ID,
  url: "https://example.com/hooks",
  secret: "whsec_test_secret",
  events: ["candidate.received", "interview.completed"],
  active: true,
  organizationId: ORG_ID,
  createdAt: NOW,
  updatedAt: NOW,
}

describe("WebhookEndpointService", () => {
  beforeEach(() => {
    ;[mockFindMany, mockFindFirst, mockCreate, mockUpdate, mockDelete, mockGenerateSecret].forEach((fn) => fn.mockReset())
  })

  // ───── listEndpoints ────────────────────────────────────────────────

  describe("listEndpoints", () => {
    it("returns all endpoints for the org (without secret)", async () => {
      mockFindMany.mockImplementationOnce(() => Promise.resolve([mockRow]))

      const result = await WebhookEndpointService.listEndpoints(ORG_ID)

      expect(result).toHaveLength(1)
      expect(result[0]).not.toHaveProperty("secret")
      expect(result[0]).toMatchObject({
        id: ENDPOINT_ID,
        url: "https://example.com/hooks",
        events: ["candidate.received", "interview.completed"],
        active: true,
      })
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: ORG_ID } }),
      )
    })

    it("returns empty array when no endpoints exist", async () => {
      mockFindMany.mockImplementationOnce(() => Promise.resolve([]))

      const result = await WebhookEndpointService.listEndpoints(ORG_ID)

      expect(result).toEqual([])
    })
  })

  // ───── createEndpoint ───────────────────────────────────────────────

  describe("createEndpoint", () => {
    it("creates and returns an endpoint with secret", async () => {
      mockGenerateSecret.mockReturnValue("whsec_new_secret")
      mockCreate.mockImplementationOnce(() => Promise.resolve(mockRow))

      const result = await WebhookEndpointService.createEndpoint(ORG_ID, {
        url: "https://example.com/hooks",
        events: ["candidate.received"],
      })

      expect(result).toMatchObject({
        id: ENDPOINT_ID,
        url: "https://example.com/hooks",
        secret: "whsec_test_secret",
        active: true,
      })
      expect(mockGenerateSecret).toHaveBeenCalledTimes(1)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: "https://example.com/hooks",
            secret: "whsec_new_secret",
            organizationId: ORG_ID,
          }),
        }),
      )
    })

    it("validates event types", async () => {
      const caught: unknown = await WebhookEndpointService.createEndpoint(ORG_ID, {
        url: "https://example.com/hooks",
        events: ["invalid.event"],
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(422)
      expect((caught as ApiError).code).toBe("invalid_event")
    })

    it("allows wildcard event", async () => {
      mockGenerateSecret.mockReturnValue("whsec_secret")
      mockCreate.mockImplementationOnce(() => Promise.resolve(mockRow))

      const result = await WebhookEndpointService.createEndpoint(ORG_ID, {
        url: "https://example.com/hooks",
        events: ["*"],
      })

      expect(result).toBeDefined()
    })
  })

  // ───── getEndpoint ──────────────────────────────────────────────────

  describe("getEndpoint", () => {
    it("returns endpoint data (without secret)", async () => {
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(mockRow))

      const result = await WebhookEndpointService.getEndpoint(ORG_ID, ENDPOINT_ID)

      expect(result).not.toHaveProperty("secret")
      expect(result).toMatchObject({ id: ENDPOINT_ID, url: "https://example.com/hooks" })
    })

    it("throws 404 when not found", async () => {
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await WebhookEndpointService.getEndpoint(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── updateEndpoint ───────────────────────────────────────────────

  describe("updateEndpoint", () => {
    it("updates url, events, and active", async () => {
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(mockRow))
      mockUpdate.mockImplementationOnce(() => Promise.resolve({
        ...mockRow,
        url: "https://example.com/new-hooks",
        events: ["candidate.analyzed"],
        active: false,
      }))

      const result = await WebhookEndpointService.updateEndpoint(ORG_ID, ENDPOINT_ID, {
        url: "https://example.com/new-hooks",
        events: ["candidate.analyzed"],
        active: false,
      })

      expect(result).toMatchObject({
        url: "https://example.com/new-hooks",
        events: ["candidate.analyzed"],
        active: false,
      })
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ENDPOINT_ID },
          data: expect.objectContaining({ url: "https://example.com/new-hooks" }),
        }),
      )
    })

    it("throws 404 when not found", async () => {
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await WebhookEndpointService.updateEndpoint(ORG_ID, "bad", { active: false }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("validates event types on update", async () => {
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(mockRow))

      const caught: unknown = await WebhookEndpointService.updateEndpoint(ORG_ID, ENDPOINT_ID, {
        events: ["bad.event"],
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(422)
    })
  })

  // ───── deleteEndpoint ───────────────────────────────────────────────

  describe("deleteEndpoint", () => {
    it("deletes the endpoint and returns confirmation", async () => {
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(mockRow))
      mockDelete.mockImplementationOnce(() => Promise.resolve(mockRow))

      const result = await WebhookEndpointService.deleteEndpoint(ORG_ID, ENDPOINT_ID)

      expect(result).toEqual({ deleted: true })
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: ENDPOINT_ID } })
    })

    it("throws 404 when not found", async () => {
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await WebhookEndpointService.deleteEndpoint(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })
})
