/**
 * @fileoverview Auth business logic — Argon2 hashing, JWT sessions, Prisma persistence.
 * Access tokens carry `{ userId, organizationId?, role }`; refresh carry `{ userId, type:'refresh' }`.
 * Sessions stored in DB with 7-day TTL.
 */
import { prisma, type User } from "@founderiq/database";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { ApiError } from "../../middleware";
import type { AuthModel, RefreshToken } from "./model";
import { hash, verify } from "argon2";

export abstract class AuthService {
    /**
     * Create a new user account. Checks email uniqueness, hashes password, creates user+session in a transaction.
     *
     * @param {{ email: string, password: string }} body - Registration payload (password min 8 chars)
     * @returns {Promise<{ access_token: string, refresh_token: string, user: User }>}
     * @throws {ApiError} 409 - user_already_exists
     * @throws {ApiError} 500 - error_creating_user / error_creating_session
     *
     * @example const { access_token, user } = await AuthService.register({ email:"a@b.com", password:"pass1234" })
     */
    static async register({ email, password, name }: AuthModel['authbody']): Promise<{
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
            const orgName = name
                ? `${name}'s Firm`
                : `${email.split('@')[0]}'s Firm`
            const org = await tx.organization.create({
                data: { name: orgName, type: 'Others' }
            }).catch((err) => {
                if (process.env.NODE_ENV !== "production") console.log("[Error] creating organization", err)
                throw new ApiError(500, "error_creating_org", "Error creating organization.")
            })
            const user = await tx.user.create({
                data: { email, password: hashed_password, role: 'ANALYST', organizationId: org.id }
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

    /**
     * Authenticate user by email, verify password, create session.
     *
     * @param {{ email: string, password: string }} body - Login credentials
     * @returns {Promise<{ access_token: string, refresh_token: string, user: User }>}
     * @throws {ApiError} 401 - user_not_found / wrong_credentials
     * @throws {ApiError} 500 - error_creating_session
     *
     * @example const { access_token, user } = await AuthService.login({ email:"a@b.com", password:"pass1234" })
     */
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
        if (!(await verify(user.password!, password))) throw new ApiError(401, "wrong_credentials", "Wrong username or password");
        const access_token = signAccessToken({ userId: user.id, organizationId: user.organizationId ?? undefined, role: user.role })
        const refresh_token = signRefreshToken(user.id);
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

    /**
     * Rotate tokens: validate JWT + session expiry, delete old session, create new one.
     *
     * @param {string|null} refresh_token - Raw refresh token from cookie
     * @returns {Promise<{ access_token: string, refresh_token: string }>}
     * @throws {ApiError} 401 - missing_refresh_token / invalid_refresh_token / session_expired / user_not_found
     * @throws {ApiError} 500 - error_refreshing_token
     *
     * @example const tokens = await AuthService.refresh("eyJhbG...")
     */
    static async refresh(refresh_token: AuthModel['refreshToken']): Promise<AuthModel['authCookie']> {
        if (!refresh_token) throw new ApiError(401, "missing_refresh_token", "Refresh Token not Found.")
        let payload;
        try {
            payload = verifyRefreshToken(refresh_token)
        } catch (error) {
            throw new ApiError(401, "invalid_refresh_token", "Invalid or expired refresh token.")
        }
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

    /**
     * Delete session by refresh token.
     *
     * @param {string} refresh_token - Token identifying the session to delete
     * @returns {Promise<void>}
     * @throws {ApiError} 500 - failed_session_deletion
     *
     * @example await AuthService.logout("eyJhbG...")
     */
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