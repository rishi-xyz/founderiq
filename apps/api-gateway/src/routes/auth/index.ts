import { Elysia } from "elysia"
import { register } from "node:module"

/**
 * Elysia plugin registering auth-related routes.
 *
 * @example
 * import { routerv1 } from "../index";
 * routerv1.use(registerAuthRoute);
 *
 * // GET /api/v1/authregister
 */
export const AuthRoute = new Elysia()
  .group("/auth" , app => app.use(authRegister))

export const authRegister = new Elysia().post("/register" , ()=>{
    // get body get email , name , password,
    // check if gmail alredy exist or not
    // create account if doesn't exist 
    // return error if does  exist
    return {
    }
})