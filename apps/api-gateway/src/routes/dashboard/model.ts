/**
 * @fileoverview TypeBox validation schemas + derived TS types for the dashboard endpoint.
 * Types stay in sync with runtime validation via `UnwrapSchema`.
 */
import { t, type UnwrapSchema } from "elysia"

/** Metrics sub-object returned at `data.metrics`. */
const metricsModel = t.Object({
  startupsReviewed: t.Number(),
  interviewsCompleted: t.Number(),
  pendingAnalyses: t.Number(),
  highPotentialDeals: t.Number(),
  averageFounderScore: t.Number(),
})

/** Individual startup item in the `data.startups` array. */
const startupItem = t.Object({
  id: t.String(),
  name: t.String(),
  website: t.Optional(t.String()),
  industry: t.Optional(t.String()),
  stage: t.Optional(t.String()),
  location: t.Optional(t.String()),
  description: t.Optional(t.String()),
  fundingRaised: t.Number(),
  status: t.String(),
  organizationId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

/**
 * DashboardModel bundle: full 200 response schema.
 *
 * - `response`: `{ ok: true, data: { metrics, startups, totalFunding } }`
 */
export const DashboardModel = {
  response: t.Object({
    ok: t.Literal(true),
    data: t.Object({
      metrics: metricsModel,
      startups: t.Array(startupItem),
      totalFunding: t.Number(),
    }),
  }),
} as const

/** Unwraps TypeBox schemas → TS types. */
export type DashboardModel = {
  [k in keyof typeof DashboardModel]: UnwrapSchema<typeof DashboardModel[k]>
}
