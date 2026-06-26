import jwt from "jsonwebtoken"

const SECRET = (): string => {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET enviroment variable is reuquired')
    return secret;
}

const ACCESS_EXPIRY = (): string => process.env.JWT_ACCESS_EXPIRY || '15m'
const REFRESH_EXPIRY = (): string => process.env.JWT_REFRESH_EXPIRY || '7d'

export interface JwtPayload {
    userId: string
    organizationId?: string
    role: string
}

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET(), {
        expiresIn: ACCESS_EXPIRY() as any
    });
}

export function signRefreshToken(userId: string): string {
    return jwt.sign({
        userId,
        type:'refresh'
    }, 
    SECRET(),
    { expiresIn: REFRESH_EXPIRY() as any }
)}

export function verifyToken(token:string): JwtPayload {
    return jwt.verify(token, SECRET()) as unknown as JwtPayload;
}

export function verifyRefreshToken(token:string): {userId:string} {
    const payload = jwt.verify(token,SECRET()) as {
        userId: string,
        type: string
    }
    if (payload.type !== 'refresh') throw new Error('Invalid Token Type')
    return payload;
}