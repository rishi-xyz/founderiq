"use client"

import { useState, useEffect, useCallback } from "react"
import { api, ApiError, type Startup } from "@/lib/api"
import { ArrowRight, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@founderiq/ui"
import { useRouter } from "next/navigation"

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  ANALYZING: "bg-yellow-100 text-yellow-700",
  INTERVIEWING: "bg-purple-100 text-purple-700",
  REVIEW: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  PASSED: "bg-gray-100 text-gray-700",
  INVESTED: "bg-emerald-100 text-emerald-700",
}

export default function StartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const router = useRouter()

  const fetchStartups = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      const data = await api.get<Startup[]>(`/startups?${params.toString()}`)
      setStartups(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load startups")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchStartups()
  }, [fetchStartups])

  const statuses = ["", "NEW", "ANALYZING", "INTERVIEWING", "REVIEW", "COMPLETED", "PASSED", "INVESTED"]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display tracking-tight">Startups</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Manage and evaluate startups in your pipeline
          </p>
        </div>
        <Button
          onClick={() => router.push("/startups/new")}
          className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm group"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Startup
          <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search startups..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-mono rounded-full border transition-colors ${
                statusFilter === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/10 text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        </div>
      ) : error ? (
        <div className="border border-foreground/10 p-12 text-center">
          <p className="text-muted-foreground font-mono text-sm">{error}</p>
        </div>
      ) : startups.length === 0 ? (
        <div className="border border-foreground/10 p-12 text-center">
          <p className="text-muted-foreground font-mono text-sm">No startups found</p>
          <Link
            href="/startups/new"
            className="inline-flex items-center gap-2 text-sm text-foreground mt-3 hover:underline underline-offset-4"
          >
            Add your first startup <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="border border-foreground/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Name</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Industry</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Stage</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Status</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Funding</th>
                  <th className="text-left px-5 py-4 text-xs font-mono text-muted-foreground tracking-wide">Location</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {startups.map((s) => (
                  <tr key={s.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/startups/${s.id}`} className="text-sm font-medium hover:underline underline-offset-4">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{s.industry || "—"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{s.stage || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-mono ${statusStyles[s.status] || "bg-foreground/5 text-foreground"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-mono">
                      {s.funding_raised > 0 ? `$${(s.funding_raised / 1000000).toFixed(1)}M` : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{s.location || "—"}</td>
                    <td className="px-5 py-4">
                      <Link href={`/startups/${s.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
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
