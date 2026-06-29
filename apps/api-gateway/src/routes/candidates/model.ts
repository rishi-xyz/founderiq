import { t, type UnwrapSchema } from "elysia"

const params = t.Object({
  id: t.String(),
})

const postCandidateBody = t.Object({
  company_name: t.String({ minLength: 1 }),
  applicant_name: t.Optional(t.String()),
  applicant_email: t.Optional(t.String()),
  external_id: t.Optional(t.String()),
  website: t.Optional(t.String()),
  industry: t.Optional(t.String()),
  stage: t.Optional(t.String()),
  location: t.Optional(t.String()),
  description: t.Optional(t.String()),
  funding_raised: t.Optional(t.Number()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
})

const getCandidatesQuery = t.Object({
  limit: t.Optional(t.String()),
  offset: t.Optional(t.String()),
})

const postInterviewBody = t.Object({
  expires_in_hours: t.Optional(t.Number()),
})

const candidateResponse = t.Object({
  id: t.String(),
  external_id: t.Union([t.String(), t.Null()]),
  applicant_name: t.Union([t.String(), t.Null()]),
  applicant_email: t.Union([t.String(), t.Null()]),
  company_name: t.String(),
  status: t.String(),
  startup_id: t.String(),
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

const interviewData = t.Object({
  candidate_id: t.String(),
  interview_id: t.String(),
  status: t.String(),
  overall_score: t.Union([t.Number(), t.Null()]),
  questions: t.Array(interviewQuestionItem),
})

const memoData = t.Object({
  candidate_id: t.String(),
  recommendation: t.Union([t.String(), t.Null()]),
  memo_content: t.Union([t.String(), t.Null()]),
  created_at: t.String(),
})

export const CandidateModel = {
  params,
  postCandidateBody,
  getCandidatesQuery,
  postInterviewBody,
  candidateResponse,
  analysisItem,
  interviewQuestionItem,
  interviewData,
  memoData,
} as const

export type CandidateModel = {
  [k in keyof typeof CandidateModel]: UnwrapSchema<typeof CandidateModel[k]>
}
