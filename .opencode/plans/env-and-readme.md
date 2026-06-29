# Env + README updates

## 1. Create `apps/api-gateway/.env.example`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/founderiq"

# Auth secrets — generate with: openssl rand -hex 32
JWT_SECRET="replace-with-random-64-char-string"
COOKIE_SECRET="replace-with-random-64-char-string"

# AI — optional, AI endpoints return errors without this
OPENROUTER_API_KEY=
AI_MODEL=gratis

# Cloudflare R2 — optional, only needed for document uploads
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=founder-iq
R2_PUBLIC_URL=

# Frontend URL (used in interview session links)
FRONTEND_URL=http://localhost:3000
```

## 2. Append to `apps/api-gateway/README.md`

```markdown
## Quick Start (Hackathon / Prototype)

1. **Prerequisites:** Bun, PostgreSQL running locally

2. **Install & setup**
   ```bash
   bun install
   cp .env.example .env
   # Edit .env — at minimum set DATABASE_URL, JWT_SECRET, COOKIE_SECRET
   ```

3. **Database**
   ```bash
   cd packages/database
   bun x prisma migrate dev
   cd ../../apps/api-gateway
   ```

4. **Run**
   ```bash
   bun run index.ts
   # Server at http://localhost:3000
   # Ping: GET http://localhost:3000/api/v1/ping
   ```

5. **Register a user**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@test.com","password":"demo123","name":"Demo User","organization_name":"Demo Org","organization_type":"Venture_Capital"}'
   ```

### API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register user + org |
| POST | `/api/v1/auth/login` | — | Login → access + refresh cookies |
| POST | `/api/v1/auth/refresh` | Cookie | Refresh tokens |
| POST | `/api/v1/auth/logout` | Cookie | Logout |
| GET | `/api/v1/dashboard` | JWT/AK | Dashboard metrics |
| GET/POST | `/api/v1/startups` | JWT/AK | List / create startups |
| GET/PATCH | `/api/v1/startups/:id` | JWT/AK | Get / update startup |
| POST | `/api/v1/startups/:id/analyze` | JWT/AK | AI analysis |
| GET | `/api/v1/startups/:id/analyses` | JWT/AK | Get analyses |
| POST | `/api/v1/startups/:id/interview` | JWT/AK | Schedule interview |
| GET | `/api/v1/startups/:id/interview` | JWT/AK | Get interview |
| POST | `/api/v1/startups/:id/interview/score` | JWT/AK | Score an answer |
| POST | `/api/v1/startups/:id/interview/complete` | JWT/AK | Complete interview |
| GET/POST | `/api/v1/startups/:id/memo` | JWT/AK | Get/generate memo |
| POST | `/api/v1/startups/:id/documents` | JWT/AK | Upload document |
| GET/DELETE | `/api/v1/startups/:id/documents` | JWT/AK | List / delete docs |
| GET/POST | `/api/v1/candidates` | JWT/AK | List / create candidates |
| GET/PATCH | `/api/v1/candidates/:id` | JWT/AK | Get / update candidate |
| POST | `/api/v1/candidates/:id/analyze` | JWT/AK | AI analysis |
| GET | `/api/v1/candidates/:id/analyze` | JWT/AK | Get analyses |
| POST | `/api/v1/candidates/:id/interview` | JWT/AK | Schedule interview |
| GET | `/api/v1/candidates/:id/interview` | JWT/AK | Get interview |
| GET | `/api/v1/candidates/:id/memo` | JWT/AK | Get memo |
| GET/POST | `/api/v1/webhooks` | JWT/AK | List / create webhook endpoints |
| GET/PATCH/DELETE | `/api/v1/webhooks/:id` | JWT/AK | Get / update / delete |
| GET | `/api/v1/sessions/:token` | Token | Get interview session |
| POST | `/api/v1/sessions/:token` | Token | Submit answer |
| POST | `/api/v1/sessions/:token/complete` | Token | Complete session |
| GET | `/api/v1/events` | JWT/AK | Webhook delivery log |

**Auth:** JWT via `access_token` cookie, or API key via `Authorization: Bearer fiq_live_*`
```

## 3. Create root `README.md` at `/home/rishi/Rishi/hacks/founderiq/README.md`

```markdown
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
```
