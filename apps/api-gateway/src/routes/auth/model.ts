import { t, type UnwrapSchema } from "elysia";

export const AuthModel = {
    authCookie: t.Cookie({
        access_token: t.Optional(t.String()),
        refresh_token: t.Optional(t.String()),
    }),
    authbody: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.Optional(t.String()),
    }),
} as const

export type AuthModel = {
    [k in keyof typeof AuthModel]: UnwrapSchema<typeof AuthModel[k]>
}