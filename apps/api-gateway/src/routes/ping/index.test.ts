import { describe, it, expect } from "bun:test";
import { pingRoute } from "./index";

describe("pingRoute", () => {
  it("returns a 200 response", async () => {
    const res = await pingRoute.handle(new Request("http://localhost/ping"));
    expect(res.status).toBe(200);
  });

  it("returns the expected health-check body", async () => {
    const res = await pingRoute.handle(new Request("http://localhost/ping"));
    const body = await res.json();
    expect(body).toEqual({ ok: true, reponse: "pong" });
  });
});
