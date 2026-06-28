import { t, type UnwrapSchema } from "elysia";

export const refreshModel = t.Optional(t.String());
export const accessModel = t.Optional(t.String());

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

export type AuthModel = {
    [k in keyof typeof AuthModel]: UnwrapSchema<typeof AuthModel[k]>
}

export type RefreshToken = AuthModel['refreshToken']
export type AccessToken = AuthModel['accessToken']