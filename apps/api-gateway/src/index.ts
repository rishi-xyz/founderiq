import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { routerv1 } from "./routes"
import { ApiError } from "./middleware"

const port = process.env.PORT || 5000

const allowedOrigins = (process.env.PLATFORM_URL || "http://localhost:3001").split(",")

const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 86400,
    }),
  )
  .onError(({ code, error, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status
      return {
        ok: false,
        error: { code: error.code, message: error.message },
      }
    }

    if (code === "NOT_FOUND") {
      set.status = 404
      return {
        ok: false,
        error: { code: "not_found", message: "Route Not Found." },
      }
    }

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
  })
  .group("/api", (app) => app.use(routerv1))
  .listen(port)

console.log(`founderIQ API gateway running on port: ${port}`)
