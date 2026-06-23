import { describe, it, expect } from "bun:test";
import { Router } from "./router";

describe("Router", () => {
  it("dispatches a registered GET route", async () => {
    const router = new Router();
    router.get("/test", async () => new Response("ok"));
    const req = new Request("http://localhost/test");
    const res = await router.dispatch(req);
    expect(res).not.toBeNull();
    expect(await res!.text()).toBe("ok");
  });

  it("dispatches a registered POST route", async () => {
    const router = new Router();
    router.post("/data", async () => new Response("created", { status: 201 }));
    const req = new Request("http://localhost/data", { method: "POST" });
    const res = await router.dispatch(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(201);
    expect(await res!.text()).toBe("created");
  });

  it("dispatches a registered PUT route", async () => {
    const router = new Router();
    router.put("/resource", async () => new Response("updated"));
    const req = new Request("http://localhost/resource", { method: "PUT" });
    const res = await router.dispatch(req);
    expect(res).not.toBeNull();
    expect(await res!.text()).toBe("updated");
  });

  it("dispatches a registered DELETE route", async () => {
    const router = new Router();
    router.delete("/resource", async () => new Response("", { status: 204 }));
    const req = new Request("http://localhost/resource", { method: "DELETE" });
    const res = await router.dispatch(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(204);
  });

  it("returns null when no route matches the path", async () => {
    const router = new Router();
    router.get("/test", async () => new Response("ok"));
    const req = new Request("http://localhost/unknown");
    const res = await router.dispatch(req);
    expect(res).toBeNull();
  });

  it("returns null when the HTTP method does not match", async () => {
    const router = new Router();
    router.get("/test", async () => new Response("ok"));
    const req = new Request("http://localhost/test", { method: "POST" });
    const res = await router.dispatch(req);
    expect(res).toBeNull();
  });

  it("extracts URL path parameters correctly", async () => {
    const router = new Router();
    router.get("/users/:id", async (_req, params) => {
      return Response.json({ id: params["id"] });
    });
    const req = new Request("http://localhost/users/42");
    const res = await router.dispatch(req);
    expect(res).not.toBeNull();
    const body = await res!.json();
    expect(body).toEqual({ id: "42" });
  });

  it("selects the correct route when multiple routes exist", async () => {
    const router = new Router();
    router.get("/a", async () => new Response("route-a"));
    router.get("/b", async () => new Response("route-b"));
    router.get("/c", async () => new Response("route-c"));

    const resA = await router.dispatch(new Request("http://localhost/a"));
    expect(await resA!.text()).toBe("route-a");

    const resC = await router.dispatch(new Request("http://localhost/c"));
    expect(await resC!.text()).toBe("route-c");
  });

  it("passes request, params, and url to the handler", async () => {
    const router = new Router();
    router.get("/items/:id", async (req, params, url) => {
      return Response.json({
        method: req.method,
        itemId: params["id"],
        host: url.hostname,
      });
    });

    const req = new Request("http://localhost/items/99");
    const res = await router.dispatch(req);
    const body = await res!.json();
    expect(body).toEqual({
      method: "GET",
      itemId: "99",
      host: "localhost",
    });
  });
});
