import type { Router } from "../router/router";

/**
 * Register a `GET /ping` health-check endpoint.
 *
 * @param router - The router instance to register the route on
 * @example
 * import { routerv1 } from "../index";
 * pingRoute(routerv1);
 *
 * // GET /ping
 * // → { "ok": true, "reponse": "pong" }
 */
export function pingRoute(router: Router): void {
    router.get('/ping', async () => {
        return Response.json({
            ok: true,
            reponse: "pong"
        });
    });
}