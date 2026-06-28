/**
 * @fileoverview Health-check: `GET /api/v1/ping` → `{ ok: true, response: "pong" }`.
 * Used by load balancers and monitoring to verify the server is alive.
 *
 * @example GET /api/v1/ping → 200 { "ok": true, "response": "pong" }
 */
import { Elysia } from "elysia"

export const pingRoute = new Elysia().get("/ping", () => {
  return {
    ok: true,
    response: "pong",
  }
})
