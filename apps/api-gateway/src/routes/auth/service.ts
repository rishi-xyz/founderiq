import { prisma, type User } from "@founderiq/database";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { ApiError } from "../../middleware";
import type { AuthModel, RefreshToken } from "./model";
import { hash, verify } from "argon2";

export abstract class AuthService {
    static async register({ email, password }: AuthModel['authbody']): Promise<{
        access_token: string,
        refresh_token: string,
        user: User
    }> {
        const existing_user = await prisma.user.findUnique({
            where: {
                email
            }
        });
        if (existing_user) throw new ApiError(409, "user_already_exists", "An account with this email already exists")
        const hashed_password = await hash(password);
        const [user, refresh_token] = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, password: hashed_password, role: 'ANALYST' }
            }).catch((err) => {
                if (process.env.NODE_ENV !== "production") console.log("[Error] creating user", err)
                throw new ApiError(500, "error_creating_user", "Error creating user.")
            });
            const refresh_token = signRefreshToken(user.id);
            await tx.session.create({ data: { userId: user.id, refreshToken: refresh_token, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) } })
                .catch((err) => {
                    if (process.env.NODE_ENV !== "production") console.log("[Error] creating session", err)
                    throw new ApiError(500, "error_creating_session", "Error creating user session.")
                })
            return [user, refresh_token] as const
        })
        const access_token = signAccessToken({
            userId: user.id,
            organizationId: user.organizationId ?? undefined,
            role: user.role
        });

        return { access_token, refresh_token, user };
    }

    static async login({ email, password }: AuthModel['authbody']): Promise<{
        access_token: string,
        refresh_token: string,
        user: User
    }> {
        const user = await prisma.user.findUniqueOrThrow({
            where: {
                email
            }
        }).catch((err) => {
            if (err.code == 'P2025') {
                throw new ApiError(401, "user_not_found", "User doesn't exist");
            } else {
                if (process.env.NODE_ENV !== "production") console.log(`[Error]: Err has occured :${err}`)
                throw new Error(err);
            }
        })
        // check the hash passowrd matches or not
        if (!(await verify(user.password, password))) throw new ApiError(401, "wrong_credentials", "Wrong username or password");
        // create accessToken
        const access_token = signAccessToken({ userId: user.id, organizationId: user.organizationId ?? undefined, role: user.role })
        // create refresh token
        const refresh_token = signRefreshToken(user.id);
        // create session
        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: refresh_token,
                expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
            }
        }).catch((err) => {
            if (process.env.NODE_ENV !== "production") console.log("[Error] creating session", err)
            throw new ApiError(500, "error_creating_session", "Error creating user session.")
        })

        return { access_token, refresh_token, user };
    }

    static async refresh(refresh_token: AuthModel['refreshToken']): Promise<AuthModel['authCookie']> {
        if (!refresh_token) throw new ApiError(401, "missing_refresh_token", "Refresh Token not Found.")
        let payload;
        try {
            payload = verifyRefreshToken(refresh_token)
        } catch (error) {
            throw new ApiError(401, "invalid_refresh_token", "Invalid or expired refresh token.")
        }
        // find  the session and verify the date to expire_at date
        const session = await prisma.session.findUniqueOrThrow({
            where: {
                refreshToken: refresh_token
            }
        }).catch((err) => {
            if (err.code == 'P2025') {
                throw new ApiError(401, "user_not_found", "User doesn't exist");
            } else {
                if (process.env.NODE_ENV !== "production") console.log(`[Error]: Err has occured :${err}`)
                throw new Error(err);
            }
        })
        if (session.expiresAt < new Date()) throw new ApiError(401, 'session_expired', 'Session has expired.')
        const user = await prisma.user.findUniqueOrThrow({
            where: {
                id: payload.userId
            }
        }).catch((err) => {
            if (err.code == 'P2025') {
                throw new ApiError(401, "user_not_found", "User doesn't exist");
            } else {
                if (process.env.NODE_ENV !== "production") console.log(`[Error]: Err has occured :${err}`)
                throw new Error(err);
            }
        });
        const newAccessToken = signAccessToken({
            userId: user.id,
            organizationId: user.organizationId!,
            role: user.role
        });
        const newRefreshToken = signRefreshToken(user.id);
        await prisma.$transaction(async (tx) => {
            await tx.session.delete({ where: { id: session.id } });
            await tx.session.create({
                data: {
                    userId: user.id,
                    refreshToken: newRefreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
                }
            });
        }).catch((err) => {
            if (process.env.NODE_ENV !== "production") console.log(`[Error]: Err has occurred :${err}`);
            throw new ApiError(500, "error_refreshing_token", err);
        })

        return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }

    static async logout(refresh_token: AuthModel['refreshToken']): Promise<void> {
        await prisma.session.delete({
            where: {
                refreshToken: refresh_token
            }
        }).catch((err) => {
            if (process.env.NODE_ENV !== "production") console.log(`[Error]: Error deleting session from database. Error : ${err}`);
            throw new ApiError(500, 'failed_session_deletion', "Failed to delete session.")
        })
    }
}