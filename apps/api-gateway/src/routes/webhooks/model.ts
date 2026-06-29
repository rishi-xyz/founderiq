import { t, type UnwrapSchema } from "elysia"

const params = t.Object({
  id: t.String(),
})

const postWebhookBody = t.Object({
  url: t.String({ minLength: 1 }),
  events: t.Array(t.String(), { minItems: 1 }),
})

const patchWebhookBody = t.Object({
  url: t.Optional(t.String({ minLength: 1 })),
  events: t.Optional(t.Array(t.String(), { minItems: 1 })),
  active: t.Optional(t.Boolean()),
})

const webhookResponse = t.Object({
  id: t.String(),
  url: t.String(),
  events: t.Array(t.String()),
  active: t.Boolean(),
  created_at: t.String(),
})

const webhookCreateResponse = t.Object({
  id: t.String(),
  url: t.String(),
  secret: t.String(),
  events: t.Array(t.String()),
  active: t.Boolean(),
  created_at: t.String(),
})

const listResponse = t.Object({
  ok: t.Literal(true),
  data: t.Array(webhookResponse),
})

const singleResponse = t.Object({
  ok: t.Literal(true),
  data: webhookResponse,
})

const createResponse = t.Object({
  ok: t.Literal(true),
  data: webhookCreateResponse,
})

const deleteResponse = t.Object({
  ok: t.Literal(true),
  data: t.Object({ deleted: t.Literal(true) }),
})

export const WebhookModel = {
  params,
  postWebhookBody,
  patchWebhookBody,
  webhookResponse,
  webhookCreateResponse,
  listResponse,
  singleResponse,
  createResponse,
  deleteResponse,
} as const

export type WebhookModel = {
  [k in keyof typeof WebhookModel]: UnwrapSchema<typeof WebhookModel[k]>
}
