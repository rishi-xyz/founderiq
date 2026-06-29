"use client"

import { useState, useEffect } from "react"
import { api, ApiError, type Candidate } from "@/lib/api"
import { ArrowRight, Users } from "lucide-react"

const statusStyles: Record<string, string> = {
  RECIEVED: "bg-blue-100 text-blue-700",
  ANALYZING: "bg-yellow-100 text-yellow-700",
  ANALYZED: "bg-green-100 text-green-700",
  INTERVIEW_SCHEDULED: "bg-purple-100 text-purple-700",
  INTERVIEW_IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api.get<Candidate[]>("/candidates")
      .then(setCandidates)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load candidates"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display tracking-tight">Candidates</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Manage founder candidates in your pipeline
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        </div>
      ) : error ? (
        <div className="border border-foreground/10 p-12 text-center">
          <p className="text-muted-foreground font-mono text-sm">{error}</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="border border-foreground/10 p-12 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">No candidates yet</p>
          <p className="text-xs text-muted-foreground mt-2">
            Candidates are created when startups are submitted for evaluation.
          </p>
        </div>
      ) : (
        <div className="border border-foreground/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Name</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Email</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Company</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Status</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Created</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium">{c.applicant_name || "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{c.applicant_email || "—"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{c.company_name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-mono ${statusStyles[c.status] || "bg-foreground/5 text-foreground"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
