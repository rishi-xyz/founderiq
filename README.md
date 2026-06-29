# FounderIQ

AI-powered deal sourcing & intelligent interview pipeline for venture capital firms.

## Monorepo Structure

```
apps/
  api-gateway/   — Elysia.js HTTP API (Bun)
packages/
  database/      — Prisma schema + client
```

## Quick Start

See `apps/api-gateway/README.md` for setup instructions.

## Stack

- **Runtime:** Bun
- **API:** Elysia.js
- **ORM:** Prisma + PostgreSQL
- **Auth:** JWT (access + refresh tokens), API keys (SHA-256)
- **AI:** OpenRouter (free tier)
- **Storage:** Cloudflare R2 (S3-compatible)
