/**
 * @fileoverview API Gateway — Elysia server entry point.
 * Signed cookies for auth tokens, CORS with whitelisted origins, OpenAPI docs,
 * global error handler, and v1 routes mounted at `/api/v1`.
 */
import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { routerv1 } from "./routes"
import { ApiError } from "./middleware"
import { openapi } from "@elysia/openapi"

/** Server port from `PORT` env, defaults to 5000. */
const port = process.env.PORT || 5000

/** CORS origins from comma-separated `PLATFORM_URL`, defaults to `http://localhost:3001`. */
const allowedOrigins = (process.env.PLATFORM_URL || "http://localhost:3001").split(",")

/**
 * Elysia app with signed cookies for `access_token` and `refresh_token`,
 * httpOnly, secure in production, sameSite lax.
 */
const app = new Elysia({
    cookie : {
        secrets: process.env.COOKIE_SECRET!,
        sign: ["access_token", "refresh_token"],
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    }
})
  .use(openapi())
  .use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 86400,
    }),
  )
  /**
   * Global error handler normalising errors into `{ ok: false, error: { code, message } }`.
   *
   * Priority: `ApiError` → Elysia lifecycle codes → 500 fallback.
   * @note In production, internal error details are hidden behind a generic message.
   *
   * @param {Object}   ctx        - Error context from Elysia
   * @param {string}   ctx.code   - Error code (e.g. "NOT_FOUND", "VALIDATION")
   * @param {Error}    ctx.error  - The thrown error
   * @param {Object}   ctx.set    - Response setter
   * @returns {{ ok: false, error: { code: string, message: string } }}
   *
   * @example throw new ApiError(409, "user_already_exists", "Email already registered")
   * @example // 404 → { ok: false, error: { code: "not_found", message: "Route Not Found." } }
   */
  .onError(({ code, error, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status
      return {
        ok: false,
        error: { code: error.code, message: error.message },
      }
    }

    switch (code) {
      case "NOT_FOUND":
        set.status = 404
        return {
          ok: false,
          error: { code: "not_found", message: "Route Not Found." },
        }
      case "PARSE":
        set.status = 400
        return {
          ok: false,
          error: { code: "parse_error", message: "Invalid request body format" },
        }
      case "INVALID_COOKIE_SIGNATURE":
        set.status = 400
        return {
          ok: false,
          error: { code: "invalid_cookie_signature", message: "Invalid cookie signature" },
        }
      case "INVALID_FILE_TYPE":
        set.status = 415
        return {
          ok: false,
          error: { code: "invalid_file_type", message: "File type not allowed" },
        }
      case "VALIDATION":
        set.status = 422
        return {
          ok: false,
          error: { code: "validation_error", message: "Invalid request body" },
        }
      case "UNKNOWN":
        set.status = 400
        return {
          ok: false,
          error: { code: "unknown_error", message: "Unknown error has occurred" },
        }
      default:
        const message =
          process.env.NODE_ENV === "production"
            ? "An unexpected error has occurred."
            : error instanceof Error
              ? error.message
              : String(error)
        console.error("[ERROR]", error instanceof Error ? error.message : String(error))
        set.status = 500
        return {
          ok: false,
          error: { code: "internal_error", message },
        }
    }
  })
  .group("/api", (app) => app.use(routerv1),)
  .listen(port)

console.log(`founderIQ API gateway running on port: ${port}`)
