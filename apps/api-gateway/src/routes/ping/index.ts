import type { Router } from "../router";

export function pingRoute(router: Router): void {
    router.get('/ping', async () => {
        return new Response("pong");
    });
}