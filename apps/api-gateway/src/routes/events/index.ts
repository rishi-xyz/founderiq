/**
 * @fileoverview Events route at `/api/v1/events`. Requires authentication with `read` scope.
 * Returns the most recent webhook deliveries for the organization.
 */
import Elysia from "elysia"
import { authenticateRequest, requireScope } from "../../middleware/auth"
import { EventService } from "./service"
import { EventModel } from "./model"

export const eventsRoute = new Elysia()
  .use(authenticateRequest)
  .get("/events", async ({ auth, query: { limit } }) => {
    requireScope(auth, "read")

    const data = await EventService.listDeliveries(auth.organizationId, limit ?? 50)

    return { ok: true, data }
  }, {
    query: EventModel.query,
  })
