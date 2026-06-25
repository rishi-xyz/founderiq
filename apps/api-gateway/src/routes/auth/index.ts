import { Elysia } from "elysia"

const authRegister = new Elysia().post("/register", ({body}) => {
  
  return {}
})

export const AuthRoute = new Elysia().group("/auth", (app) => app.use(authRegister))
