"use client"

import { Button } from "@founderiq/ui"
import { Sparkles } from "lucide-react"
import type { Analysis } from "@/lib/api"

interface AnalysisPanelProps {
  startupId: string
  startupStatus: string
  analyses: Analysis[]
  onAnalyze: () => void
  analyzing: boolean
}

const dimensionLabels: Record<string, string> = {
  market: "Market Opportunity",
  competitor: "Competitive Landscape",
  founder: "Founder Assessment",
  execution: "Execution Capability",
  business_model: "Business Model",
  risk: "Risk Analysis",
}

const dimensionColors: Record<string, string> = {
  market: "bg-blue-500",
  competitor: "bg-orange-500",
  founder: "bg-purple-500",
  execution: "bg-green-500",
  business_model: "bg-cyan-500",
  risk: "bg-red-500",
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

function scoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-100"
  if (score >= 40) return "bg-yellow-100"
  return "bg-red-100"
}

export function AnalysisPanel({
  startupStatus,
  analyses,
  onAnalyze,
  analyzing,
}: AnalysisPanelProps) {
  if (startupStatus === "NEW" && analyses.length === 0) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-mono text-sm mb-4">
          No analysis yet. Run AI analysis to evaluate this startup.
        </p>
        <Button
          onClick={onAnalyze}
          disabled={analyzing}
          className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {analyzing ? "Analyzing..." : "Run AI Analysis"}
        </Button>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <p className="text-muted-foreground font-mono text-sm">No analyses available</p>
      </div>
    )
  }

  const avgScore = Math.round(analyses.reduce((sum, a) => sum + (a.score || 0), 0) / analyses.length)

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-card border border-foreground/10 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-mono text-muted-foreground tracking-wide">OVERALL AI SCORE</h3>
          <span className={`text-4xl font-display ${scoreColor(avgScore)}`}>{avgScore}</span>
        </div>
        <div className="w-full h-2 bg-foreground/5 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${avgScore >= 70 ? "bg-green-500" : avgScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${avgScore}%` }}
          />
        </div>
      </div>

      {/* Dimension Cards */}
      <div className="space-y-4">
        {analyses.map((a) => (
          <div key={a.id} className="bg-card border border-foreground/10 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dimensionColors[a.analysis_type] || "bg-foreground/30"}`} />
                <h3 className="text-sm font-medium">{dimensionLabels[a.analysis_type] || a.analysis_type}</h3>
              </div>
              <span className={`text-lg font-display ${scoreColor(a.score || 0)} ${scoreBgColor(a.score || 0)} px-3 py-1`}>
                {a.score || "—"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
