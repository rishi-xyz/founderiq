/**
 * @fileoverview AI integration via OpenRouter. Provides startup analysis, interview
 * question generation, answer scoring, and investment memo generation.
 *
 * @note Set `OPENROUTER_API_KEY` env var. Model configurable via `AI_MODEL` (default "gratis").
 */
import OpenAI from "openai"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "sk-or-v1-missing",
  defaultHeaders: {
    "HTTP-Referer": "https://founderiq.io",
  },
})

const MODEL = process.env.AI_MODEL || "gratis"

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface StartupInput {
  id: string
  name: string
  website: string | null
  industry: string | null
  stage: string | null
  location: string | null
  description: string | null
  funding_raised: number
  status: string
  organization_id: string
  created_at: string
  updated_at: string
}

const analysisSchema = z.object({
  market: z.object({
    score: z.number().min(0).max(100),
    content: z.string(),
  }),
  competitor: z.object({
    score: z.number().min(0).max(100),
    content: z.string(),
  }),
  founder: z.object({
    score: z.number().min(0).max(100),
    content: z.string(),
  }),
  execution: z.object({
    score: z.number().min(0).max(100),
    content: z.string(),
  }),
  business_model: z.object({
    score: z.number().min(0).max(100),
    content: z.string(),
  }),
  risk: z.object({
    score: z.number().min(0).max(100),
    content: z.string(),
  }),
})

export type StartupAnalysis = z.infer<typeof analysisSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseStructuredOutput<T>(content: string, schema: z.ZodType<T>): T {
  let cleaned = content.replace(/```(?:json)?\s*/g, "").trim()
  cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "")
  return schema.parse(JSON.parse(cleaned))
}

function startupContext(startup: StartupInput): string {
  return `Startup: ${startup.name}
Website: ${startup.website ?? "N/A"}
Industry: ${startup.industry ?? "N/A"}
Stage: ${startup.stage ?? "N/A"}
Location: ${startup.location ?? "N/A"}
Funding raised: $${(startup.funding_raised ?? 0).toLocaleString()}
Description: ${startup.description ?? "N/A"}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a startup across six dimensions: market, competitor, founder,
 * execution, business_model, and risk. Each dimension receives a score (0-100)
 * and a 2-3 sentence assessment.
 */
export async function analyzeStartup(startup: StartupInput): Promise<StartupAnalysis> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a senior VC analyst at a top-tier fund. Analyze startups rigorously and produce concise, evidence-based assessments. Each content field should be 2-3 sentences of sharp, investor-grade analysis. Scores: 0-40 weak, 41-70 moderate, 71-100 strong. Respond with valid JSON matching this schema: { market: { score, content }, competitor: { score, content }, founder: { score, content }, execution: { score, content }, business_model: { score, content }, risk: { score, content } }",
      },
      {
        role: "user",
        content: `Analyze this startup across six dimensions:\n\n${startupContext(startup)}`,
      },
    ],
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  return parseStructuredOutput(content, analysisSchema)
}

/**
 * Generate targeted interview questions informed by the AI's prior analysis.
 *
 * @param startup      - Startup metadata
 * @param analysis     - Six-dimension analysis output from `analyzeStartup`
 * @param documentSummaries - Optional extracted text from uploaded documents
 * @returns Array of `{ category, question }` objects
 */
export async function generateInterviewQuestions(
  startup: StartupInput,
  analysis: StartupAnalysis,
  documentSummaries: string[] = [],
): Promise<{ category: string; question: string }[]> {
  const validCategories = ["Vision", "Market", "Competition", "Product", "Go-To-Market", "Team", "Financials"] as const
  const questionsSchema = z.object({
    questions: z.array(
      z.object({
        category: z.string().transform((val) => {
          const match = validCategories.find(
            (c) => c.toLowerCase() === val.toLowerCase() || c.replace(/-/g, "").toLowerCase() === val.replace(/-/g, "").toLowerCase()
          )
          return match ?? val
        }),
        question: z.string(),
      }),
    ),
  })

  const analysisSummary = Object.entries(analysis)
    .map(([dim, val]) => `${dim} (${val.score}/100): ${val.content}`)
    .join("\n")

  const docSection =
    documentSummaries.length > 0
      ? `\n\nDocument summaries from the startup's uploaded materials:\n${documentSummaries.map((s, i) => `[${i + 1}] ${s}`).join("\n")}`
      : ""

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an experienced VC partner conducting a founder interview. Use the analysis summary to craft probing questions that target identified weaknesses, risks, and gaps. Each question should be specific to this startup — not generic. Respond with valid JSON: { questions: [{ category, question }] }",
      },
      {
        role: "user",
        content: `Generate exactly 7 founder interview questions for this startup, one per category: Vision, Market, Competition, Product, Go-To-Market, Team, Financials. Use the analysis below to tailor each question to the startup's specific strengths and weaknesses.\n\n${startupContext(startup)}\n\nAnalysis:\n${analysisSummary}${docSection}`,
      },
    ],
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  const parsed = parseStructuredOutput(content, questionsSchema)
  return parsed.questions
}

/**
 * Score a founder's answer to an interview question (0-100) with 1-sentence feedback.
 */
export async function scoreAnswer(
  question: string,
  answer: string,
): Promise<{ score: number; feedback: string }> {
  const answerScoreSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
  })

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a VC partner evaluating a founder interview answer. Score the answer 0-100 based on clarity, depth, evidence, and conviction. Provide one sentence of feedback. Respond with valid JSON: { score, feedback }",
      },
      {
        role: "user",
        content: `Question: ${question}\n\nFounder answer: ${answer}`,
      },
    ],
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  return parseStructuredOutput(content, answerScoreSchema)
}

/**
 * Generate an investment memo for the investment committee.
 * Returns a recommendation ("invest" | "pass" | "monitor" | "follow_on")
 * and a full markdown memo body.
 */
export async function generateInvestmentMemo(
  startup: StartupInput,
  analysisSummary: string,
): Promise<{ recommendation: string; memo_content: string }> {
  const memoSchema = z.object({
    recommendation: z.enum(["invest", "pass", "monitor", "follow_on"]),
    memo_content: z.string(),
  })

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a VC partner writing an investment memo for the investment committee. Write a thorough, investor-grade memo in markdown with these sections: Executive Summary, Company Overview, Founder Evaluation, Market Analysis, Strengths, Risks, Investment Thesis, Recommendation. Be specific and decisive. Respond with valid JSON: { recommendation, memo_content }",
      },
      {
        role: "user",
        content: `Write an investment memo for this startup.\n\n${startupContext(startup)}\n\nAnalysis findings:\n${analysisSummary}`,
      },
    ],
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  return parseStructuredOutput(content, memoSchema)
}
