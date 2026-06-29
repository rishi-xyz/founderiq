"use client"

import { useState } from "react"
import { api, ApiError, type Memo } from "@/lib/api"
import { Button } from "@founderiq/ui"
import { BookOpen, Sparkles, AlertCircle } from "lucide-react"

interface MemoPanelProps {
  startupId: string
  memo: Memo | null
  analysesCount: number
  onRefresh: () => void
}

const recommendationStyles: Record<string, string> = {
  invest: "bg-green-100 text-green-700",
  pass: "bg-red-100 text-red-700",
  monitor: "bg-yellow-100 text-yellow-700",
  follow_on: "bg-blue-100 text-blue-700",
}

export function MemoPanel({ startupId, memo, analysesCount, onRefresh }: MemoPanelProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    setGenerating(true)
    setError("")
    try {
      await api.post(`/startups/${startupId}/memo`)
      onRefresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate memo")
    } finally {
      setGenerating(false)
    }
  }

  if (analysesCount === 0) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-mono text-sm">
          Run AI analysis first before generating an investment memo.
        </p>
      </div>
    )
  }

  if (!memo) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-mono text-sm mb-4">
          No investment memo generated yet.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {generating ? "Generating..." : "Generate Investment Memo"}
        </Button>
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Memo Header */}
      <div className="bg-card border border-foreground/10 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-mono text-muted-foreground tracking-wide">INVESTMENT MEMO</h3>
          {memo.recommendation && (
            <span className={`px-3 py-1 text-xs font-mono uppercase tracking-wider ${recommendationStyles[memo.recommendation.toLowerCase()] || "bg-foreground/5"}`}>
              {memo.recommendation}
            </span>
          )}
        </div>
      </div>

      {/* Memo Content */}
      {memo.memo_content && (
        <div className="bg-card border border-foreground/10 p-8">
          <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:tracking-tight prose-p:text-muted-foreground prose-strong:text-foreground">
            {memo.memo_content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-display mt-6 mb-3">{line.slice(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-display mt-5 mb-2">{line.slice(3)}</h2>
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-display mt-4 mb-2">{line.slice(4)}</h3>
              if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1">{line.slice(2)}</li>
              if (line.trim() === '') return <div key={i} className="h-3" />
              return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{line}</p>
            })}
          </div>
        </div>
      )}

      {/* Regenerate */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          variant="outline"
          className="rounded-full text-sm border-foreground/20"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {generating ? "Regenerating..." : "Regenerate Memo"}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600 font-mono">{error}</p>
        </div>
      )}
    </div>
  )
}
