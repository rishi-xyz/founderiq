"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, Users, Settings } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/startups", label: "Startups", icon: Building2 },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-foreground text-background flex flex-col z-40">
      <div className="px-6 py-6 border-b border-background/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-display tracking-tight">FounderIQ</span>
          <span className="text-[10px] text-background/50 font-mono mt-0.5">TM</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? "bg-background/10 text-background"
                  : "text-background/50 hover:text-background hover:bg-background/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-mono text-xs tracking-wide">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-background/10">
        <p className="text-[10px] font-mono text-background/30">AI Venture Intelligence</p>
      </div>
    </aside>
  )
}
