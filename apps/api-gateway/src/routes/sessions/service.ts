/**
 * @fileoverview Interview session business logic — token-based access (no auth middleware).
 * Public endpoints: candidates access their interview via a unique token.
 */
import { prisma } from "@founderiq/database"
import { sha256 } from "../../lib/tokens"
import { ApiError } from "../../middleware"
import type { SessionModel } from "./model"
import { dispatchWebhook } from "../../lib/webhooks"
import { scoreAnswer } from "../../lib/ai"

export interface GetSessionData {
  status: string
  expires_at: string
  candidate: { company_name: string; applicant_name: string | null }
  questions: { id: string; category: string | null; question: string; answered: boolean }[]
}

export interface SubmitAnswerData {
  question_id: number
  score: number
  feedback: string
}

export interface CompleteSessionData {
  status: string
  overallScore: number
  recommendation: string
}

export abstract class SessionService {
  /**
   * Fetch an interview session by its public token.
   *
   * @param {string} token - Raw token from the URL path
   * @returns {Promise<GetSessionData>}
   * @throws {ApiError} 404 — invalid session / 410 — expired
   */
  static async getSession(token: string): Promise<GetSessionData> {
    const hash = sha256(token)

    const session = await prisma.interviewSession.findUnique({
      where: { tokenHash: hash },
      include: {
        candidate: { select: { companyName: true, applicantName: true } },
      },
    })
    if (!session) throw new ApiError(404, "not_found", "Invalid interview session.")
    if (session.expriresAt < new Date()) {
      throw new ApiError(410, "expired", "This interview link has expired.")
    }

    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: session.interviewId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, category: true, question: true, answer: true },
    })

    return {
      status: session.status,
      expires_at: session.expriresAt.toISOString(),
      candidate: {
        company_name: session.candidate?.companyName ?? "",
        applicant_name: session.candidate?.applicantName ?? null,
      },
      questions: questions.map((q) => ({
        id: q.id,
        category: q.category,
        question: q.question,
        answered: q.answer != null,
      })),
    }
  }

  /**
   * Submit an answer to a question in the interview.
   * If the session is in `pending` state, transitions it to `in_progress`
   * and dispatches an `interview.started` webhook.
   *
   * @param {string} token      - Raw session token
   * @param {number} questionId - UUID of the question being answered
   * @param {string} answer     - The candidate's free-text answer
   * @returns {Promise<SubmitAnswerData>}
   * @throws {ApiError} 404 — session not found / 409 — already completed / 410 — expired
   */
  static async submitAnswer(
    token: string,
    questionId: number,
    answer: string,
  ): Promise<SubmitAnswerData> {
    const hash = sha256(token)

    const session = await prisma.interviewSession.findUnique({
      where: { tokenHash: hash },
    })
    if (!session) throw new ApiError(404, "not_found", "Invalid interview session.")
    if (session.status === "COMPLETED") {
      throw new ApiError(409, "completed", "This interview is already complete.")
    }
    if (session.expriresAt < new Date()) {
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      })
      throw new ApiError(410, "expired", "This interview link has expired.")
    }

    if (session.status === "PENDING") {
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      })
      const candidate = await prisma.candidate.findUnique({
        where: { id: session.candidateId },
      })
      if (candidate) {
        dispatchWebhook(candidate.organizationId, "interview.started", {
          candidate_id: candidate.id,
          external_id: candidate.externalId,
          interview_id: session.interviewId,
        })
      }
    }

    const question = await prisma.interviewQuestion.findUnique({
      where: { id: String(questionId) },
    })
    if (!question || question.interviewId !== session.interviewId) {
      throw new ApiError(404, "not_found", "Question not found for this interview.")
    }

    const result = await scoreAnswer(question.question, answer)
    await prisma.interviewQuestion.update({
      where: { id: question.id },
      data: { answer, score: result.score },
    })

    return {
      question_id: questionId,
      score: result.score,
      feedback: result.feedback,
    }
  }

  /**
   * Complete the interview session — calculate overall score, update interview,
   * generate investment memo, and dispatch webhooks.
   *
   * @param {string} token - Raw session token
   * @returns {Promise<CompleteSessionData>}
   * @throws {ApiError} 404 — session or candidate not found / 409 — already completed / 410 — expired
   */
  static async completeSession(token: string): Promise<CompleteSessionData> {
    const hash = sha256(token)

    const session = await prisma.interviewSession.findUnique({
      where: { tokenHash: hash },
    })
    if (!session) throw new ApiError(404, "not_found", "Invalid interview session.")
    if (session.status === "COMPLETED") {
      throw new ApiError(409, "completed", "This interview is already complete.")
    }
    if (session.expriresAt < new Date()) {
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      })
      throw new ApiError(410, "expired", "This interview link has expired.")
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: session.candidateId },
    })
    if (!candidate) throw new ApiError(404, "not_found", "Candidate not found.")

    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: session.interviewId },
    })
    const scored = questions.filter((q) => q.score != null)
    const overallScore = scored.length
      ? Math.round(scored.reduce((s, q) => s + (q.score ?? 0), 0) / scored.length)
      : 0

    await prisma.interview.update({
      where: { id: session.interviewId },
      data: { status: "COMPLETED", overallScore },
    })

    dispatchWebhook(candidate.organizationId, "interview.completed", {
      candidate_id: candidate.id,
      external_id: candidate.externalId,
      interview_id: session.interviewId,
      overall_score: overallScore,
    })

    // Generate investment memo
    const startup = await prisma.startup.findUnique({
      where: { id: candidate.startupId },
    })
    let recommendation = "monitor"
    if (startup) {
      const analyses = await prisma.analysis.findMany({
        where: { startupId: candidate.startupId },
      })
      const summary =
        analyses
          .map((a) => `${a.analysisType} (${a.score}/100): ${a.content}`)
          .join("\n") +
        `\n\nFounder interview overall score: ${overallScore}/100`

      const { generateInvestmentMemo } = await import("../../lib/ai")
      const memo = await generateInvestmentMemo(
        {
          id: startup.id,
          name: startup.name,
          website: startup.website,
          industry: startup.industry,
          stage: startup.stage,
          location: startup.location,
          description: startup.description,
          funding_raised: Number(startup.fundingRaised),
          status: startup.status,
          organization_id: startup.organizationId,
          created_at: startup.createdAt.toISOString(),
          updated_at: startup.updatedAt.toISOString(),
        },
        summary,
      )
      recommendation = memo.recommendation
      await prisma.investmentMemo.create({
        data: {
          startupId: candidate.startupId,
          recommendation: memo.recommendation,
          memoContent: memo.memo_content,
        },
      })
      await prisma.startup.update({
        where: { id: candidate.startupId },
        data: { status: "COMPLETED" },
      })
      dispatchWebhook(candidate.organizationId, "memo.generated", {
        candidate_id: candidate.id,
        external_id: candidate.externalId,
        recommendation: memo.recommendation,
      })
    }

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "COMPLETED" },
    })
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    })

    dispatchWebhook(candidate.organizationId, "candidate.completed", {
      candidate_id: candidate.id,
      external_id: candidate.externalId,
      overall_score: overallScore,
      recommendation,
    })

    return { status: "COMPLETED", overallScore, recommendation }
  }
}
