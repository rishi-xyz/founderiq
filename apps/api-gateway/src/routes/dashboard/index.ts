/**
 * @fileoverview Dashboard route at `/api/v1/dashboard`. Requires authentication.
 * Returns org-level metrics, startup listing, and total funding.
 */
import Elysia from "elysia"
import { authenticateRequest, requireScope } from "../../middleware/auth"
import { DashboardService } from "./service"

export const dashboardRoute = new Elysia()
  .use(authenticateRequest)
  .get("/dashboard", async ({ auth }) => {
    if (auth.type === "api_key") requireScope(auth, "read")

    const data = await DashboardService.getDashboard(auth.organizationId)

    return { ok: true, data }
  })
