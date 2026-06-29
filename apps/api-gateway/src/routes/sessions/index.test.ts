import { describe, it, expect, mock, beforeEach } from "bun:test"
import { ApiError } from "../../middleware"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_TOKEN = "abc123"
const TOKEN_HASH = "6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090"

const mockSession = {
  id: "sess_1",
  tokenHash: TOKEN_HASH,
  status: "IN_PROGRESS",
  expriresAt: new Date(Date.now() + 3600_000),
  startedAt: new Date(),
  completedAt: null,
  createdAt: new Date(),
  candidateId: "cand_1",
  interviewId: "int_1",
}

const mockExpiredSession = {
  ...mockSession,
  expriresAt: new Date(Date.now() - 1000),
  status: "EXPIRED" as const,
}

const mockCompletedSession = {
  ...mockSession,
  status: "COMPLETED" as const,
}

const mockCandidate = {
  id: "cand_1",
  companyName: "Alpha AI",
  applicantName: "Alice",
  externalId: "ext_1",
  organizationId: "org_1",
  startupId: "startup_1",
  status: "ANALYZING",
  applicantEmail: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockQuestions = [
  { id: "q_1", interviewId: "int_1", category: "Vision", question: "What is your vision?", answer: null, score: null, sortOrder: 0, createdAt: new Date() },
  { id: "q_2", interviewId: "int_1", category: "Market", question: "Market size?", answer: "Large market", score: 85, sortOrder: 1, createdAt: new Date() },
]

// ---------------------------------------------------------------------------
// Mock functions — Prisma
// ---------------------------------------------------------------------------

const mockSessionFindUnique = mock<(q: any) => Promise<any>>()
const mockQuestionFindMany = mock<(q: any) => Promise<any[]>>()
const mockQuestionFindUnique = mock<(q: any) => Promise<any>>()
const mockSessionUpdate = mock<(q: any) => Promise<any>>()
const mockCandidateFindUnique = mock<(q: any) => Promise<any>>()
const mockInterviewUpdate = mock<(q: any) => Promise<any>>()
const mockStartupFindUnique = mock<(q: any) => Promise<any>>()
const mockAnalysisFindMany = mock<(q: any) => Promise<any[]>>()
const mockMemoCreate = mock<(q: any) => Promise<any>>()
const mockStartupUpdate = mock<(q: any) => Promise<any>>()
const mockCandidateUpdate = mock<(q: any) => Promise<any>>()
const mockQuestionUpdate = mock<(q: any) => Promise<any>>()

// ---------------------------------------------------------------------------
// Mock functions — external libs
// ---------------------------------------------------------------------------

const mockScoreAnswer = mock<(q: string, a: string) => Promise<any>>()
const mockGenerateMemo = mock<(s: any, summary: string) => Promise<any>>()
const mockDispatchWebhook = mock<(...args: any[]) => Promise<void>>()

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

mock.module("@founderiq/database", () => ({
  prisma: {
    interviewSession: {
      findUnique: mockSessionFindUnique,
      update: mockSessionUpdate,
    },
    interviewQuestion: {
      findMany: mockQuestionFindMany,
      findUnique: mockQuestionFindUnique,
      update: mockQuestionUpdate,
    },
    candidate: {
      findUnique: mockCandidateFindUnique,
      update: mockCandidateUpdate,
    },
    interview: {
      update: mockInterviewUpdate,
    },
    startup: {
      findUnique: mockStartupFindUnique,
      update: mockStartupUpdate,
    },
    analysis: {
      findMany: mockAnalysisFindMany,
    },
    investmentMemo: {
      create: mockMemoCreate,
    },
  },
}))

mock.module("../../lib/ai", () => ({
  scoreAnswer: mockScoreAnswer,
  generateInvestmentMemo: mockGenerateMemo,
}))

mock.module("../../lib/webhooks", () => ({
  dispatchWebhook: mockDispatchWebhook,
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { SessionService } from "./service"

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SessionService", () => {
  beforeEach(() => {
    mockSessionFindUnique.mockReset()
    mockQuestionFindMany.mockReset()
    mockQuestionFindUnique.mockReset()
    mockSessionUpdate.mockReset()
    mockCandidateFindUnique.mockReset()
    mockInterviewUpdate.mockReset()
    mockStartupFindUnique.mockReset()
    mockAnalysisFindMany.mockReset()
    mockMemoCreate.mockReset()
    mockStartupUpdate.mockReset()
    mockCandidateUpdate.mockReset()
    mockQuestionUpdate.mockReset()
    mockScoreAnswer.mockReset()
    mockDispatchWebhook.mockReset()
  })

  // ───── getSession ────────────────────────────────────────────────────

  describe("getSession", () => {
    it("returns session info, candidate, and questions for a valid token", async () => {
      mockSessionFindUnique.mockImplementationOnce(() =>
        Promise.resolve({
          ...mockSession,
          candidate: { companyName: "Alpha AI", applicantName: "Alice" },
        }),
      )
      mockQuestionFindMany.mockImplementationOnce(() => Promise.resolve(mockQuestions))

      const result = await SessionService.getSession(VALID_TOKEN)

      expect(result).toMatchObject({
        status: "IN_PROGRESS",
        candidate: { company_name: "Alpha AI", applicant_name: "Alice" },
      })
      expect(result.questions).toHaveLength(2)
      expect(result.questions.map((q) => q.answered)).toEqual([false, true])
    })

    it("throws 404 for an invalid token", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await SessionService.getSession("bad-token").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(404)
      expect(err.code).toBe("not_found")
    })

    it("throws 410 for an expired session", async () => {
      mockSessionFindUnique.mockImplementationOnce(() =>
        Promise.resolve({
          ...mockExpiredSession,
          candidate: { companyName: "Alpha AI", applicantName: null },
        }),
      )

      const caught: unknown = await SessionService.getSession(VALID_TOKEN).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(410)
      expect(err.code).toBe("expired")
    })
  })

  // ───── submitAnswer ──────────────────────────────────────────────────

  describe("submitAnswer", () => {
    it("scores an answer and returns score + feedback", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockSession))
      mockQuestionFindUnique.mockImplementationOnce(() => Promise.resolve(mockQuestions[0]))
      mockScoreAnswer.mockImplementationOnce(() =>
        Promise.resolve({ score: 92, feedback: "Strong vision." }),
      )
      mockQuestionUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await SessionService.submitAnswer(VALID_TOKEN, 1, "My vision is...")

      expect(result).toMatchObject({ question_id: 1, score: 92, feedback: "Strong vision." })
      expect(mockQuestionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockQuestions[0]!.id },
        }),
      )
    })

    it("throws 404 for an invalid session", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await SessionService.submitAnswer("bad", 1, "a").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 409 if session is already completed", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockCompletedSession))

      const caught: unknown = await SessionService.submitAnswer(VALID_TOKEN, 1, "a").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(409)
      expect((caught as ApiError).code).toBe("completed")
    })

    it("throws 410 and marks session expired when TTL passed", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockExpiredSession))
      mockSessionUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const caught: unknown = await SessionService.submitAnswer(VALID_TOKEN, 1, "a").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(410)
      expect(mockSessionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "EXPIRED" } }),
      )
    })

    it("transitions from PENDING to IN_PROGRESS on first answer", async () => {
      const pendingSession = { ...mockSession, status: "PENDING" }
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(pendingSession))
      mockSessionUpdate.mockImplementationOnce(() => Promise.resolve({ ...pendingSession, status: "IN_PROGRESS", startedAt: new Date() }))
      mockCandidateFindUnique.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockQuestionFindUnique.mockImplementationOnce(() => Promise.resolve(mockQuestions[1]))
      mockScoreAnswer.mockImplementationOnce(() => Promise.resolve({ score: 70, feedback: "OK" }))
      mockQuestionUpdate.mockImplementationOnce(() => Promise.resolve({}))

      await SessionService.submitAnswer(VALID_TOKEN, 2, "Some answer")

      expect(mockSessionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "IN_PROGRESS", startedAt: expect.any(Date) } }),
      )
      expect(mockDispatchWebhook).toHaveBeenCalledWith("org_1", "interview.started", expect.any(Object))
    })

    it("throws 404 when question doesn't belong to this interview", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockSession))
      mockQuestionFindUnique.mockImplementationOnce(() => Promise.resolve({ ...mockQuestions[0], interviewId: "other_int" }))

      const caught: unknown = await SessionService.submitAnswer(VALID_TOKEN, 1, "a").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── completeSession ───────────────────────────────────────────────

  describe("completeSession", () => {
    it("completes the interview and returns score + recommendation", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockSession))
      mockCandidateFindUnique.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockQuestionFindMany.mockImplementationOnce(() => Promise.resolve(mockQuestions))
      mockInterviewUpdate.mockImplementationOnce(() => Promise.resolve({}))
      mockStartupFindUnique.mockImplementationOnce(() =>
        Promise.resolve({
          id: "startup_1",
          name: "Alpha AI",
          website: null,
          industry: "AI",
          stage: "Seed",
          location: null,
          description: null,
          fundingRaised: BigInt(500000),
          status: "ANALYZING",
          organizationId: "org_1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      )
      mockAnalysisFindMany.mockImplementationOnce(() =>
        Promise.resolve([{ analysisType: "Market", score: 80, content: "Large market" }]),
      )
      mockGenerateMemo.mockImplementationOnce(() =>
        Promise.resolve({ recommendation: "invest", memo_content: "# Investment Memo\n\n..." }),
      )
      mockMemoCreate.mockImplementationOnce(() => Promise.resolve({}))
      mockStartupUpdate.mockImplementationOnce(() => Promise.resolve({}))
      mockCandidateUpdate.mockImplementationOnce(() => Promise.resolve({}))
      mockSessionUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await SessionService.completeSession(VALID_TOKEN)

      expect(result).toMatchObject({
        status: "COMPLETED",
        overallScore: 85,
        recommendation: "invest",
      })
      expect(mockInterviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "int_1" },
          data: { status: "COMPLETED", overallScore: 85 },
        }),
      )
      expect(mockDispatchWebhook).toHaveBeenCalledWith(
        "org_1", "candidate.completed", expect.any(Object),
      )
    })

    it("throws 404 for an invalid session", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await SessionService.completeSession("bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 409 if already completed", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockCompletedSession))

      const caught: unknown = await SessionService.completeSession(VALID_TOKEN).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(409)
    })

    it("throws 410 and marks expired when TTL passed", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockExpiredSession))
      mockSessionUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const caught: unknown = await SessionService.completeSession(VALID_TOKEN).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(410)
    })

    it("throws 404 when candidate is not found", async () => {
      mockSessionFindUnique.mockImplementationOnce(() => Promise.resolve(mockSession))
      mockCandidateFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await SessionService.completeSession(VALID_TOKEN).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })
})
