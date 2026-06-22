import Bun from "bun"

const port = process.env.PORT || 5000;

Bun.serve({
    port,
    async fetch(req, server) {
        return new Response("Hello")
    },
})

console.log(`founderIQ API gateway running on port: ${port}`);