/**
 * @fileoverview TypeBox validation schemas + derived TS types for the events endpoint.
 */
import { t, type UnwrapSchema } from "elysia"

/** A single webhook delivery in the response array. */
const deliveryItem = t.Object({
  id: t.String(),
  eventType: t.String(),
  payload: t.Unknown(),
  responseStatus: t.Optional(t.Number()),
  success: t.Boolean(),
  createdAt: t.Date(),
})

/**
 * EventModel bundle: query param schema + response schema.
 *
 * - `query`: `{ limit? }` — defaults to 50, max 100
 * - `response`: `{ ok: true, data: DeliveryItem[] }`
 */
export const EventModel = {
  query: t.Object({
    limit: t.Optional(t.Numeric({ default: 50, maximum: 100 })),
  }),
  response: t.Object({
    ok: t.Literal(true),
    data: t.Array(deliveryItem),
  }),
} as const

/** Unwraps TypeBox schemas → TS types. */
export type EventModel = {
  [k in keyof typeof EventModel]: UnwrapSchema<typeof EventModel[k]>
}
