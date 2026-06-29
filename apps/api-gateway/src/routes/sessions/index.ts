/**
 * @fileoverview Interview session routes (public — token-based, no auth middleware).
 *
 * - GET  /sessions/:token — Load session info + questions for the interview UI
 * - POST /sessions/:token — Submit an answer, or mark the interview as complete
 *
 * Authentication is via the unique token itself (SHA-256 lookup on `tokenHash`).
 */
import Elysia from "elysia"
import { SessionService } from "./service"
import { SessionModel } from "./model"

export const sessionsRoute = new Elysia()
  .get("/sessions/:token", async ({ params: { token } }) => {
    const data = await SessionService.getSession(token)
    return { ok: true, data }
  })
  .post(
    "/sessions/:token",
    async ({ params: { token }, body }) => {
      if ("action" in body) {
        const data = await SessionService.completeSession(token)
        return { ok: true, data }
      }
      const data = await SessionService.submitAnswer(
        token,
        body.question_id,
        body.answer,
      )
      return { ok: true, data }
    },
    {
      body: SessionModel.postBody,
    },
  )
