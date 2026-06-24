# api-gateway

HTTP API gateway built on [Elysia](https://elysiajs.com) + [Bun](https://bun.sh).

## Setup

```bash
bun install
```

## Running

```bash
bun run index.ts
```

## Router

The gateway uses [Elysia](https://elysiajs.com) — a Bun-native framework with built-in support for middleware, validation, error handling, and path prefixing.

### API Versioning

Versioned routers are created in `src/routes/index.ts` using Elysia's `prefix` option:

```ts
export const routerv1 = new Elysia({ prefix: "/api/v1" });
export const routerv2 = new Elysia({ prefix: "/api/v2" }); // future
```

Routes are registered without the prefix — it's prepended automatically:

```ts
app.get("/ping", handler);       // matches GET /api/v1/ping
app.get("/users/:id", handler);  // matches GET /api/v1/users/:id
```

### Adding Routes

Create an Elysia plugin under `src/routes/`:

```ts
// src/routes/items/index.ts
import { Elysia } from "elysia";

export const itemsRoute = new Elysia()
  .get("/items", () => {
    return { items: [] };
  });
```

Wire it up in `src/routes/index.ts`:

```ts
import { itemsRoute } from "./items";
export const routerv1 = new Elysia({ prefix: "/api/v1" })
  .use(itemsRoute);
```

### Error Handling

Throw `ApiError` from handlers for structured responses:

```ts
import { ApiError } from "../middleware";

app.get("/users/:id", ({ params: { id } }) => {
  throw new ApiError(404, "not_found", "User not found");
});
```

Errors are caught by the `onError` hook in `src/index.ts` and returned as `{ ok: false, error: { code, message } }`.

### Current Routes

| Method | Path               | Handler            |
|--------|--------------------|--------------------|
| GET    | `/api/v1/ping`     | Health check       |
| GET    | `/api/v1/authregister` | Auth (stub)    |
