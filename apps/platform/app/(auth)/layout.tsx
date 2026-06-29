"use client"

import { AuthProvider } from "@/lib/auth"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen flex items-center justify-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`
          }} />
        </div>
        <div className="absolute top-8 left-8">
          <span className="text-2xl font-display text-background">FounderIQ</span>
          <span className="text-[10px] text-background/50 font-mono ml-1">TM</span>
        </div>
        {children}
      </div>
    </AuthProvider>
  )
}
