import Elysia from "elysia"
import { authenticateRequest, requireScope } from "../../middleware/auth"
import { StartupService } from "./service"

export const startupsRoute = new Elysia()
  .use(authenticateRequest)
  .get("/startups", async ({ auth, query }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const limit = Math.min(Number(query.limit ?? 50), 100)
    const offset = Math.max(Number(query.offset ?? 0), 0)
    const data = await StartupService.listStartups(auth.organizationId, {
      search: query.search,
      industry: query.industry,
      stage: query.stage,
      status: query.status,
      limit,
      offset,
    })
    return { ok: true, data }
  })
  .get("/startups/:id", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await StartupService.getStartup(auth.organizationId, id)
    return { ok: true, data }
  })
  .post("/startups", async ({ auth, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await StartupService.createStartup(auth.organizationId, body)
    return { ok: true, data }
  })
  .post("/startups/:id/analyze", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await StartupService.analyzeStartup(auth.organizationId, id)
    return { ok: true, data }
  })
  .get("/startups/:id/analyses", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await StartupService.getAnalyses(auth.organizationId, id)
    return { ok: true, data }
  })
  .post("/startups/:id/interview", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await StartupService.scheduleInterview(auth.organizationId, id)
    return { ok: true, data }
  })
  .get("/startups/:id/interview", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await StartupService.getInterview(auth.organizationId, id)
    return { ok: true, data }
  })
  .get("/startups/:id/memo", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await StartupService.getMemo(auth.organizationId, id)
    return { ok: true, data }
  })
  .post("/startups/:id/memo", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await StartupService.generateMemo(auth.organizationId, id)
    return { ok: true, data }
  })
  .post("/startups/:id/interview/score", async ({ auth, params: { id: startupId }, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await StartupService.scoreAnswer(body.question_id, body.answer)
    return { ok: true, data }
  })
  .post("/startups/:id/interview/complete", async ({ auth, params: { id: startupId }, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await StartupService.completeInterview(
      auth.organizationId,
      startupId,
      body.interview_id,
    )
    return { ok: true, data }
  })
