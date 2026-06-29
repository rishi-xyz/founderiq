import { prisma } from "@founderiq/database"
import { ApiError } from "../../middleware"
import { analyzeStartup, generateInterviewQuestions } from "../../lib/ai"
import { dispatchWebhook } from "../../lib/webhooks"
import { generateInterviewToken } from "../../lib/tokens"

export interface CreateCandidateData {
  id: string
  external_id: string | null
  applicant_name: string | null
  applicant_email: string | null
  company_name: string
  status: string
  startup_id: string
  organization_id: string
  created_at: string
  updated_at: string
}

export interface ListCandidateItem {
  id: string
  external_id: string | null
  applicant_name: string | null
  company_name: string
  status: string
  created_at: string
}

export interface AnalysisResult {
  id: string
  analysis_type: string
  score: number | null
  content: string | null
  created_at: string
}

export interface InterviewData {
  candidate_id: string
  interview_id: string
  interview_url: string
  expires_at: string
}

export interface InterviewStatusData {
  candidate_id: string
  interview_id: string
  status: string
  overall_score: number | null
  questions: {
    id: string
    category: string | null
    question: string
    answer: string | null
    score: number | null
  }[]
}

export interface MemoData {
  candidate_id: string
  recommendation: string | null
  memo_content: string | null
  created_at: string
}

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

export abstract class CandidateService {
  static async createCandidate(
    organizationId: string,
    body: {
      company_name: string
      applicant_name?: string
      applicant_email?: string
      external_id?: string
      website?: string
      industry?: string
      stage?: string
      location?: string
      description?: string
      funding_raised?: number
      metadata?: Record<string, unknown>
    },
  ): Promise<CreateCandidateData> {
    const startup = await prisma.startup.create({
      data: {
        name: body.company_name,
        website: body.website ?? null,
        industry: body.industry ?? null,
        stage: body.stage ?? null,
        location: body.location ?? null,
        description: body.description ?? null,
        fundingRaised: BigInt(body.funding_raised ?? 0),
        organizationId,
      },
    })

    const candidate = await prisma.candidate.create({
      data: {
        externalId: body.external_id ?? null,
        applicantName: body.applicant_name ?? null,
        applicantEmail: body.applicant_email ?? null,
        companyName: body.company_name,
        metadata: (body.metadata ?? {}) as any,
        status: "RECIEVED",
        organizationId,
        startupId: startup.id,
      },
    })

    dispatchWebhook(organizationId, "candidate.received", {
      candidate_id: candidate.id,
      external_id: candidate.externalId,
      company_name: candidate.companyName,
    })

    return {
      id: candidate.id,
      external_id: candidate.externalId,
      applicant_name: candidate.applicantName,
      applicant_email: candidate.applicantEmail,
      company_name: candidate.companyName,
      status: candidate.status,
      startup_id: candidate.startupId,
      organization_id: candidate.organizationId,
      created_at: candidate.createdAt.toISOString(),
      updated_at: candidate.updatedAt.toISOString(),
    }
  }

  static async listCandidates(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<ListCandidateItem[]> {
    const candidates = await prisma.candidate.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    return candidates.map((c) => ({
      id: c.id,
      external_id: c.externalId,
      applicant_name: c.applicantName,
      company_name: c.companyName,
      status: c.status,
      created_at: c.createdAt.toISOString(),
    }))
  }

  static async getCandidate(
    organizationId: string,
    id: string,
  ): Promise<CreateCandidateData> {
    const candidate = await prisma.candidate.findFirst({
      where: { id, organizationId },
    })
    if (!candidate) throw new ApiError(404, "not_found", "Candidate not found.")

    return {
      id: candidate.id,
      external_id: candidate.externalId,
      applicant_name: candidate.applicantName,
      applicant_email: candidate.applicantEmail,
      company_name: candidate.companyName,
      status: candidate.status,
      startup_id: candidate.startupId,
      organization_id: candidate.organizationId,
      created_at: candidate.createdAt.toISOString(),
      updated_at: candidate.updatedAt.toISOString(),
    }
  }

  static async updateCandidate(
    organizationId: string,
    id: string,
    body: {
      external_id?: string
      applicant_name?: string
      applicant_email?: string
      company_name?: string
      metadata?: Record<string, unknown>
    },
  ) {
    const existing = await prisma.candidate.findFirst({
      where: { id, organizationId },
    })
    if (!existing) throw new ApiError(404, "not_found", "Candidate not found.")

    const data: any = {}
    if (body.external_id !== undefined) data.externalId = body.external_id
    if (body.applicant_name !== undefined) data.applicantName = body.applicant_name
    if (body.applicant_email !== undefined) data.applicantEmail = body.applicant_email
    if (body.company_name !== undefined) data.companyName = body.company_name
    if (body.metadata !== undefined) data.metadata = body.metadata

    const candidate = await prisma.candidate.update({
      where: { id },
      data,
    })

    return {
      id: candidate.id,
      external_id: candidate.externalId,
      applicant_name: candidate.applicantName,
      applicant_email: candidate.applicantEmail,
      company_name: candidate.companyName,
      status: candidate.status,
      startup_id: candidate.startupId,
      organization_id: candidate.organizationId,
      created_at: candidate.createdAt.toISOString(),
      updated_at: candidate.updatedAt.toISOString(),
    }
  }

  static async analyzeCandidate(
    organizationId: string,
    id: string,
  ): Promise<{ candidate_id: string; analyses: AnalysisResult[] }> {
    const candidate = await prisma.candidate.findFirst({
      where: { id, organizationId },
    })
    if (!candidate) throw new ApiError(404, "not_found", "Candidate not found.")

    await prisma.candidate.update({
      where: { id },
      data: { status: "ANALYZING" },
    })

    const startup = await prisma.startup.findUnique({
      where: { id: candidate.startupId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Backing startup not found.")

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
          startupId: candidate.startupId,
          analysisType: type,
          content: d.content,
          score: d.score,
        },
      })
    }

    await prisma.startup.update({
      where: { id: candidate.startupId },
      data: { status: "REVIEW" },
    })
    await prisma.candidate.update({
      where: { id },
      data: { status: "ANALYZED" },
    })

    const overall = Math.round(dims.reduce((s, [, d]) => s + d.score, 0) / dims.length)
    dispatchWebhook(organizationId, "candidate.analyzed", {
      candidate_id: candidate.id,
      external_id: candidate.externalId,
      overall_score: overall,
    })

    const analyses = await prisma.analysis.findMany({
      where: { startupId: candidate.startupId },
    })

    return {
      candidate_id: id,
      analyses: analyses.map((a) => ({
        id: a.id,
        analysis_type: a.analysisType,
        score: a.score,
        content: a.content,
        created_at: a.createdAt.toISOString(),
      })),
    }
  }

  static async getAnalysis(
    organizationId: string,
    id: string,
  ): Promise<{ candidate_id: string; analyses: AnalysisResult[] }> {
    const candidate = await prisma.candidate.findFirst({
      where: { id, organizationId },
    })
    if (!candidate) throw new ApiError(404, "not_found", "Candidate not found.")

    const analyses = await prisma.analysis.findMany({
      where: { startupId: candidate.startupId },
    })

    return {
      candidate_id: id,
      analyses: analyses.map((a) => ({
        id: a.id,
        analysis_type: a.analysisType,
        score: a.score,
        content: a.content,
        created_at: a.createdAt.toISOString(),
      })),
    }
  }

  static async scheduleInterview(
    organizationId: string,
    id: string,
    expiresInHours: number = 168,
  ): Promise<InterviewData> {
    const candidate = await prisma.candidate.findFirst({
      where: { id, organizationId },
    })
    if (!candidate) throw new ApiError(404, "not_found", "Candidate not found.")

    const startup = await prisma.startup.findUnique({
      where: { id: candidate.startupId },
    })
    if (!startup) throw new ApiError(404, "not_found", "Backing startup not found.")

    const interview = await prisma.interview.create({
      data: { startupId: candidate.startupId, status: "IN_PROGRESS" },
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

    const { raw, hash } = generateInterviewToken()
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000)
    await prisma.interviewSession.create({
      data: {
        candidateId: id,
        interviewId: interview.id,
        tokenHash: hash,
        status: "PENDING",
        expriresAt: expiresAt,
        startedAt: undefined,
        completedAt: undefined,
      } as any,
    })

    await prisma.candidate.update({
      where: { id },
      data: { status: "INTERVIEW_SCHEDULED" },
    })

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:3000"
    ).replace(/\/$/, "")

    dispatchWebhook(organizationId, "interview.scheduled", {
      candidate_id: candidate.id,
      external_id: candidate.externalId,
      interview_id: interview.id,
      expires_at: expiresAt.toISOString(),
    })

    return {
      candidate_id: id,
      interview_id: interview.id,
      interview_url: `${frontendUrl}/interview/session/${raw}`,
      expires_at: expiresAt.toISOString(),
    }
  }

  static async getInterview(
    organizationId: string,
    id: string,
  ): Promise<InterviewStatusData> {
    const candidate = await prisma.candidate.findFirst({
      where: { id, organizationId },
    })
    if (!candidate) throw new ApiError(404, "not_found", "Candidate not found.")

    const interview = await prisma.interview.findFirst({
      where: { startupId: candidate.startupId },
      orderBy: { createdAt: "desc" },
    })
    if (!interview) {
      throw new ApiError(404, "no_interview", "No interview has been scheduled.")
    }

    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: interview.id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    })

    return {
      candidate_id: id,
      interview_id: interview.id,
      status: interview.status,
      overall_score: interview.overallScore,
      questions: questions.map((q) => ({
        id: q.id,
        category: q.category,
        question: q.question,
        answer: q.answer,
        score: q.score,
      })),
    }
  }

  static async getMemo(
    organizationId: string,
    id: string,
  ): Promise<MemoData> {
    const candidate = await prisma.candidate.findFirst({
      where: { id, organizationId },
    })
    if (!candidate) throw new ApiError(404, "not_found", "Candidate not found.")

    const memo = await prisma.investmentMemo.findFirst({
      where: { startupId: candidate.startupId },
      orderBy: { createdAt: "desc" },
    })
    if (!memo) {
      throw new ApiError(404, "no_memo", "No investment memo is available yet.")
    }

    return {
      candidate_id: id,
      recommendation: memo.recommendation,
      memo_content: memo.memoContent,
      created_at: memo.createdAt.toISOString(),
    }
  }
}
