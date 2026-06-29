import { describe, it, expect, mock, beforeEach } from "bun:test"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG_ID = "org_founderiq"

const mockStartups = [
  {
    id: "s_alpha",
    name: "Alpha AI",
    website: "https://alpha.ai",
    industry: "AI",
    stage: "Seed",
    location: "SF",
    description: "AI platform",
    fundingRaised: BigInt(500000),
    status: "NEW" as const,
    organizationId: ORG_ID,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-06-01"),
  },
  {
    id: "s_beta",
    name: "Beta Bio",
    website: null,
    industry: "Biotech",
    stage: "Pre-seed",
    location: "Boston",
    description: "Bioengineering",
    fundingRaised: BigInt(1500000),
    status: "ANALYZING" as const,
    organizationId: ORG_ID,
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-06-10"),
  },
  {
    id: "s_gamma",
    name: "Gamma Grid",
    website: "https://gamma.io",
    industry: "Energy",
    stage: "Series A",
    location: "NYC",
    description: "Smart grid",
    fundingRaised: BigInt(0),
    status: "COMPLETED" as const,
    organizationId: ORG_ID,
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-06-15"),
  },
]

// ---------------------------------------------------------------------------
// Mock functions
// ---------------------------------------------------------------------------

const mockStartupCount = mock<(q: any) => Promise<number>>()
const mockStartupFindMany = mock<(q: any) => Promise<any[]>>()
const mockInterviewCount = mock<(q: any) => Promise<number>>()
const mockInterviewAggregate = mock<(q: any) => Promise<any>>()

// ---------------------------------------------------------------------------
// Module mocks — run before DashboardService import
// ---------------------------------------------------------------------------

mock.module("@founderiq/database", () => ({
  prisma: {
    startup: {
      count: mockStartupCount,
      findMany: mockStartupFindMany,
    },
    interview: {
      count: mockInterviewCount,
      aggregate: mockInterviewAggregate,
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { DashboardService } from "./service"

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DashboardService", () => {
  beforeEach(() => {
    mockStartupCount.mockReset()
    mockStartupFindMany.mockReset()
    mockInterviewCount.mockReset()
    mockInterviewAggregate.mockReset()
  })

  describe("getDashboard", () => {
    it("returns metrics, startups, and total funding for an org with data", async () => {
      mockStartupCount
        .mockImplementationOnce(() => Promise.resolve(3))   // total startups
        .mockImplementationOnce(() => Promise.resolve(2))   // pending (NEW / ANALYZING)
      mockInterviewCount
        .mockImplementationOnce(() => Promise.resolve(1))   // completed interviews
        .mockImplementationOnce(() => Promise.resolve(1))   // high-potential (score >= 80)
      mockInterviewAggregate.mockImplementationOnce(() =>
        Promise.resolve({ _avg: { overallScore: 74.8 } }),
      )
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve(mockStartups))

      const result = await DashboardService.getDashboard(ORG_ID)

      expect(result).toMatchObject({
        metrics: {
          startupsReviewed: 3,
          interviewsCompleted: 1,
          pendingAnalyses: 2,
          highPotentialDeals: 1,
          averageFounderScore: 75,
        },
        totalFunding: 2000000,
      })
      expect(result.startups.map((s) => s.fundingRaised)).toEqual([500000, 1500000, 0])
    })

    it("returns zeros for an empty organization", async () => {
      mockStartupCount
        .mockImplementationOnce(() => Promise.resolve(0))
        .mockImplementationOnce(() => Promise.resolve(0))
      mockInterviewCount
        .mockImplementationOnce(() => Promise.resolve(0))
        .mockImplementationOnce(() => Promise.resolve(0))
      mockInterviewAggregate.mockImplementationOnce(() =>
        Promise.resolve({ _avg: { overallScore: null } }),
      )
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve([]))

      const result = await DashboardService.getDashboard(ORG_ID)

      expect(result).toEqual({
        metrics: {
          startupsReviewed: 0,
          interviewsCompleted: 0,
          pendingAnalyses: 0,
          highPotentialDeals: 0,
          averageFounderScore: 0,
        },
        startups: [],
        totalFunding: 0,
      })
    })

    it("returns averageFounderScore of 0 when no interviews have scores", async () => {
      mockStartupCount
        .mockImplementationOnce(() => Promise.resolve(3))
        .mockImplementationOnce(() => Promise.resolve(2))
      mockInterviewCount
        .mockImplementationOnce(() => Promise.resolve(0))
        .mockImplementationOnce(() => Promise.resolve(0))
      mockInterviewAggregate.mockImplementationOnce(() =>
        Promise.resolve({ _avg: { overallScore: null } }),
      )
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve(mockStartups))

      const result = await DashboardService.getDashboard(ORG_ID)

      expect(result.metrics.averageFounderScore).toBe(0)
    })

    it("only counts NEW and ANALYZING statuses as pending", async () => {
      let totalCount = 0
      let pendingCount = 0

      mockStartupCount.mockImplementation((q: any) => {
        if (q.where?.status?.in) {
          pendingCount++
          return Promise.resolve(2)
        }
        totalCount++
        return Promise.resolve(10)
      })
      mockInterviewCount
        .mockImplementationOnce(() => Promise.resolve(5))
        .mockImplementationOnce(() => Promise.resolve(3))
      mockInterviewAggregate.mockImplementationOnce(() =>
        Promise.resolve({ _avg: { overallScore: 80 } }),
      )
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve(mockStartups))

      await DashboardService.getDashboard(ORG_ID)

      expect(totalCount).toBe(1)
      expect(pendingCount).toBe(1)
      expect(mockStartupCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: ORG_ID } }),
      )
      expect(mockStartupCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID, status: { in: ["NEW", "ANALYZING"] } },
        }),
      )
    })
  })
})
