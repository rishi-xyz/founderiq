import { describe, it, expect, mock, beforeEach } from "bun:test"
import { ApiError } from "../../middleware"

const ORG_ID = "org_1"
const CANDIDATE_ID = "cand_1"
const STARTUP_ID = "startup_1"
const NOW = new Date()

const mockStartupCreate = mock<(q: any) => Promise<any>>()
const mockCandidateCreate = mock<(q: any) => Promise<any>>()
const mockCandidateFindFirst = mock<(q: any) => Promise<any>>()
const mockCandidateFindMany = mock<(q: any) => Promise<any>>()
const mockCandidateUpdate = mock<(q: any) => Promise<any>>()
const mockStartupFindUnique = mock<(q: any) => Promise<any>>()
const mockStartupUpdate = mock<(q: any) => Promise<any>>()
const mockAnalysisCreate = mock<(q: any) => Promise<any>>()
const mockAnalysisFindMany = mock<(q: any) => Promise<any>>()
const mockInterviewCreate = mock<(q: any) => Promise<any>>()
const mockInterviewFindFirst = mock<(q: any) => Promise<any>>()
const mockInterviewQuestionCreate = mock<(q: any) => Promise<any>>()
const mockInterviewQuestionFindMany = mock<(q: any) => Promise<any>>()
const mockInterviewSessionCreate = mock<(q: any) => Promise<any>>()
const mockInvestmentMemoFindFirst = mock<(q: any) => Promise<any>>()

const mockAnalyzeStartup = mock<(s: any) => Promise<any>>()
const mockGenerateQuestions = mock<(s: any, a: any) => Promise<any>>()
const mockDispatchWebhook = mock<(...args: any[]) => Promise<void>>()

mock.module("@founderiq/database", () => ({
  prisma: {
    startup: {
      create: mockStartupCreate,
      findUnique: mockStartupFindUnique,
      update: mockStartupUpdate,
    },
    candidate: {
      create: mockCandidateCreate,
      findFirst: mockCandidateFindFirst,
      findMany: mockCandidateFindMany,
      update: mockCandidateUpdate,
    },
    analysis: {
      create: mockAnalysisCreate,
      findMany: mockAnalysisFindMany,
    },
    interview: {
      create: mockInterviewCreate,
      findFirst: mockInterviewFindFirst,
    },
    interviewQuestion: {
      create: mockInterviewQuestionCreate,
      findMany: mockInterviewQuestionFindMany,
    },
    interviewSession: {
      create: mockInterviewSessionCreate,
    },
    investmentMemo: {
      findFirst: mockInvestmentMemoFindFirst,
    },
  },
}))

mock.module("../../lib/ai", () => ({
  analyzeStartup: mockAnalyzeStartup,
  generateInterviewQuestions: mockGenerateQuestions,
}))

mock.module("../../lib/webhooks", () => ({
  dispatchWebhook: mockDispatchWebhook,
}))

import { CandidateService } from "./service"

const mockCandidate = {
  id: CANDIDATE_ID,
  externalId: "ext_1",
  applicantName: "Alice",
  applicantEmail: "alice@example.com",
  companyName: "Alpha AI",
  metadata: {},
  status: "RECIEVED",
  organizationId: ORG_ID,
  startupId: STARTUP_ID,
  createdAt: NOW,
  updatedAt: NOW,
}

const mockStartup = {
  id: STARTUP_ID,
  name: "Alpha AI",
  website: null,
  industry: "AI",
  stage: "Seed",
  location: null,
  description: null,
  fundingRaised: BigInt(500000),
  status: "NEW",
  organizationId: ORG_ID,
  createdAt: NOW,
  updatedAt: NOW,
}

const mockAnalysis = {
  market: { score: 80, content: "Large market" },
  competitor: { score: 70, content: "Few competitors" },
  founder: { score: 90, content: "Strong team" },
  execution: { score: 75, content: "Good progress" },
  business_model: { score: 65, content: "SaaS model" },
  risk: { score: 50, content: "Regulatory risk" },
}

const mockQuestions = [
  { category: "Vision", question: "What is your vision?" },
  { category: "Market", question: "Market size?" },
]

const mockInterview = {
  id: "int_1",
  status: "IN_PROGRESS",
  overallScore: null,
  startupId: STARTUP_ID,
  createdAt: NOW,
  updatedAt: NOW,
}

const mockMemo = {
  recommendation: "invest",
  memoContent: "# Investment Memo\n\n...",
  createdAt: NOW,
  updatedAt: NOW,
  startupId: STARTUP_ID,
  id: "memo_1",
}

describe("CandidateService", () => {
  beforeEach(() => {
    mockStartupCreate.mockReset()
    mockCandidateCreate.mockReset()
    mockCandidateFindFirst.mockReset()
    mockCandidateFindMany.mockReset()
    mockCandidateUpdate.mockReset()
    mockStartupFindUnique.mockReset()
    mockStartupUpdate.mockReset()
    mockAnalysisCreate.mockReset()
    mockAnalysisFindMany.mockReset()
    mockInterviewCreate.mockReset()
    mockInterviewFindFirst.mockReset()
    mockInterviewQuestionCreate.mockReset()
    mockInterviewQuestionFindMany.mockReset()
    mockInterviewSessionCreate.mockReset()
    mockInvestmentMemoFindFirst.mockReset()
    mockAnalyzeStartup.mockReset()
    mockGenerateQuestions.mockReset()
    mockDispatchWebhook.mockReset()
  })

  // ───── createCandidate ──────────────────────────────────────────────

  describe("createCandidate", () => {
    it("creates startup + candidate and returns data", async () => {
      mockStartupCreate.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockCandidateCreate.mockImplementationOnce(() => Promise.resolve(mockCandidate))

      const result = await CandidateService.createCandidate(ORG_ID, {
        company_name: "Alpha AI",
        applicant_name: "Alice",
        external_id: "ext_1",
      })

      expect(result).toMatchObject({
        id: CANDIDATE_ID,
        company_name: "Alpha AI",
        applicant_name: "Alice",
        status: "RECIEVED",
      })
      expect(mockStartupCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Alpha AI", organizationId: ORG_ID }),
        }),
      )
      expect(mockDispatchWebhook).toHaveBeenCalledWith(ORG_ID, "candidate.received", expect.any(Object))
    })
  })

  // ───── listCandidates ───────────────────────────────────────────────

  describe("listCandidates", () => {
    it("returns paginated candidates", async () => {
      mockCandidateFindMany.mockImplementationOnce(() => Promise.resolve([mockCandidate]))

      const result = await CandidateService.listCandidates(ORG_ID, 10, 0)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ id: CANDIDATE_ID, company_name: "Alpha AI" })
      expect(mockCandidateFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 0 }),
      )
    })

    it("returns empty array for org with no candidates", async () => {
      mockCandidateFindMany.mockImplementationOnce(() => Promise.resolve([]))

      const result = await CandidateService.listCandidates(ORG_ID, 50, 0)

      expect(result).toEqual([])
    })
  })

  // ───── getCandidate ─────────────────────────────────────────────────

  describe("getCandidate", () => {
    it("returns candidate data for a valid id", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))

      const result = await CandidateService.getCandidate(ORG_ID, CANDIDATE_ID)

      expect(result).toMatchObject({ id: CANDIDATE_ID, company_name: "Alpha AI" })
    })

    it("throws 404 when candidate not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.getCandidate(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── analyzeCandidate ─────────────────────────────────────────────

  describe("analyzeCandidate", () => {
    it("runs AI analysis and saves results", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockCandidateUpdate.mockImplementationOnce(() => Promise.resolve({ ...mockCandidate, status: "ANALYZING" }))
      mockStartupFindUnique.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockAnalyzeStartup.mockImplementationOnce(() => Promise.resolve(mockAnalysis))
      mockAnalysisCreate.mockImplementation(() => Promise.resolve({}))
      mockStartupUpdate.mockImplementationOnce(() => Promise.resolve({}))
      mockCandidateUpdate.mockImplementationOnce(() => Promise.resolve({ ...mockCandidate, status: "ANALYZED" }))
      mockAnalysisFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "a1", analysisType: "market", score: 80, content: "Large market", createdAt: NOW },
          { id: "a2", analysisType: "competitor", score: 70, content: "Few competitors", createdAt: NOW },
          { id: "a3", analysisType: "founder", score: 90, content: "Strong team", createdAt: NOW },
          { id: "a4", analysisType: "execution", score: 75, content: "Good progress", createdAt: NOW },
          { id: "a5", analysisType: "business_model", score: 65, content: "SaaS model", createdAt: NOW },
          { id: "a6", analysisType: "risk", score: 50, content: "Regulatory risk", createdAt: NOW },
        ]),
      )

      const result = await CandidateService.analyzeCandidate(ORG_ID, CANDIDATE_ID)

      expect(result).toMatchObject({ candidate_id: CANDIDATE_ID })
      expect(result.analyses).toHaveLength(6)
      expect(mockAnalysisCreate).toHaveBeenCalledTimes(6)
      expect(mockDispatchWebhook).toHaveBeenCalledWith(ORG_ID, "candidate.analyzed", expect.any(Object))
    })

    it("throws 404 when candidate not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.analyzeCandidate(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when backing startup not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockCandidateUpdate.mockImplementationOnce(() => Promise.resolve({ ...mockCandidate, status: "ANALYZING" }))
      mockStartupFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.analyzeCandidate(ORG_ID, CANDIDATE_ID).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── getAnalysis ──────────────────────────────────────────────────

  describe("getAnalysis", () => {
    it("returns analyses for a candidate", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockAnalysisFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "a1", analysisType: "market", score: 80, content: "Large market", createdAt: NOW },
        ]),
      )

      const result = await CandidateService.getAnalysis(ORG_ID, CANDIDATE_ID)

      expect(result.candidate_id).toBe(CANDIDATE_ID)
      expect(result.analyses).toHaveLength(1)
    })

    it("throws 404 when candidate not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.getAnalysis(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── scheduleInterview ────────────────────────────────────────────

  describe("scheduleInterview", () => {
    it("creates interview + questions + session and returns interview URL", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockStartupFindUnique.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewCreate.mockImplementationOnce(() => Promise.resolve(mockInterview))
      mockAnalyzeStartup.mockImplementationOnce(() => Promise.resolve(mockAnalysis))
      mockGenerateQuestions.mockImplementationOnce(() => Promise.resolve(mockQuestions))
      mockInterviewQuestionCreate.mockImplementation(() => Promise.resolve({}))
      mockInterviewSessionCreate.mockImplementationOnce(() => Promise.resolve({}))
      mockCandidateUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await CandidateService.scheduleInterview(ORG_ID, CANDIDATE_ID)

      expect(result).toMatchObject({
        candidate_id: CANDIDATE_ID,
        interview_id: "int_1",
      })
      expect(result.interview_url).toContain("/interview/session/")
      expect(mockGenerateQuestions).toHaveBeenCalledTimes(1)
      expect(mockInterviewQuestionCreate).toHaveBeenCalledTimes(2)
      expect(mockDispatchWebhook).toHaveBeenCalledWith(ORG_ID, "interview.scheduled", expect.any(Object))
    })

    it("throws 404 when candidate not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.scheduleInterview(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when backing startup not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockStartupFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.scheduleInterview(ORG_ID, CANDIDATE_ID).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── getInterview ─────────────────────────────────────────────────

  describe("getInterview", () => {
    it("returns interview status with questions", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(mockInterview))
      mockInterviewQuestionFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "q_1", category: "Vision", question: "What is your vision?", answer: null, score: null },
          { id: "q_2", category: "Market", question: "Market size?", answer: "Large", score: 85 },
        ]),
      )

      const result = await CandidateService.getInterview(ORG_ID, CANDIDATE_ID)

      expect(result).toMatchObject({
        candidate_id: CANDIDATE_ID,
        interview_id: "int_1",
        status: "IN_PROGRESS",
      })
      expect(result.questions).toHaveLength(2)
    })

    it("throws 404 when candidate not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.getInterview(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when no interview exists", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.getInterview(ORG_ID, CANDIDATE_ID).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
      expect((caught as ApiError).code).toBe("no_interview")
    })
  })

  // ───── getMemo ──────────────────────────────────────────────────────

  describe("getMemo", () => {
    it("returns the latest investment memo", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockInvestmentMemoFindFirst.mockImplementationOnce(() => Promise.resolve(mockMemo))

      const result = await CandidateService.getMemo(ORG_ID, CANDIDATE_ID)

      expect(result).toMatchObject({
        candidate_id: CANDIDATE_ID,
        recommendation: "invest",
      })
    })

    it("throws 404 when candidate not found", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.getMemo(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when no memo exists", async () => {
      mockCandidateFindFirst.mockImplementationOnce(() => Promise.resolve(mockCandidate))
      mockInvestmentMemoFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await CandidateService.getMemo(ORG_ID, CANDIDATE_ID).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
      expect((caught as ApiError).code).toBe("no_memo")
    })
  })
})
