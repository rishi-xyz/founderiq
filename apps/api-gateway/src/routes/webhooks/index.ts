import Elysia from "elysia"
import { authenticateRequest, requireScope } from "../../middleware/auth"
import { WebhookEndpointService } from "./service"

export const webhooksRoute = new Elysia()
  .use(authenticateRequest)
  .get("/webhooks", async ({ auth }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await WebhookEndpointService.listEndpoints(auth.organizationId)
    return { ok: true, data }
  })
  .post("/webhooks", async ({ auth, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await WebhookEndpointService.createEndpoint(auth.organizationId, body)
    return { ok: true, data }
  })
  .get("/webhooks/:id", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await WebhookEndpointService.getEndpoint(auth.organizationId, id)
    return { ok: true, data }
  })
  .patch("/webhooks/:id", async ({ auth, params: { id }, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await WebhookEndpointService.updateEndpoint(auth.organizationId, id, body)
    return { ok: true, data }
  })
  .delete("/webhooks/:id", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await WebhookEndpointService.deleteEndpoint(auth.organizationId, id)
    return { ok: true, data }
  })
