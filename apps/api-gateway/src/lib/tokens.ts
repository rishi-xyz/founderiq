/**
 * @fileoverview Token utilities — SHA-256 hashing, API key / interview token / webhook secret generation.
 * All key material uses 192+ bits of CSPRNG entropy.
 */
import { randomBytes, createHash, timingSafeEqual } from "crypto"

/**
 * Deterministic SHA-256 hex digest. Used for API key hashing so that
 * `findUnique({ where: { keyHash } })` is possible.
 *
 * @param {string} value - Raw key material
 * @returns {string} Hex-encoded SHA-256 digest
 *
 * @example sha256("fiq_live_abc123") → "a665a45920422f9d..."
 */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

/**
 * Constant-time hex comparison to prevent timing attacks on key hash checks.
 *
 * @param {string} a - First hex string
 * @param {string} b - Second hex string
 * @returns {boolean} True if equal
 */
export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex")
  const bb = Buffer.from(b, "hex")
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/**
 * Generate a new API key in `fiq_live_<base64url>` format.
 *
 * @returns {{ raw: string, prefix: string, hash: string, lastFour: string }}
 *
 * @example generateApiKey()
 * // → { raw: "fiq_live_abc...", prefix: "fiq_live_abc", hash: "a665a45...", lastFour: "defg" }
 */
export function generateApiKey(): {
  raw: string
  prefix: string
  hash: string
  lastFour: string
} {
  const random = randomBytes(24).toString("base64url")
  const raw = `fiq_live_${random}`
  return {
    raw,
    prefix: raw.slice(0, 12),
    hash: sha256(raw),
    lastFour: raw.slice(-4),
  }
}

/**
 * Generate an interview session token (no prefix — shared via link).
 *
 * @returns {{ raw: string, hash: string }}
 */
export function generateInterviewToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url")
  return { raw, hash: sha256(raw) }
}

/**
 * Generate a webhook signing secret.
 *
 * @returns {string} Secret in `whsec_<base64url>` format
 */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`
}
