import { corsHeaders } from "../cors"

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
 * Throw or return this from handlers to produce structured error responses
 * via {@link handleError}.
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
 * Converts an unknown error value into a JSON {@link Response}.
 *
 * - `ApiError` instances produce a response with the error's own status, code
 *   and message.
 * - All other errors produce a 500 `"internal_error"` response.  In
 *   production the real error message is hidden behind a generic string.
 *
 * @param error - The thrown or caught error value
 * @param request - The original request (used to derive the CORS origin)
 * @returns A {@link Response} with JSON body `{ ok: false, error: { code, message } }`
 *
 * @example
 * // In a request handler:
 * try {
 *   return await handler(req);
 * } catch (err) {
 *   return handleError(err, req);
 * }
 */
export function handleError(error: unknown, request: Request): Response {
    const origin = request.headers.get("Origin");

    if (error instanceof ApiError) {
        return Response.json(
            { ok: false, error: { code: error.code, message: error.message } },
            { status: error.status, headers: corsHeaders(origin) },
        );
    }

    const message =
        process.env.NODE_ENV === "production"
            ? "An unexpected error has occurred."
            : error instanceof Error
                ? error.message
                : String(error);

    console.error("[ERROR]", error instanceof Error ? error.message : String(error));

    return Response.json(
        { ok: false, error: { code: "internal_error", message } },
        { status: 500, headers: corsHeaders(origin) },
    );
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
