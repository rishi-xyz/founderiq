"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api, ApiError, type Startup, type Analysis, type Memo } from "@/lib/api"
import { Button } from "@founderiq/ui"
import { ArrowLeft, Sparkles, MessageSquare, FileText, BookOpen, Globe, MapPin, DollarSign, Activity } from "lucide-react"
import Link from "next/link"
import { AnalysisPanel } from "@/components/startups/analysis-panel"
import { DocumentManager } from "@/components/startups/document-manager"
import { MemoPanel } from "@/components/startups/memo-panel"

type Tab = "overview" | "analysis" | "interview" | "documents" | "memo"

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  ANALYZING: "bg-yellow-100 text-yellow-700",
  INTERVIEWING: "bg-purple-100 text-purple-700",
  REVIEW: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  PASSED: "bg-gray-100 text-gray-700",
  INVESTED: "bg-emerald-100 text-emerald-700",
}

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [memo, setMemo] = useState<Memo | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [s, a, m] = await Promise.all([
        api.get<Startup>(`/startups/${id}`),
        api.get<Analysis[]>(`/startups/${id}/analyses`).catch(() => []),
        api.get<Memo>(`/startups/${id}/memo`).catch(() => null),
      ])
      setStartup(s)
      setAnalyses(a)
      setMemo(m)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load startup")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      await api.post(`/startups/${id}/analyze`)
      await fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType; comingSoon?: boolean }[] = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "analysis", label: "Analysis", icon: Sparkles },
    { key: "interview", label: "Interview", icon: MessageSquare, comingSoon: true },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "memo", label: "Memo", icon: BookOpen },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    )
  }

  if (error || !startup) {
    return (
      <div className="border border-foreground/10 p-12 text-center">
        <p className="text-muted-foreground font-mono text-sm">{error || "Startup not found"}</p>
        <Link href="/startups" className="inline-flex items-center gap-2 text-sm text-foreground mt-3 hover:underline underline-offset-4">
          <ArrowLeft className="w-3 h-3" /> Back to startups
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/startups" className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to startups
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display tracking-tight">{startup.name}</h1>
              <span className={`px-2 py-0.5 text-[11px] font-mono ${statusStyles[startup.status] || "bg-foreground/5 text-foreground"}`}>
                {startup.status}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {startup.industry && (
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> {startup.industry}
                </span>
              )}
              {startup.stage && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> {startup.stage}
                </span>
              )}
              {startup.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {startup.location}
                </span>
              )}
              {startup.funding_raised > 0 && (
                <span className="flex items-center gap-1.5 font-mono">
                  <DollarSign className="w-3.5 h-3.5" /> ${(startup.funding_raised / 1000000).toFixed(1)}M raised
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {startup.status === "NEW" && (
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {analyzing ? "Analyzing..." : "Run AI Analysis"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-foreground/10">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-mono border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.comingSoon && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground font-mono">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            {startup.description && (
              <div className="bg-card border border-foreground/10 p-6">
                <h3 className="text-xs font-mono text-muted-foreground mb-3 tracking-wide">DESCRIPTION</h3>
                <p className="text-sm leading-relaxed">{startup.description}</p>
              </div>
            )}
            {startup.website && (
              <div className="bg-card border border-foreground/10 p-6">
                <h3 className="text-xs font-mono text-muted-foreground mb-3 tracking-wide">WEBSITE</h3>
                <a href={startup.website} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:underline underline-offset-4">
                  {startup.website}
                </a>
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-foreground/10 p-5">
                <div className="text-xs font-mono text-muted-foreground mb-1">Analyses</div>
                <div className="text-2xl font-display">{analyses.length}</div>
              </div>
              <div className="bg-card border border-foreground/10 p-5">
                <div className="text-xs font-mono text-muted-foreground mb-1">Interview Status</div>
                <div className="text-2xl font-display">—</div>
              </div>
              <div className="bg-card border border-foreground/10 p-5">
                <div className="text-xs font-mono text-muted-foreground mb-1">Avg Score</div>
                <div className="text-2xl font-display">—</div>
              </div>
              <div className="bg-card border border-foreground/10 p-5">
                <div className="text-xs font-mono text-muted-foreground mb-1">Memo</div>
                <div className="text-2xl font-display">—</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <AnalysisPanel
            startupId={id}
            startupStatus={startup.status}
            analyses={analyses}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
          />
        )}

        {activeTab === "interview" && (
          <div className="border border-foreground/10 p-12 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-sm font-mono text-foreground mb-1">AI Interview — Coming Soon</h3>
            <p className="text-xs text-muted-foreground">
              Schedule and conduct AI-powered founder interviews with real-time question generation and scoring.
            </p>
          </div>
        )}

        {activeTab === "documents" && (
          <DocumentManager startupId={id} />
        )}

        {activeTab === "memo" && (
          <MemoPanel
            startupId={id}
            memo={memo}
            analysesCount={analyses.length}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  )
}
