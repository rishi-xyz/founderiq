"use client"

import { useAuth } from "@/lib/auth"
import { LogOut, User } from "lucide-react"

export function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-8">
        <div />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <User className="w-4 h-4 text-foreground/60" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground font-mono">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
