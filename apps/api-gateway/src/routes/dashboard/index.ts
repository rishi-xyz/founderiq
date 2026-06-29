import Elysia from "elysia"
import { prisma } from "@founderiq/database"
import { authenticateRequest, requireScope } from "../../middleware/auth"

export const dashboardRoute = new Elysia()
  .use(authenticateRequest)
  .get("/dashboard", async ({ auth }) => {
    if (auth.type === "api_key") requireScope(auth, "read")

    const [startupCount, interviewCount, pendingCount, highPotential, avgScore] = await Promise.all([
      prisma.startup.count({ where: { organizationId: auth.organizationId } }),
      prisma.interview.count({
        where: {
          startup: { organizationId: auth.organizationId },
          status: "COMPLETED",
        },
      }),
      prisma.startup.count({
        where: {
          organizationId: auth.organizationId,
          status: { in: ["NEW", "ANALYZING"] },
        },
      }),
      prisma.interview.count({
        where: {
          startup: { organizationId: auth.organizationId },
          overallScore: { gte: 80 },
        },
      }),
      prisma.interview.aggregate({
        where: {
          startup: { organizationId: auth.organizationId },
          overallScore: { not: null },
        },
        _avg: { overallScore: true },
      }),
    ])

    const startups = await prisma.startup.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: "desc" },
    })

    const totalFunding = startups.reduce((sum, s) => sum + Number(s.fundingRaised), 0)

    return {
      ok: true,
      data: {
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
      },
    }
  })
