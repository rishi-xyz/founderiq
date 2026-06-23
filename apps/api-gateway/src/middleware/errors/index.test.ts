import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { ApiError, handleError, securityHeaders } from ".";

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

describe("handleError", () => {
  const defaultReq = new Request("http://localhost/test", {
    headers: { Origin: "http://localhost:3001" },
  });

  beforeEach(() => {
    delete process.env.NODE_ENV;
    process.env.PLATFORM_URL = "http://localhost:3001,http://custom-origin.com";
    spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.PLATFORM_URL;
    (console.error as any).mockRestore();
  });

  it("returns the ApiError status and code for ApiError instances", async () => {
    const err = new ApiError(404, "not_found", "User not found");
    const res = handleError(err, defaultReq);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({
      ok: false,
      error: { code: "not_found", message: "User not found" },
    });
  });

  it("returns 500 with internal_error for non-ApiError errors", async () => {
    const err = new Error("Something broke");
    const res = handleError(err, defaultReq);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("internal_error");
    expect(body.error.message).toBe("Something broke");
  });

  it("returns 500 with internal_error for non-Error values", async () => {
    const res = handleError("string error", defaultReq);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.code).toBe("internal_error");
    expect(body.error.message).toBe("string error");
  });

  it("hides the real message in production", async () => {
    process.env.NODE_ENV = "production";
    const err = new Error("secret details");
    const res = handleError(err, defaultReq);

    const body = await res.json();
    expect(body.error.message).toBe("An unexpected error has occurred.");
  });

  it("includes CORS headers in the response", () => {
    const err = new ApiError(403, "forbidden", "Access denied");
    const res = handleError(err, defaultReq);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3001",
    );
  });

  it("uses the request Origin header for CORS", () => {
    const req = new Request("http://localhost/test", {
      headers: { Origin: "http://custom-origin.com" },
    });
    const err = new ApiError(401, "unauthorized", "Not allowed");
    const res = handleError(err, req);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://custom-origin.com",
    );
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
