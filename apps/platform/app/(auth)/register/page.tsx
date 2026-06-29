"use client"

import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display text-background mb-2">Create your account</h1>
        <p className="text-sm text-background/60">Start evaluating startups in minutes</p>
      </div>
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-background/40">
        Already have an account?{" "}
        <a href="/login" className="text-background/80 hover:text-background underline underline-offset-4 transition-colors">
          Sign in
        </a>
      </p>
    </div>
  )
}
