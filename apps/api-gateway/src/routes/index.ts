import { Elysia } from "elysia"
import { pingRoute } from "./ping"
import { AuthRoute } from "./auth"

/**
 * v1 API router — all routes are under `/api/v1/*`.
 * Create additional versions by adding another group:
 * @example
 * export const api = new Elysia({ prefix: "/api" })
 *   .use(routerv1)
 *   .use(routerv2);
 * export const routerv2 = new Elysia().group("/v2", app => app.use(...));
 */
export const routerv1 = new Elysia()
  .group("/v1", app =>
    app.use(pingRoute).use(AuthRoute)
  )