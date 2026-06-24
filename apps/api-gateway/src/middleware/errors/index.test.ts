import { describe, it, expect } from "bun:test";
import { ApiError, securityHeaders } from ".";

describe("ApiError", () => {
  it("extends Error", () => {
    const err = new ApiError(404, "not_found", "User not found");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });

  it("stores status, code, and message", () => {
    const err = new ApiError(400, "bad_request", "Invalid input");
    expect(err.status).toBe(400);
    expect(err.code).toBe("bad_request");
    expect(err.message).toBe("Invalid input");
  });
});

describe("securityHeaders", () => {
  it("returns all four security headers", () => {
    const headers = securityHeaders();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("returns exactly four headers", () => {
    expect(Object.keys(securityHeaders())).toHaveLength(4);
  });
});
