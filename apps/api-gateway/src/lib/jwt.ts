/**
 * @fileoverview JWT signing & verification. Access tokens (default 15m) carry `{ userId, organizationId?, role }`;
 * refresh tokens (default 7d) carry `{ userId, type:'refresh' }`. All signed with `JWT_SECRET`.
 *
 * @note `JWT_SECRET` env var is required at startup.
 */
import jwt from "jsonwebtoken"

/** Reads `JWT_SECRET` from env. @throws {Error} if missing. */
const SECRET = (): string => {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET enviroment variable is reuquired')
    return secret;
}

/** Access token TTL from `JWT_ACCESS_EXPIRY` env, defaults to `'15m'`. */
const ACCESS_EXPIRY = (): string => process.env.JWT_ACCESS_EXPIRY || '15m'

/** Refresh token TTL from `JWT_REFRESH_EXPIRY` env, defaults to `'7d'`. */
const REFRESH_EXPIRY = (): string => process.env.JWT_REFRESH_EXPIRY || '7d'

export interface JwtPayload {
    userId: string
    organizationId?: string
    role: string
}

/**
 * Sign a short-lived access token.
 *
 * @param {JwtPayload} payload - `{ userId, organizationId?, role }`
 * @returns {string} Signed JWT
 *
 * @example signAccessToken({ userId:"usr_1", role:"ADMIN" }) → "eyJ..."
 */
export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET(), {
        expiresIn: ACCESS_EXPIRY() as any
    });
}

/**
 * Sign a long-lived refresh token with `type:'refresh'` discriminator.
 *
 * @param {string} userId - User identifier for session lookup
 * @returns {string} Signed JWT
 *
 * @example signRefreshToken("usr_1") → "eyJ..."
 */
export function signRefreshToken(userId: string): string {
    return jwt.sign({
        userId,
        type:'refresh'
    }, 
    SECRET(),
    { expiresIn: REFRESH_EXPIRY() as any }
)}

/**
 * Verify any JWT and return decoded payload.
 *
 * @param {string} token - JWT string
 * @returns {JwtPayload} Decoded claims
 * @throws {JsonWebTokenError} Invalid signature
 * @throws {TokenExpiredError} Token expired
 *
 * @example verifyToken("eyJ...") → { userId:"usr_1", role:"ADMIN" }
 */
export function verifyToken(token:string): JwtPayload {
    return jwt.verify(token, SECRET()) as unknown as JwtPayload;
}

/**
 * Verify a refresh token and assert `type === 'refresh'`.
 *
 * @param {string} token - Refresh JWT
 * @returns {{ userId: string }} Decoded payload
 * @throws {JsonWebTokenError} Invalid signature
 * @throws {TokenExpiredError} Expired
 * @throws {Error} `'Invalid Token Type'` if not a refresh token
 *
 * @example verifyRefreshToken("eyJ...") → { userId:"usr_1" }
 */
export function verifyRefreshToken(token:string): {userId:string} {
    const payload = jwt.verify(token,SECRET()) as {
        userId: string,
        type: string
    }
    if (payload.type !== 'refresh') throw new Error('Invalid Token Type')
    return payload;
}