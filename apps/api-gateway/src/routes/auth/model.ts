/**
 * @fileoverview TypeBox validation schemas + derived TS types for auth endpoints.
 * Types stay in sync with runtime validation via `UnwrapSchema`.
 *
 * @example AuthModel['authbody'] → { email: string; password: string; name?: string }
 */
import { t, type UnwrapSchema } from "elysia";

/** Optional string schema for refresh token cookie. */
export const refreshModel = t.Optional(t.String());

/** Optional string schema for access token cookie. */
export const accessModel = t.Optional(t.String());

/**
 * AuthModel bundle: cookie schemas + request body schema.
 * - `authCookie`: signed cookie with `access_token` + `refresh_token`
 * - `authbody`: `{ email, password (min 8), name? }`
 */
export const AuthModel = {
    refreshToken: refreshModel,
    accessToken: accessModel,
    authCookie: t.Cookie({
        access_token: accessModel,
        refresh_token: refreshModel,
    }),
    authbody: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.Optional(t.String()),
    }),
} as const

/** Unwraps TypeBox schemas → TS types. */
export type AuthModel = {
    [k in keyof typeof AuthModel]: UnwrapSchema<typeof AuthModel[k]>
}

export type RefreshToken = AuthModel['refreshToken']
export type AccessToken = AuthModel['accessToken']