import { t, type UnwrapSchema } from "elysia"

const params = t.Object({
  id: t.String(),
})

const postStartupBody = t.Object({
  name: t.String({ minLength: 1 }),
  website: t.Optional(t.String()),
  industry: t.Optional(t.String()),
  stage: t.Optional(t.String()),
  location: t.Optional(t.String()),
  description: t.Optional(t.String()),
  funding_raised: t.Optional(t.Number()),
})

const listStartupsQuery = t.Object({
  search: t.Optional(t.String()),
  industry: t.Optional(t.String()),
  stage: t.Optional(t.String()),
  status: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  offset: t.Optional(t.String()),
})

const postScoreBody = t.Object({
  question_id: t.String(),
  answer: t.String({ minLength: 1 }),
})

const patchStartupBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  website: t.Optional(t.String()),
  industry: t.Optional(t.String()),
  stage: t.Optional(t.String()),
  location: t.Optional(t.String()),
  description: t.Optional(t.String()),
  funding_raised: t.Optional(t.Number()),
})

const postCompleteBody = t.Object({
  interview_id: t.String(),
})

const startupResponse = t.Object({
  id: t.String(),
  name: t.String(),
  website: t.Union([t.String(), t.Null()]),
  industry: t.Union([t.String(), t.Null()]),
  stage: t.Union([t.String(), t.Null()]),
  location: t.Union([t.String(), t.Null()]),
  description: t.Union([t.String(), t.Null()]),
  funding_raised: t.Number(),
  status: t.String(),
  organization_id: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
})

const analysisItem = t.Object({
  id: t.String(),
  analysis_type: t.String(),
  score: t.Union([t.Number(), t.Null()]),
  content: t.Union([t.String(), t.Null()]),
  created_at: t.String(),
})

const interviewQuestionItem = t.Object({
  id: t.String(),
  category: t.Union([t.String(), t.Null()]),
  question: t.String(),
  answer: t.Union([t.String(), t.Null()]),
  score: t.Union([t.Number(), t.Null()]),
})

const interviewDetail = t.Object({
  id: t.String(),
  status: t.String(),
  overall_score: t.Union([t.Number(), t.Null()]),
  questions: t.Array(interviewQuestionItem),
  created_at: t.String(),
})

const memoResponse = t.Object({
  id: t.String(),
  recommendation: t.Union([t.String(), t.Null()]),
  memo_content: t.Union([t.String(), t.Null()]),
  created_at: t.String(),
})

const scoreResponse = t.Object({
  question_id: t.String(),
  score: t.Number(),
  feedback: t.String(),
})

const completeResponse = t.Object({
  overall_score: t.Number(),
})

export const StartupModel = {
  params,
  postStartupBody,
  listStartupsQuery,
  postScoreBody,
  patchStartupBody,
  postCompleteBody,
  startupResponse,
  analysisItem,
  interviewQuestionItem,
  interviewDetail,
  memoResponse,
  scoreResponse,
  completeResponse,
} as const

export type StartupModel = {
  [k in keyof typeof StartupModel]: UnwrapSchema<typeof StartupModel[k]>
}
