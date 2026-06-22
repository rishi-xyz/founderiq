import { corsHeaders } from "../../middleware/cors";
import type { Router } from "../router";

export function pingRoute(router: Router): void {
    router.get('/ping', async () => {
        return Response.json({
            ok: true,
            reponse: "pong"
        });
    });
}