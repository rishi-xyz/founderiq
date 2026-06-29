const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code || "unknown",
      body?.error?.message || res.statusText,
    )
  }

  return body?.data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData, headers: {} }),
}

export interface User {
  id: string
  email: string
  name?: string
  role: string
}

export interface AuthResponse {
  user: User
  access_token?: string
}

export interface DashboardData {
  metrics: {
    startupsReviewed: number
    interviewsCompleted: number
    pendingAnalyses: number
    highPotentialDeals: number
    averageFounderScore: number
  }
  startups: Startup[]
  totalFunding: number
}

export interface Startup {
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

export interface Analysis {
  id: string
  analysis_type: string
  score: number
  content: string
  created_at: string
}

export interface Interview {
  id: string
  status: string
  overall_score: number | null
  created_at: string
  questions: InterviewQuestion[]
}

export interface InterviewQuestion {
  id: string
  category: string | null
  question: string
  answer: string | null
  score: number | null
}

export interface Document {
  id: string
  file_type: string
  file_url: string | null
  file_name: string | null
  upload_status: string
  created_at: string
}

export interface Memo {
  id: string
  recommendation: string | null
  memo_content: string | null
  created_at: string
}

export interface Candidate {
  id: string
  external_id: string | null
  applicant_name: string | null
  applicant_email: string | null
  company_name: string
  status: string
  created_at: string
}
