/**
 * Shape of an error response returned to the client.
 *
 * @property status - HTTP status code
 * @property code - Machine-readable error code (e.g. `"not_found"`)
 * @property message - Human-readable error description
 */
export interface AppError {
    status: number
    code: string
    message: string
}

/**
 * Extends `Error` with an HTTP status code and machine-readable error code.
 *
 * Throw this from route handlers to produce structured error responses
 * via the Elysia `onError` hook.
 *
 * @param status - HTTP status code (e.g. 400, 404, 500)
 * @param code - Short identifier for the error type (e.g. `"not_found"`)
 * @param message - Human-readable error message
 *
 * @example
 * throw new ApiError(404, "not_found", "User not found");
 */
export class ApiError extends Error {
    status: number
    code: string
    constructor(status: number, code: string, message: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

/**
 * Returns a set of security-related HTTP response headers.
 *
 * @returns A record of header name → value pairs
 *
 * @example
 * new Response(body, { headers: { ...securityHeaders() } });
 */
export function securityHeaders(): Record<string, string> {
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    };
}
