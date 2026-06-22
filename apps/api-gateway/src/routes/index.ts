import { pingRoute } from "./ping";
import { Router } from "./router";

/**
 * Singleton v1 router instance.
 * Import this in route modules to register endpoints.
 *
 * @example
 * // src/routes/users/index.ts
 * import { routerv1 } from "../index";
 *
 * routerv1.get("/users", async () => {
 *   return Response.json({ users: [] });
 * });
 */
export const routerv1 = new Router();

pingRoute(routerv1);