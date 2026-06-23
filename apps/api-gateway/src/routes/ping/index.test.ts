import { describe, it, expect } from "bun:test";
import { Router } from "../router/router";
import { pingRoute } from "./index";

describe("pingRoute", () => {
  it("registers a GET /ping route", async () => {
    const router = new Router();
    pingRoute(router);

    const req = new Request("http://localhost/ping");
    const res = await router.dispatch(req);
    expect(res).not.toBeNull();
  });

  it("returns a 200 response", async () => {
    const router = new Router();
    pingRoute(router);

    const req = new Request("http://localhost/ping");
    const res = await router.dispatch(req);
    expect(res!.status).toBe(200);
  });

  it("returns the expected health-check body", async () => {
    const router = new Router();
    pingRoute(router);

    const req = new Request("http://localhost/ping");
    const res = await router.dispatch(req);
    const body = await res!.json();
    expect(body).toEqual({ ok: true, reponse: "pong" });
  });
});
