import { Elysia } from "elysia"
import { pingRoute } from "./ping"
import { AuthRoute } from "./auth"

export const routerv1 = new Elysia().group("/v1", (app) => app.use(pingRoute).use(AuthRoute))
