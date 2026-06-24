import { Elysia } from "elysia"

/**
 * Elysia plugin registering a `GET /api/v1/ping` health-check endpoint.
 *
 * @example
 * import { routerv1 } from "../index";
 * routerv1.use(pingRoute);
 *
 * // GET /api/v1/ping
 * // → { "ok": true, "reponse": "pong" }
 */
export const pingRoute = new Elysia()
  .get("/ping", () => {
    return {
      ok: true,
      reponse: "pong",
    }
  })