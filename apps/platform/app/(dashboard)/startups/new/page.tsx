"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { Button } from "@founderiq/ui"
import { ArrowRight } from "lucide-react"

const industries = [
  "AI/ML", "SaaS", "Fintech", "HealthTech", "Cleantech", "EdTech",
  "E-commerce", "Enterprise", "Consumer", "Hardware", "Biotech", "Other",
]

const stages = [
  "Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth",
]

export default function NewStartupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    stage: "",
    location: "",
    description: "",
    funding_raised: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await api.post("/startups", {
        ...form,
        funding_raised: form.funding_raised ? parseFloat(form.funding_raised) * 1000000 : 0,
      })
      router.push(`/startups/${(data as { id: string }).id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create startup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display tracking-tight">Add Startup</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Add a new startup to your pipeline
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-mono">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-mono text-muted-foreground mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Startup name"
              required
              className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-mono text-muted-foreground mb-2">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-muted-foreground mb-2">Industry</label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
            >
              <option value="">Select industry</option>
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-mono text-muted-foreground mb-2">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
            >
              <option value="">Select stage</option>
              {stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-mono text-muted-foreground mb-2">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="City, Country"
              className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-muted-foreground mb-2">Funding Raised ($M)</label>
            <input
              type="number"
              value={form.funding_raised}
              onChange={(e) => setForm({ ...form, funding_raised: e.target.value })}
              placeholder="0"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-mono text-muted-foreground mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the startup"
              rows={4}
              className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-foreground/30 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm group"
          >
            {loading ? "Creating..." : "Create Startup"}
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full text-sm border-foreground/20"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
