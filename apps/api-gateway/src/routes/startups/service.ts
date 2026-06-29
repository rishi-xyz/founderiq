import { prisma } from "@founderiq/database"
import { ApiError } from "../../middleware"
import {
  analyzeStartup,
  generateInterviewQuestions,
  scoreAnswer as aiScoreAnswer,
  generateInvestmentMemo,
} from "../../lib/ai"
import { uploadFile, deleteFile, generateKey, isAllowedMimeType, isWithinSizeLimit } from "../../lib/storage"

function toStartupInput(s: {
  id: string
  name: string
  website: string | null
  industry: string | null
  stage: string | null
  location: string | null
  description: string | null
  fundingRaised: bigint
  status: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    name: s.name,
    website: s.website,
    industry: s.industry,
    stage: s.stage,
    location: s.location,
    description: s.description,
    funding_raised: Number(s.fundingRaised),
    status: s.status,
    organization_id: s.organizationId,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  }
}

function toStartupJson(s: {
  id: string
  name: string
  website: string | null
  industry: string | null
  stage: string | null
  location: string | null
  description: string | null
  fundingRaised: bigint
  status: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    name: s.name,
    website: s.website,
    industry: s.industry,
    stage: s.stage,
    location: s.location,
    description: s.description,
    funding_raised: Number(s.fundingRaised),
    status: s.status,
    organization_id: s.organizationId,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  }
}

export interface ListFilters {
  search?: string
  industry?: string
  stage?: string
  status?: string
  limit: number
  offset: number
}

export abstract class StartupService {
  static async listStartups(organizationId: string, filters: ListFilters) {
    const where: any = { organizationId }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ]
    }
    if (filters.industry) where.industry = filters.industry
    if (filters.stage) where.stage = filters.stage
    if (filters.status) where.status = filters.status

    const startups = await prisma.startup.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    })

    return startups.map(toStartupJson)
  }

  static async getStartup(organizationId: string, id: string) {
    const startup = await prisma.startup.findFirst({
      where: { id, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")
    return toStartupJson(startup)
  }

  static async createStartup(
    organizationId: string,
    body: {
      name: string
      website?: string
      industry?: string
      stage?: string
      location?: string
      description?: string
      funding_raised?: number
    },
  ) {
    const startup = await prisma.startup.create({
      data: {
        name: body.name,
        website: body.website ?? null,
        industry: body.industry ?? null,
        stage: body.stage ?? null,
        location: body.location ?? null,
        description: body.description ?? null,
        fundingRaised: BigInt(body.funding_raised ?? 0),
        organizationId,
        status: "NEW",
      },
    })
    return toStartupJson(startup)
  }

  static async analyzeStartup(organizationId: string, id: string) {
    const startup = await prisma.startup.findFirst({
      where: { id, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    await prisma.startup.update({
      where: { id },
      data: { status: "ANALYZING" },
    })

    const analysis = await analyzeStartup(toStartupInput(startup))

    const dims: [string, { score: number; content: string }][] = [
      ["market", analysis.market],
      ["competitor", analysis.competitor],
      ["founder", analysis.founder],
      ["execution", analysis.execution],
      ["business_model", analysis.business_model],
      ["risk", analysis.risk],
    ]

    for (const [type, d] of dims) {
      await prisma.analysis.create({
        data: {
          startupId: id,
          analysisType: type,
          content: d.content,
          score: d.score,
        },
      })
    }

    await prisma.startup.update({
      where: { id },
      data: { status: "REVIEW" },
    })

    return { startup_id: id, analysis }
  }

  static async getAnalyses(organizationId: string, id: string) {
    const startup = await prisma.startup.findFirst({
      where: { id, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    const analyses = await prisma.analysis.findMany({
      where: { startupId: id },
      orderBy: { createdAt: "desc" },
    })

    return analyses.map((a) => ({
      id: a.id,
      analysis_type: a.analysisType,
      score: a.score,
      content: a.content,
      created_at: a.createdAt.toISOString(),
    }))
  }

  static async scheduleInterview(organizationId: string, id: string) {
    const startup = await prisma.startup.findFirst({
      where: { id, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    let interview = await prisma.interview.findFirst({
      where: { startupId: id, status: { not: "COMPLETED" } },
      orderBy: { createdAt: "desc" },
    })

    if (!interview) {
      interview = await prisma.interview.create({
        data: {
          startupId: id,
          status: "IN_PROGRESS",
        },
      })

      const analysis = await analyzeStartup(toStartupInput(startup))

      const questions = await generateInterviewQuestions(
        toStartupInput(startup),
        analysis,
      )

      for (let i = 0; i < questions.length; i++) {
        await prisma.interviewQuestion.create({
          data: {
            interviewId: interview.id,
            category: questions[i]!.category,
            question: questions[i]!.question,
            sortOrder: i,
          },
        })
      }
    }

    await prisma.startup.update({
      where: { id },
      data: { status: "INTERVIEWING" },
    })

    const existingQuestions = await prisma.interviewQuestion.findMany({
      where: { interviewId: interview.id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    })

    return {
      interview: {
        id: interview.id,
        status: interview.status,
        overall_score: interview.overallScore,
        created_at: interview.createdAt.toISOString(),
      },
      questions: existingQuestions.map((q) => ({
        id: q.id,
        category: q.category,
        question: q.question,
        answer: q.answer,
        score: q.score,
      })),
    }
  }

  static async getInterview(organizationId: string, id: string) {
    const startup = await prisma.startup.findFirst({
      where: { id, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    const interview = await prisma.interview.findFirst({
      where: { startupId: id },
      orderBy: { createdAt: "desc" },
    })
    if (!interview) throw new ApiError(404, "no_interview", "No interview found.")

    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: interview.id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    })

    return {
      id: interview.id,
      status: interview.status,
      overall_score: interview.overallScore,
      created_at: interview.createdAt.toISOString(),
      questions: questions.map((q) => ({
        id: q.id,
        category: q.category,
        question: q.question,
        answer: q.answer,
        score: q.score,
      })),
    }
  }

  static async getMemo(organizationId: string, id: string) {
    const startup = await prisma.startup.findFirst({
      where: { id, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    const memo = await prisma.investmentMemo.findFirst({
      where: { startupId: id },
      orderBy: { createdAt: "desc" },
    })
    if (!memo) throw new ApiError(404, "no_memo", "No investment memo available yet.")

    return {
      id: memo.id,
      recommendation: memo.recommendation,
      memo_content: memo.memoContent,
      created_at: memo.createdAt.toISOString(),
    }
  }

  static async generateMemo(organizationId: string, id: string) {
    const startup = await prisma.startup.findFirst({
      where: { id, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    const analyses = await prisma.analysis.findMany({
      where: { startupId: id },
    })
    if (analyses.length === 0) {
      throw new ApiError(400, "no_analyses", "Run analysis before generating a memo.")
    }

    const summary = analyses
      .map((a) => `${a.analysisType} (score ${a.score}): ${a.content}`)
      .join("\n")

    const result = await generateInvestmentMemo(toStartupInput(startup), summary)

    const memo = await prisma.investmentMemo.create({
      data: {
        startupId: id,
        recommendation: result.recommendation,
        memoContent: result.memo_content,
      },
    })

    await prisma.startup.update({
      where: { id },
      data: { status: "COMPLETED" },
    })

    return {
      id: memo.id,
      recommendation: memo.recommendation,
      memo_content: memo.memoContent,
      created_at: memo.createdAt.toISOString(),
    }
  }

  static async scoreAnswer(questionId: string, answer: string) {
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
    })
    if (!question) throw new ApiError(404, "not_found", "Question not found.")

    const result = await aiScoreAnswer(question.question, answer)

    await prisma.interviewQuestion.update({
      where: { id: questionId },
      data: { answer, score: result.score },
    })

    return {
      question_id: questionId,
      score: result.score,
      feedback: result.feedback,
    }
  }

  static async completeInterview(organizationId: string, startupId: string, interviewId: string) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, startupId },
    })
    if (!interview) throw new ApiError(404, "not_found", "Interview not found.")

    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId },
    })
    const scored = questions.filter((q) => q.score != null)
    const avg = scored.length
      ? Math.round(scored.reduce((sum, q) => sum + (q.score ?? 0), 0) / scored.length)
      : 0

    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED", overallScore: avg },
    })

    return { overall_score: avg }
  }

  static async uploadDocument(
    organizationId: string,
    startupId: string,
    file: File,
  ) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    if (!isAllowedMimeType(file.type)) {
      throw new ApiError(422, "invalid_file_type", `File type "${file.type}" is not allowed.`)
    }

    if (!isWithinSizeLimit(file.size)) {
      throw new ApiError(422, "file_too_large", "File exceeds 50 MB limit.")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = generateKey(startupId, file.name)
    const url = await uploadFile(key, buffer, file.type)

    const doc = await prisma.document.create({
      data: {
        startupId,
        fileType: file.type,
        fileUrl: url,
        fileName: file.name,
        uploadStatus: "COMPLETE",
      },
    })

    return {
      id: doc.id,
      file_type: doc.fileType,
      file_url: doc.fileUrl,
      file_name: doc.fileName,
      created_at: doc.createdAt.toISOString(),
    }
  }

  static async listDocuments(organizationId: string, startupId: string) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    const documents = await prisma.document.findMany({
      where: { startupId },
      orderBy: { createdAt: "desc" },
    })

    return documents.map((d) => ({
      id: d.id,
      file_type: d.fileType,
      file_url: d.fileUrl,
      file_name: d.fileName,
      upload_status: d.uploadStatus,
      created_at: d.createdAt.toISOString(),
    }))
  }

  static async deleteDocument(organizationId: string, startupId: string, docId: string) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, organizationId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Startup not found.")

    const doc = await prisma.document.findFirst({
      where: { id: docId, startupId },
    })
    if (!doc) throw new ApiError(404, "not_found", "Document not found.")

    if (doc.fileUrl) {
      const publicUrl = process.env.R2_PUBLIC_URL ?? ""
      const key = publicUrl ? doc.fileUrl.replace(`${publicUrl}/`, "") : doc.fileUrl
      await deleteFile(key).catch(() => {})
    }

    await prisma.document.delete({ where: { id: docId } })

    return { deleted: true }
  }
}
