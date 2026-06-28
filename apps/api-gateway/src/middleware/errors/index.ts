/**
 * @fileoverview Structured API error class (`ApiError`) + security headers utility.
 * Caught by global `onError` handler and serialised as `{ ok: false, error: { code, message } }`.
 *
 * @example throw new ApiError(409, "user_already_exists", "Email taken")
 * @example // → 409 { ok: false, error: { code: "user_already_exists", message: "Email taken" } }
 */

export interface AppError {
  status: number
  code: string
  message: string
}

/**
 * Error class carrying HTTP status + machine-readable code. Caught by global error handler.
 *
 * @param {number} status - HTTP status (e.g. 400, 401, 409, 500)
 * @param {string} code - Error code, snake_case (e.g. "user_not_found")
 * @param {string} message - Human-readable description
 *
 * @example throw new ApiError(401, "wrong_credentials", "Wrong username or password")
 */
export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/**
 * Returns recommended security headers:
 * `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`.
 *
 * @returns {Record<string, string>} Header name → value pairs
 *
 * @example app.onResponse(({ set }) => Object.assign(set.headers, securityHeaders()))
 */
export function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  }
}
