/**
 * @fileoverview Mounts all route modules under `/v1`.
 * Parent mounts this at `/api`, so effective base is `/api/v1`.
 *
 * Routes: `GET /ping`, `POST /auth/{register,login,refresh,logout}`
 */
import { Elysia, t } from "elysia"
import { pingRoute } from "./ping"
import { AuthRoute } from "./auth"
import { dashboardRoute } from "./dashboard"

export const routerv1 = new Elysia().group("/v1", (app) => app.use(pingRoute).use(AuthRoute).use(dashboardRoute));
