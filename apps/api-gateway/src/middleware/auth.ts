/**
 * @fileoverview Authentication & authorization for the API gateway.
 *
 * Two auth methods:
 * 1. API key — `Authorization: Bearer fiq_live_<base64url>` → SHA-256 lookup
 * 2. JWT session — `access_token` signed cookie (set by /auth/login)
 *
 * Apply via `.use(authenticateRequest)` on any Elysia route group, then
 * access `auth` in the handler context:
 *
 * @example
 * const dashboard = new Elysia()
 *   .use(authenticateRequest)
 *   .get("/dashboard", ({ auth }) => {
 *     if (auth.type === "api_key") requireScope(auth, "read")
 *     // auth.organizationId, auth.userId, etc.
 *   })
 */
import { Elysia } from "elysia"
import { prisma } from "@founderiq/database"
import { verifyToken } from "../lib/jwt"
import type { JwtPayload } from "../lib/jwt"
import { sha256 } from "../lib/tokens"
import { ApiError } from "./errors"

export interface AuthContext {
  type: "jwt" | "api_key"
  organizationId: string
  userId?: string
  apiKeyId?: string
  scopes?: string[]
  role?: string
}

/**
 * Authenticate via API key. Looks up `keyHash` (SHA-256) with a unique constraint.
 * Rejects revoked keys. Updates `lastUsedAt` in the background.
 *
 * @param {string} rawKey - Full API key string (e.g. `fiq_live_...`)
 * @returns {Promise<AuthContext>}
 * @throws {ApiError} 401 — invalid_key / revoked_key
 */
export async function authenticateApiKey(rawKey: string): Promise<AuthContext> {
  const hash = sha256(rawKey)
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hash } })
  if (!key) throw new ApiError(401, "invalid_key", "The provided API key is invalid.")
  if (key.revokedAt) throw new ApiError(401, "revoked_key", "This API key has been revoked.")

  prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {})

  return {
    type: "api_key",
    organizationId: key.organizationId,
    apiKeyId: key.id,
    scopes: key.scopes,
  }
}

/**
 * Authenticate via JWT access token. Verifies the token and returns the session context.
 *
 * @param {string} token - JWT access token
 * @returns {Promise<AuthContext>}
 * @throws {ApiError} 401 — invalid_token
 */
export async function authenticateJwt(token: string): Promise<AuthContext> {
  let payload: JwtPayload
  try {
    payload = verifyToken(token)
  } catch {
    throw new ApiError(401, "invalid_token", "Invalid or expired access token.")
  }
  return {
    type: "jwt",
    organizationId: payload.organizationId!,
    userId: payload.userId,
    role: payload.role,
  }
}

/**
 * Elysia plugin that derives `auth` from the incoming request.
 *
 * Priority:
 * 1. `Authorization: Bearer <token>` — API key if prefixed `fiq_live_`, else JWT
 * 2. `access_token` signed cookie (set by login/register)
 *
 * Derived property `auth` is available in downstream route handlers via `ctx.auth`.
 */
export const authenticateRequest = new Elysia()
  .derive({ as: "scoped" }, async ({ headers, cookie }): Promise<{ auth: AuthContext }> => {
    const authHeader = headers["authorization"]
    const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null
    if (bearer) {
      if (bearer.startsWith("fiq_live_")) {
        const ctx = await authenticateApiKey(bearer)
        return { auth: ctx }
      }
      const ctx = await authenticateJwt(bearer)
      return { auth: ctx }
    }

    const cookieToken = (cookie as Record<string, { value?: string }>).access_token?.value
    if (cookieToken) {
      const ctx = await authenticateJwt(cookieToken)
      return { auth: ctx }
    }

    throw new ApiError(401, "unauthorized", "Authentication required.")
  })

/**
 * Check that an API key context includes the required scope.
 * No-op for JWT sessions (role-based auth can be checked separately).
 *
 * @param {AuthContext} ctx - Auth context from `authenticateRequest`
 * @param {string} scope - Required scope (e.g. "read", "write")
 * @throws {ApiError} 403 — forbidden
 *
 * @example if (auth.type === "api_key") requireScope(auth, "read")
 */
export function requireScope(ctx: AuthContext, scope: string): void {
  if (ctx.type === "api_key" && ctx.scopes && !ctx.scopes.includes(scope)) {
    throw new ApiError(403, "forbidden", `This API key is missing the "${scope}" scope.`)
  }
}
