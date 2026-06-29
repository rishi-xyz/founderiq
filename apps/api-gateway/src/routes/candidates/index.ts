import Elysia from "elysia"
import { authenticateRequest, requireScope } from "../../middleware/auth"
import { CandidateService } from "./service"

export const candidatesRoute = new Elysia()
  .use(authenticateRequest)
  .post("/candidates", async ({ auth, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await CandidateService.createCandidate(auth.organizationId, body)
    return { ok: true, data }
  })
  .get("/candidates", async ({ auth, query }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const limit = Math.min(Number(query.limit ?? 50), 100)
    const offset = Math.max(Number(query.offset ?? 0), 0)
    const data = await CandidateService.listCandidates(auth.organizationId, limit, offset)
    return { ok: true, data }
  })
  .get("/candidates/:id", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await CandidateService.getCandidate(auth.organizationId, id)
    return { ok: true, data }
  })
  .patch("/candidates/:id", async ({ auth, params: { id }, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await CandidateService.updateCandidate(auth.organizationId, id, body)
    return { ok: true, data }
  })
  .post("/candidates/:id/analyze", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const data = await CandidateService.analyzeCandidate(auth.organizationId, id)
    return { ok: true, data }
  })
  .get("/candidates/:id/analyze", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await CandidateService.getAnalysis(auth.organizationId, id)
    return { ok: true, data }
  })
  .post("/candidates/:id/interview", async ({ auth, params: { id }, body }: any) => {
    if (auth.type === "api_key") requireScope(auth, "write")
    const expiresInHours = body?.expires_in_hours ?? 168
    const data = await CandidateService.scheduleInterview(
      auth.organizationId,
      id,
      Math.min(expiresInHours, 720),
    )
    return { ok: true, data }
  })
  .get("/candidates/:id/interview", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await CandidateService.getInterview(auth.organizationId, id)
    return { ok: true, data }
  })
  .get("/candidates/:id/memo", async ({ auth, params: { id } }: any) => {
    if (auth.type === "api_key") requireScope(auth, "read")
    const data = await CandidateService.getMemo(auth.organizationId, id)
    return { ok: true, data }
  })
