export interface AppError {
    status: number
    code: string
    message: string
}

export class HttpError extends Error {
    status: number
    code: string
    constructor(status: number,  code: string, message: string) {
        super(message);
        this.status = status;
        this.code  = code;
    }
}

export function handleError(error: unknown, request: Request): Response {
    const origin_ = request.headers.get('Origin');
    
    return new Response();
}