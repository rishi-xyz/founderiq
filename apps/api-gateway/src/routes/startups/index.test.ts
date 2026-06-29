import { describe, it, expect, mock, beforeEach } from "bun:test"
import { ApiError } from "../../middleware"

const ORG_ID = "org_1"
const STARTUP_ID = "startup_1"
const NOW = new Date()

const mockStartupCreate = mock<(q: any) => Promise<any>>()
const mockStartupFindFirst = mock<(q: any) => Promise<any>>()
const mockStartupFindMany = mock<(q: any) => Promise<any>>()
const mockStartupUpdate = mock<(q: any) => Promise<any>>()
const mockAnalysisCreate = mock<(q: any) => Promise<any>>()
const mockAnalysisFindMany = mock<(q: any) => Promise<any>>()
const mockInterviewCreate = mock<(q: any) => Promise<any>>()
const mockInterviewFindFirst = mock<(q: any) => Promise<any>>()
const mockInterviewUpdate = mock<(q: any) => Promise<any>>()
const mockQuestionCreate = mock<(q: any) => Promise<any>>()
const mockQuestionFindMany = mock<(q: any) => Promise<any>>()
const mockQuestionFindUnique = mock<(q: any) => Promise<any>>()
const mockQuestionUpdate = mock<(q: any) => Promise<any>>()
const mockMemoCreate = mock<(q: any) => Promise<any>>()
const mockMemoFindFirst = mock<(q: any) => Promise<any>>()

const mockAnalyzeAi = mock<(s: any) => Promise<any>>()
const mockGenerateQuestions = mock<(s: any, a: any) => Promise<any>>()
const mockScoreAnswerAi = mock<(q: string, a: string) => Promise<any>>()
const mockGenerateMemo = mock<(s: any, summary: string) => Promise<any>>()

const mockDocumentCreate = mock<(q: any) => Promise<any>>()
const mockDocumentFindMany = mock<(q: any) => Promise<any>>()
const mockDocumentFindFirst = mock<(q: any) => Promise<any>>()
const mockDocumentDelete = mock<(q: any) => Promise<any>>()
const mockUploadFile = mock<(key: string, buffer: Buffer, type: string) => Promise<string>>()
const mockDeleteFile = mock<(key: string) => Promise<void>>()
const mockGenerateKey = mock<(id: string, name: string) => string>()

mock.module("@founderiq/database", () => ({
  prisma: {
    startup: {
      create: mockStartupCreate,
      findFirst: mockStartupFindFirst,
      findMany: mockStartupFindMany,
      update: mockStartupUpdate,
    },
    analysis: {
      create: mockAnalysisCreate,
      findMany: mockAnalysisFindMany,
    },
    interview: {
      create: mockInterviewCreate,
      findFirst: mockInterviewFindFirst,
      update: mockInterviewUpdate,
    },
    interviewQuestion: {
      create: mockQuestionCreate,
      findMany: mockQuestionFindMany,
      findUnique: mockQuestionFindUnique,
      update: mockQuestionUpdate,
    },
    investmentMemo: {
      create: mockMemoCreate,
      findFirst: mockMemoFindFirst,
    },
    document: {
      create: mockDocumentCreate,
      findMany: mockDocumentFindMany,
      findFirst: mockDocumentFindFirst,
      delete: mockDocumentDelete,
    },
  },
}))

mock.module("../../lib/ai", () => ({
  analyzeStartup: mockAnalyzeAi,
  generateInterviewQuestions: mockGenerateQuestions,
  scoreAnswer: mockScoreAnswerAi,
  generateInvestmentMemo: mockGenerateMemo,
}))

mock.module("../../lib/storage", () => ({
  uploadFile: mockUploadFile,
  deleteFile: mockDeleteFile,
  generateKey: mockGenerateKey,
  isAllowedMimeType: (t: string) => t.startsWith("image/") || t === "application/pdf",
  isWithinSizeLimit: () => true,
}))

import { StartupService } from "./service"

const mockStartup = {
  id: STARTUP_ID,
  name: "Alpha AI",
  website: null,
  industry: "AI",
  stage: "Seed",
  location: null,
  description: "AI company",
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
  id: "memo_1",
  recommendation: "invest",
  memoContent: "# Investment Memo\n\n...",
  createdAt: NOW,
  updatedAt: NOW,
  startupId: STARTUP_ID,
}

describe("StartupService", () => {
  beforeEach(() => {
    ;[
      mockStartupCreate, mockStartupFindFirst, mockStartupFindMany, mockStartupUpdate,
      mockAnalysisCreate, mockAnalysisFindMany,
      mockInterviewCreate, mockInterviewFindFirst, mockInterviewUpdate,
      mockQuestionCreate, mockQuestionFindMany, mockQuestionFindUnique, mockQuestionUpdate,
      mockMemoCreate, mockMemoFindFirst,
      mockDocumentCreate, mockDocumentFindMany, mockDocumentFindFirst, mockDocumentDelete,
      mockUploadFile, mockDeleteFile,
      mockAnalyzeAi, mockGenerateQuestions, mockScoreAnswerAi, mockGenerateMemo,
    ].forEach((fn) => fn.mockReset())
  })

  // ───── listStartups ──────────────────────────────────────────────────

  describe("listStartups", () => {
    it("returns all startups for the org", async () => {
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve([mockStartup]))

      const result = await StartupService.listStartups(ORG_ID, { limit: 50, offset: 0 })

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe("Alpha AI")
      expect(result[0]!.funding_raised).toBe(500000)
    })

    it("passes search filter as OR condition", async () => {
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve([mockStartup]))

      await StartupService.listStartups(ORG_ID, { search: "AI", limit: 50, offset: 0 })

      expect(mockStartupFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: "AI", mode: "insensitive" } }),
            ]),
          }),
        }),
      )
    })

    it("filters by industry, stage, and status", async () => {
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve([]))

      await StartupService.listStartups(ORG_ID, {
        industry: "AI", stage: "Seed", status: "NEW", limit: 10, offset: 5,
      })

      expect(mockStartupFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            industry: "AI", stage: "Seed", status: "NEW",
          }),
          take: 10, skip: 5,
        }),
      )
    })

    it("returns empty array when no startups match", async () => {
      mockStartupFindMany.mockImplementationOnce(() => Promise.resolve([]))

      const result = await StartupService.listStartups(ORG_ID, { limit: 50, offset: 0 })

      expect(result).toEqual([])
    })
  })

  // ───── getStartup ────────────────────────────────────────────────────

  describe("getStartup", () => {
    it("returns startup data", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))

      const result = await StartupService.getStartup(ORG_ID, STARTUP_ID)

      expect(result).toMatchObject({ id: STARTUP_ID, name: "Alpha AI" })
    })

    it("throws 404 when not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.getStartup(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── createStartup ─────────────────────────────────────────────────

  describe("createStartup", () => {
    it("creates and returns a startup with status NEW", async () => {
      mockStartupCreate.mockImplementationOnce(() => Promise.resolve(mockStartup))

      const result = await StartupService.createStartup(ORG_ID, { name: "Alpha AI" })

      expect(result).toMatchObject({ name: "Alpha AI", status: "NEW" })
      expect(mockStartupCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Alpha AI", status: "NEW" }),
        }),
      )
    })
  })

  // ───── analyzeStartup ────────────────────────────────────────────────

  describe("analyzeStartup", () => {
    it("runs AI analysis and saves 6 analysis records", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockStartupUpdate.mockImplementationOnce(() => Promise.resolve({}))
      mockAnalyzeAi.mockImplementationOnce(() => Promise.resolve(mockAnalysis))
      mockAnalysisCreate.mockImplementation(() => Promise.resolve({}))
      mockStartupUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await StartupService.analyzeStartup(ORG_ID, STARTUP_ID)

      expect(result.startup_id).toBe(STARTUP_ID)
      expect(result.analysis).toMatchObject(mockAnalysis)
      expect(mockAnalysisCreate).toHaveBeenCalledTimes(6)
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.analyzeStartup(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── getAnalyses ───────────────────────────────────────────────────

  describe("getAnalyses", () => {
    it("returns analyses for a startup", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockAnalysisFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "a1", analysisType: "market", score: 80, content: "Large market", createdAt: NOW },
        ]),
      )

      const result = await StartupService.getAnalyses(ORG_ID, STARTUP_ID)

      expect(result).toHaveLength(1)
      expect(result[0]!.analysis_type).toBe("market")
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.getAnalyses(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── scheduleInterview ─────────────────────────────────────────────

  describe("scheduleInterview", () => {
    it("creates a new interview with questions", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(null))
      mockInterviewCreate.mockImplementationOnce(() => Promise.resolve(mockInterview))
      mockAnalyzeAi.mockImplementationOnce(() => Promise.resolve(mockAnalysis))
      mockGenerateQuestions.mockImplementationOnce(() => Promise.resolve(mockQuestions))
      mockQuestionCreate.mockImplementation(() => Promise.resolve({}))
      mockStartupUpdate.mockImplementationOnce(() => Promise.resolve({}))
      mockQuestionFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "q_1", category: "Vision", question: "What is your vision?", answer: null, score: null },
          { id: "q_2", category: "Market", question: "Market size?", answer: null, score: null },
        ]),
      )

      const result = await StartupService.scheduleInterview(ORG_ID, STARTUP_ID)

      expect(result.interview.id).toBe("int_1")
      expect(result.questions).toHaveLength(2)
      expect(mockGenerateQuestions).toHaveBeenCalledTimes(1)
      expect(mockQuestionCreate).toHaveBeenCalledTimes(2)
    })

    it("reuses an existing active interview", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewFindFirst.mockImplementationOnce(() =>
        Promise.resolve({ ...mockInterview, status: "IN_PROGRESS" }),
      )
      mockStartupUpdate.mockImplementationOnce(() => Promise.resolve({}))
      mockQuestionFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "q_1", category: "Vision", question: "What is your vision?", answer: null, score: null },
        ]),
      )

      const result = await StartupService.scheduleInterview(ORG_ID, STARTUP_ID)

      expect(result.interview.id).toBe("int_1")
      expect(mockInterviewCreate).not.toHaveBeenCalled()
      expect(mockGenerateQuestions).not.toHaveBeenCalled()
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.scheduleInterview(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── getInterview ──────────────────────────────────────────────────

  describe("getInterview", () => {
    it("returns interview with questions", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(mockInterview))
      mockQuestionFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "q_1", category: "Vision", question: "What is your vision?", answer: null, score: null },
        ]),
      )

      const result = await StartupService.getInterview(ORG_ID, STARTUP_ID)

      expect(result).toMatchObject({ id: "int_1", status: "IN_PROGRESS" })
      expect(result.questions).toHaveLength(1)
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.getInterview(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when no interview exists", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.getInterview(ORG_ID, STARTUP_ID).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
      expect((caught as ApiError).code).toBe("no_interview")
    })
  })

  // ───── getMemo ───────────────────────────────────────────────────────

  describe("getMemo", () => {
    it("returns the latest memo", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockMemoFindFirst.mockImplementationOnce(() => Promise.resolve(mockMemo))

      const result = await StartupService.getMemo(ORG_ID, STARTUP_ID)

      expect(result).toMatchObject({ id: "memo_1", recommendation: "invest" })
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.getMemo(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when no memo exists", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockMemoFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.getMemo(ORG_ID, STARTUP_ID).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
      expect((caught as ApiError).code).toBe("no_memo")
    })
  })

  // ───── generateMemo ──────────────────────────────────────────────────

  describe("generateMemo", () => {
    it("generates and saves a memo, marks startup COMPLETED", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockAnalysisFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { analysisType: "market", score: 80, content: "Large market" },
        ]),
      )
      mockGenerateMemo.mockImplementationOnce(() =>
        Promise.resolve({ recommendation: "invest", memo_content: "# Memo" }),
      )
      mockMemoCreate.mockImplementationOnce(() => Promise.resolve(mockMemo))
      mockStartupUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await StartupService.generateMemo(ORG_ID, STARTUP_ID)

      expect(result).toMatchObject({ recommendation: "invest" })
      expect(mockStartupUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "COMPLETED" } }),
      )
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.generateMemo(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 400 when no analyses exist", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockAnalysisFindMany.mockImplementationOnce(() => Promise.resolve([]))

      const caught: unknown = await StartupService.generateMemo(ORG_ID, STARTUP_ID).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(400)
      expect((caught as ApiError).code).toBe("no_analyses")
    })
  })

  // ───── scoreAnswer ───────────────────────────────────────────────────

  describe("scoreAnswer", () => {
    it("scores an answer and updates the question", async () => {
      mockQuestionFindUnique.mockImplementationOnce(() =>
        Promise.resolve({ id: "q_1", question: "What is your vision?" }),
      )
      mockScoreAnswerAi.mockImplementationOnce(() =>
        Promise.resolve({ score: 85, feedback: "Clear vision." }),
      )
      mockQuestionUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await StartupService.scoreAnswer("q_1", "My vision is...")

      expect(result).toMatchObject({ question_id: "q_1", score: 85, feedback: "Clear vision." })
    })

    it("throws 404 when question not found", async () => {
      mockQuestionFindUnique.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.scoreAnswer("bad", "answer").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── completeInterview ─────────────────────────────────────────────

  describe("completeInterview", () => {
    it("calculates average score and marks interview COMPLETED", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(mockInterview))
      mockQuestionFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { score: 80 },
          { score: 90 },
          { score: null },
        ]),
      )
      mockInterviewUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await StartupService.completeInterview(ORG_ID, STARTUP_ID, "int_1")

      expect(result.overall_score).toBe(85)
      expect(mockInterviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "int_1" },
          data: { status: "COMPLETED", overallScore: 85 },
        }),
      )
    })

    it("returns 0 when no questions are scored", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(mockInterview))
      mockQuestionFindMany.mockImplementationOnce(() =>
        Promise.resolve([{ score: null }, { score: null }]),
      )
      mockInterviewUpdate.mockImplementationOnce(() => Promise.resolve({}))

      const result = await StartupService.completeInterview(ORG_ID, STARTUP_ID, "int_1")

      expect(result.overall_score).toBe(0)
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.completeInterview(ORG_ID, "bad", "int_1").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when interview not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockInterviewFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.completeInterview(ORG_ID, STARTUP_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── uploadDocument ────────────────────────────────────────────────

  describe("uploadDocument", () => {
    it("uploads file to R2 and creates document record", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockGenerateKey.mockImplementationOnce(() => "startups/startup_1/123-test.pdf")
      mockUploadFile.mockImplementationOnce(() => Promise.resolve("https://pub.r2.dev/startups/startup_1/123-test.pdf"))
      mockDocumentCreate.mockImplementationOnce(() => Promise.resolve({
        id: "doc_1",
        fileType: "application/pdf",
        fileUrl: "https://pub.r2.dev/startups/startup_1/123-test.pdf",
        fileName: "pitch.pdf",
        createdAt: NOW,
      }))

      const file = new File(["fake-content"], "pitch.pdf", { type: "application/pdf" })
      const result = await StartupService.uploadDocument(ORG_ID, STARTUP_ID, file)

      expect(result).toMatchObject({
        id: "doc_1",
        file_type: "application/pdf",
        file_name: "pitch.pdf",
      })
      expect(mockUploadFile).toHaveBeenCalledTimes(1)
      expect(mockDocumentCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startupId: STARTUP_ID, fileName: "pitch.pdf" }),
        }),
      )
    })

    it("throws 422 for disallowed file type", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))

      const file = new File(["bad"], "script.exe", { type: "application/x-msdownload" })
      const caught: unknown = await StartupService.uploadDocument(ORG_ID, STARTUP_ID, file).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(422)
      expect((caught as ApiError).code).toBe("invalid_file_type")
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const file = new File(["ok"], "doc.pdf", { type: "application/pdf" })
      const caught: unknown = await StartupService.uploadDocument(ORG_ID, "bad", file).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── listDocuments ─────────────────────────────────────────────────

  describe("listDocuments", () => {
    it("returns documents for a startup", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockDocumentFindMany.mockImplementationOnce(() =>
        Promise.resolve([
          { id: "doc_1", fileType: "application/pdf", fileUrl: "https://r2.dev/doc.pdf", fileName: "pitch.pdf", uploadStatus: "COMPLETE", createdAt: NOW },
        ]),
      )

      const result = await StartupService.listDocuments(ORG_ID, STARTUP_ID)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ file_type: "application/pdf", file_name: "pitch.pdf" })
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.listDocuments(ORG_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })

  // ───── deleteDocument ────────────────────────────────────────────────

  describe("deleteDocument", () => {
    it("deletes file from R2 and removes document record", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockDocumentFindFirst.mockImplementationOnce(() =>
        Promise.resolve({
          id: "doc_1",
          fileUrl: "https://r2.dev/startups/startup_1/doc.pdf",
          startupId: STARTUP_ID,
        }),
      )
      mockDeleteFile.mockImplementationOnce(() => Promise.resolve())
      mockDocumentDelete.mockImplementationOnce(() => Promise.resolve({}))

      const result = await StartupService.deleteDocument(ORG_ID, STARTUP_ID, "doc_1")

      expect(result).toEqual({ deleted: true })
      expect(mockDeleteFile).toHaveBeenCalledTimes(1)
      expect(mockDocumentDelete).toHaveBeenCalledWith({ where: { id: "doc_1" } })
    })

    it("throws 404 when startup not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.deleteDocument(ORG_ID, "bad", "doc_1").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })

    it("throws 404 when document not found", async () => {
      mockStartupFindFirst.mockImplementationOnce(() => Promise.resolve(mockStartup))
      mockDocumentFindFirst.mockImplementationOnce(() => Promise.resolve(null))

      const caught: unknown = await StartupService.deleteDocument(ORG_ID, STARTUP_ID, "bad").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      expect((caught as ApiError).status).toBe(404)
    })
  })
})
