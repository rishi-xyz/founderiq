import { Elysia } from "elysia"

export const pingRoute = new Elysia().get("/ping", () => {
  return {
    ok: true,
    reponse: "pong",
  }
})
