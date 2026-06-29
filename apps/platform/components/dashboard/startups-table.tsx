"use client"

import type { Startup } from "@/lib/api"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  ANALYZING: "bg-yellow-100 text-yellow-700",
  INTERVIEWING: "bg-purple-100 text-purple-700",
  REVIEW: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  PASSED: "bg-gray-100 text-gray-700",
  INVESTED: "bg-emerald-100 text-emerald-700",
}

export function StartupsTable({ startups }: { startups: Startup[] }) {
  if (startups.length === 0) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <p className="text-muted-foreground font-mono text-sm">No startups yet</p>
        <Link
          href="/startups/new"
          className="inline-flex items-center gap-2 text-sm text-foreground mt-3 hover:underline underline-offset-4"
        >
          Add your first startup <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  return (
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
  )
}
