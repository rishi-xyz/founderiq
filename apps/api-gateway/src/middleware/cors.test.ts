import { describe, it, expect, beforeEach } from "bun:test";
import { corsHeaders, handleCors } from "./cors";

describe("corsHeaders", () => {
  const defaultOrigin = "http://localhost:3001";

  beforeEach(() => {
    delete process.env.PLATFORM_URL;
  });

  it("returns the matching origin when origin is in the allowed list", () => {
    process.env.PLATFORM_URL = "http://example.com";
    const result = corsHeaders("http://example.com");
    expect(result["Access-Control-Allow-Origin"]).toBe("http://example.com");
  });

  it("falls back to the first allowed origin when origin is not in the list", () => {
    process.env.PLATFORM_URL = "http://first.com,http://second.com";
    const result = corsHeaders("http://unknown.com");
    expect(result["Access-Control-Allow-Origin"]).toBe("http://first.com");
  });

  it("falls back to the first allowed origin when origin is null", () => {
    process.env.PLATFORM_URL = "http://fallback.com";
    const result = corsHeaders(null);
    expect(result["Access-Control-Allow-Origin"]).toBe("http://fallback.com");
  });

  it("uses the default origin when PLATFORM_URL is not set", () => {
    const result = corsHeaders(null);
    expect(result["Access-Control-Allow-Origin"]).toBe(defaultOrigin);
  });

  it("returns all required CORS headers", () => {
    const result = corsHeaders(null);
    expect(result).toHaveProperty("Access-Control-Allow-Origin");
    expect(result).toHaveProperty("Access-Control-Allow-Methods");
    expect(result).toHaveProperty("Access-Control-Allow-Headers");
    expect(result).toHaveProperty("Access-Control-Allow-Credentials");
    expect(result).toHaveProperty("Access-Control-Max-Age");
  });

  it("includes the correct values for CORS headers", () => {
    const result = corsHeaders(null);
    expect(result["Access-Control-Allow-Methods"]).toBe("GET, POST, PUT, PATCH, DELETE, OPTIONS");
    expect(result["Access-Control-Allow-Headers"]).toBe("Content-Type, Authorization");
    expect(result["Access-Control-Allow-Credentials"]).toBe("true");
    expect(result["Access-Control-Max-Age"]).toBe("86400");
  });

  it("handles comma-separated PLATFORM_URL origins correctly", () => {
    process.env.PLATFORM_URL = "http://a.com,http://b.com,http://c.com";
    expect(corsHeaders("http://b.com")["Access-Control-Allow-Origin"]).toBe("http://b.com");
    expect(corsHeaders("http://a.com")["Access-Control-Allow-Origin"]).toBe("http://a.com");
    expect(corsHeaders("http://c.com")["Access-Control-Allow-Origin"]).toBe("http://c.com");
    expect(corsHeaders("http://d.com")["Access-Control-Allow-Origin"]).toBe("http://a.com");
  });
});

describe("handleCors", () => {
  beforeEach(() => {
    process.env.PLATFORM_URL = "http://localhost:3001";
  });

  it("returns null for non-OPTIONS requests", () => {
    const req = new Request("http://localhost/test", { method: "GET" });
    expect(handleCors(req)).toBeNull();
  });

  it("returns a 204 response for OPTIONS requests", () => {
    const req = new Request("http://localhost/test", { method: "OPTIONS" });
    const res = handleCors(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(204);
  });

  it("includes CORS headers in the OPTIONS response", () => {
    const req = new Request("http://localhost/test", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:3001" },
    });
    const res = handleCors(req)!;
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3001");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, PATCH, DELETE, OPTIONS");
  });
});
