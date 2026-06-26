import { prisma, type User } from "@founderiq/database";
import { signAccessToken, signRefreshToken } from "../../lib/jwt";
import { ApiError } from "../../middleware";
import type { AuthModel } from "./model";
import { hash, verify } from "argon2";

export abstract class Auth {
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
                throw new Error(err);
            }
        })
        // check the hash passowrd matches or not
        if (!(await verify(user.password,password))) throw new ApiError(401, "wrong_credentials", "Wrong username or password");
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
}