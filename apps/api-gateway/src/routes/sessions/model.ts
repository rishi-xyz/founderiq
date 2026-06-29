/**
 * @fileoverview TypeBox validation schemas + derived TS types for interview session endpoints.
 */
import { t, type UnwrapSchema } from "elysia"

/** Route parameter: interview token. */
const params = t.Object({
  token: t.String(),
})

/** Request body for submitting an answer to a single question. */
const answerBody = t.Object({
  question_id: t.Number(),
  answer: t.String({ minLength: 1 }),
})

/** Request body for marking the interview as complete. */
const completeBody = t.Object({
  action: t.Literal("complete"),
})

/** Union type for the POST endpoint body. */
const postBody = t.Union([answerBody, completeBody])

/** Candidate info returned in the GET response. */
const candidateInfo = t.Object({
  company_name: t.String(),
  applicant_name: t.Union([t.String(), t.Null()]),
})

/** A question item returned in the GET response. */
const questionItem = t.Object({
  id: t.String(),
  category: t.Union([t.String(), t.Null()]),
  question: t.String(),
  answered: t.Boolean(),
})

/** Response body for GET /sessions/:token */
const getResponse = t.Object({
  ok: t.Literal(true),
  data: t.Object({
    status: t.String(),
    expires_at: t.String(),
    candidate: candidateInfo,
    questions: t.Array(questionItem),
  }),
})

/** Response body for POST answer submission. */
const postAnswerResponse = t.Object({
  ok: t.Literal(true),
  data: t.Object({
    question_id: t.Number(),
    score: t.Number(),
    feedback: t.String(),
  }),
})

/** Response body for POST completion. */
const postCompleteResponse = t.Object({
  ok: t.Literal(true),
  data: t.Object({
    status: t.String(),
    overallScore: t.Number(),
    recommendation: t.String(),
  }),
})

export const SessionModel = {
  params,
  answerBody,
  completeBody,
  postBody,
  candidateInfo,
  questionItem,
  getResponse,
  postAnswerResponse,
  postCompleteResponse,
} as const

export type SessionModel = {
  [k in keyof typeof SessionModel]: UnwrapSchema<typeof SessionModel[k]>
}
