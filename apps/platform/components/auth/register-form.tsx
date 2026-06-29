"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { Button } from "@founderiq/ui"
import { ArrowRight } from "lucide-react"

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(name, email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 font-mono">{error}</p>
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-mono text-background/60 mb-2">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 bg-background/5 border border-background/10 rounded-lg text-background placeholder:text-background/30 focus:outline-none focus:border-background/30 transition-colors text-sm"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-mono text-background/60 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@firm.com"
          required
          className="w-full px-4 py-3 bg-background/5 border border-background/10 rounded-lg text-background placeholder:text-background/30 focus:outline-none focus:border-background/30 transition-colors text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-mono text-background/60 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          required
          minLength={8}
          className="w-full px-4 py-3 bg-background/5 border border-background/10 rounded-lg text-background placeholder:text-background/30 focus:outline-none focus:border-background/30 transition-colors text-sm"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-background text-foreground hover:bg-background/90 rounded-full h-12 text-sm group"
      >
        {loading ? "Creating account..." : "Create account"}
        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
      </Button>
    </form>
  )
}
