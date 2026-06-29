"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError, type User } from "./api"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function storeUser(user: User | null) {
  if (user) {
    localStorage.setItem("fiq_user", JSON.stringify(user))
  } else {
    localStorage.removeItem("fiq_user")
  }
}

function loadUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("fiq_user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const verifyAuth = useCallback(async () => {
    const stored = loadUser()
    if (!stored) {
      setLoading(false)
      return
    }
    try {
      await api.get("/dashboard")
      setUser(stored)
    } catch {
      storeUser(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User }>("/auth/login", { email, password })
    storeUser(data.user)
    setUser(data.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const data = await api.post<{ user: User }>("/auth/register", { name, email, password })
    storeUser(data.user)
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore
    }
    storeUser(null)
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
