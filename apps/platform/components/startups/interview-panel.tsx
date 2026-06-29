"use client"

import { useState } from "react"
import { api, ApiError, type Interview } from "@/lib/api"
import { Button } from "@founderiq/ui"
import { MessageSquare, Send, CheckCircle, Sparkles } from "lucide-react"

interface InterviewPanelProps {
  startupId: string
  interview: Interview | null
  onRefresh: () => void
}

export function InterviewPanel({ startupId, interview, onRefresh }: InterviewPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [scoring, setScoring] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState("")

  const handleSchedule = async () => {
    try {
      await api.post(`/startups/${startupId}/interview`)
      onRefresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to schedule interview")
    }
  }

  const handleScore = async (questionId: string) => {
    const answer = answers[questionId]
    if (!answer?.trim()) return
    setScoring(questionId)
    setError("")
    try {
      await api.post(`/startups/${startupId}/interview/score`, {
        question_id: questionId,
        answer,
      })
      onRefresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to score answer")
    } finally {
      setScoring(null)
    }
  }

  const handleComplete = async () => {
    if (!interview) return
    setCompleting(true)
    setError("")
    try {
      await api.post(`/startups/${startupId}/interview/complete`, {
        interview_id: interview.id,
      })
      onRefresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to complete interview")
    } finally {
      setCompleting(false)
    }
  }

  if (!interview) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-mono text-sm mb-4">
          No interview scheduled yet.
        </p>
        <Button
          onClick={handleSchedule}
          className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          Schedule AI Interview
        </Button>
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>
    )
  }

  const allScored = interview.questions.length > 0 && interview.questions.every((q) => q.score != null)

  return (
    <div className="space-y-6">
      {/* Interview Status */}
      <div className="bg-card border border-foreground/10 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-mono text-muted-foreground tracking-wide">INTERVIEW STATUS</h3>
          <div className="flex items-center gap-3">
            {interview.overall_score != null && (
              <span className="text-xl font-display">Score: {interview.overall_score}%</span>
            )}
            <span className={`px-3 py-1 text-xs font-mono ${interview.status === "COMPLETED" ? "bg-green-100 text-green-700" : interview.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"}`}>
              {interview.status}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600 font-mono">{error}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {interview.questions.map((q) => (
          <div key={q.id} className="bg-card border border-foreground/10 p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{q.category}</span>
                <p className="text-sm font-medium mt-1">{q.question}</p>
              </div>
              {q.score != null && (
                <span className={`text-lg font-display px-3 py-1 ${q.score >= 70 ? "bg-green-100 text-green-700" : q.score >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  {q.score}
                </span>
              )}
            </div>
            {q.answer ? (
              <div className="mt-3 p-4 bg-foreground/[0.02] border border-foreground/5 rounded-lg">
                <p className="text-sm text-muted-foreground">{q.answer}</p>
              </div>
            ) : interview.status !== "COMPLETED" && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Enter founder's answer..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors resize-none"
                />
                <Button
                  onClick={() => handleScore(q.id)}
                  disabled={scoring === q.id || !answers[q.id]?.trim()}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs border-foreground/20"
                >
                  <Send className="w-3 h-3 mr-1.5" />
                  {scoring === q.id ? "Scoring..." : "Score Answer"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Complete Interview */}
      {allScored && interview.status !== "COMPLETED" && (
        <div className="flex justify-center">
          <Button
            onClick={handleComplete}
            disabled={completing}
            className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {completing ? "Completing..." : "Complete Interview"}
          </Button>
        </div>
      )}
    </div>
  )
}
