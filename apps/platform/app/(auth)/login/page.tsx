"use client"

import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display text-background mb-2">Welcome back</h1>
        <p className="text-sm text-background/60">Sign in to your account</p>
      </div>
      <LoginForm />
      <p className="mt-8 text-center text-sm text-background/40">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-background/80 hover:text-background underline underline-offset-4 transition-colors">
          Sign up
        </a>
      </p>
    </div>
  )
}
