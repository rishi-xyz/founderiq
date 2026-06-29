"use client"

import { useState, useEffect } from "react"
import { api, ApiError, type DashboardData } from "@/lib/api"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { StartupsTable } from "@/components/dashboard/startups-table"
import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@founderiq/ui"

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<DashboardData>("/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <p className="text-muted-foreground font-mono text-sm">{error || "Failed to load"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Your portfolio at a glance
          </p>
        </div>
        <Link href="/startups/new">
          <Button className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm group">
            <Plus className="w-4 h-4 mr-1" />
            Add Startup
            <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>

      <MetricsCards data={data} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display">Recent Startups</h2>
          <Link
            href="/startups"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <StartupsTable startups={data.startups.slice(0, 10)} />
      </div>
    </div>
  )
}
