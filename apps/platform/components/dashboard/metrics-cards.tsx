"use client"

import type { DashboardData } from "@/lib/api"
import { Building2, FileText, Clock, Target, TrendingUp } from "lucide-react"

const cards = [
  { key: "startupsReviewed", label: "Startups Reviewed", icon: Building2 },
  { key: "interviewsCompleted", label: "Interviews Completed", icon: FileText },
  { key: "pendingAnalyses", label: "Pending Analyses", icon: Clock },
  { key: "highPotentialDeals", label: "High-Potential Deals", icon: Target },
  { key: "averageFounderScore", label: "Avg Founder Score", icon: TrendingUp },
] as const

export function MetricsCards({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = data.metrics[card.key as keyof typeof data.metrics]
        const displayValue = card.key === "averageFounderScore" ? `${value}%` : value
        return (
          <div key={card.key} className="bg-card border border-foreground/10 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Icon className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <div className="text-3xl font-display mb-1">{displayValue}</div>
            <div className="text-xs text-muted-foreground font-mono tracking-wide">{card.label}</div>
          </div>
        )
      })}
    </div>
  )
}
