import Bun from "bun"
import { corsHeaders, handleCors } from "./middleware/cors";
import { routerv1 } from "./routes";

const port = process.env.PORT || 5000;

Bun.serve({
    port,
    async fetch(req) {
        // CORS
        const corsResponse = handleCors(req);
        if (corsResponse) return corsResponse;

        const origin_  = req.headers.get('Origin');
        // Routing
        try {
            const response_ = await routerv1.dispatch(req);
            if (response_) {
                const newHeaders = new Headers(response_.headers);
                for (const [key,value] of Object.entries(corsHeaders(origin_))) {
                    if (!newHeaders.has(key)) newHeaders.set(key,value);
                }
                return new Response(response_.body, {
                    status: response_.status,
                    headers: newHeaders,
                });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                ok: false,
                error : {
                    code: "invalid_route",
                    message : "Route Invalid."
                }
            }),{
                status : 401,
                headers : {
                    ...corsHeaders(origin_),
                    'Content-Type':'application/json',
                }
            })
        }

        // 404
        return new Response(
            JSON.stringify({ 
                ok: false,
                error: {
                    code: "not_found",
                    message: "Route Not Found."
                }
            }),{
                status: 404,
                headers : {
                    ...corsHeaders(origin_),
                    'Content-Type':'application/json',
                }
            },
        );
    },
})

console.log(`founderIQ API gateway running on port: ${port}`);