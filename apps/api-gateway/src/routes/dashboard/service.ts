/**
 * @fileoverview Dashboard business logic — aggregates org-level metrics, startup listing, and total funding.
 * Called by the dashboard route handler after authentication.
 */
import { prisma } from "@founderiq/database"

export interface DashboardData {
  metrics: {
    startupsReviewed: number
    interviewsCompleted: number
    pendingAnalyses: number
    highPotentialDeals: number
    averageFounderScore: number
  }
  startups: Array<Record<string, unknown> & { fundingRaised: number }>
  totalFunding: number
}

export abstract class DashboardService {
  /**
   * Aggregate dashboard metrics + startup listing for a single organization.
   *
   * @param {string} organizationId - Scoping org (from auth context)
   * @returns {Promise<DashboardData>}
   *
   * @example const data = await DashboardService.getDashboard("org_123")
   */
  static async getDashboard(organizationId: string): Promise<DashboardData> {
    const [startupCount, interviewCount, pendingCount, highPotential, avgScore] = await Promise.all([
      prisma.startup.count({ where: { organizationId } }),
      prisma.interview.count({
        where: {
          startup: { organizationId },
          status: "COMPLETED",
        },
      }),
      prisma.startup.count({
        where: {
          organizationId,
          status: { in: ["NEW", "ANALYZING"] },
        },
      }),
      prisma.interview.count({
        where: {
          startup: { organizationId },
          overallScore: { gte: 80 },
        },
      }),
      prisma.interview.aggregate({
        where: {
          startup: { organizationId },
          overallScore: { not: null },
        },
        _avg: { overallScore: true },
      }),
    ])

    const startups = await prisma.startup.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    })

    const totalFunding = startups.reduce((sum, s) => sum + Number(s.fundingRaised), 0)

    return {
      metrics: {
        startupsReviewed: startupCount,
        interviewsCompleted: interviewCount,
        pendingAnalyses: pendingCount,
        highPotentialDeals: highPotential,
        averageFounderScore: avgScore._avg.overallScore ? Math.round(avgScore._avg.overallScore) : 0,
      },
      startups: startups.map((s) => ({
        ...s,
        fundingRaised: Number(s.fundingRaised),
      })),
      totalFunding,
    }
  }
}
