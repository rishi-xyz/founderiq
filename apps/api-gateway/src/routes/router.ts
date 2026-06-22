/**
 * Async handler function for a registered route.
 * @param request - The incoming HTTP request
 * @param params - URL path parameters extracted by {@link URLPattern}
 * @param url - The parsed request URL object
 * @returns A Promise resolving to a {@link Response}
 * @example
 * const handler: Handler = async (req, params, url) => {
 *   return Response.json({ id: params["id"] });
 * };
 */
type Handler = (request:Request, params:Record<string,string>, url:URL) =>Promise<Response>;

/**
 * Internal structure representing a registered route.
 */
interface Route {
  method: string
  pattern: URLPattern
  handler: Handler
}

/**
 * A lightweight HTTP router built on the native {@link URLPattern} API.
 * Supports GET, POST, PUT, and DELETE method registration and dispatch.
 *
 * @example
 * const router = new Router();
 * router.get("/users/:id", async (req, params) => {
 *   return Response.json({ userId: params["id"] });
 * });
 * const response = await router.dispatch(request);
 */
export class Router {
    private routes_: Route[] = [];

    private add(method:string, path: string, handler:Handler ): void {
        this.routes_.push({
            method,
            pattern: new URLPattern({
                pathname: path
            }),
            handler,
        });
    }

    /**
     * Register a GET route.
     * @param path - URL pattern (e.g. `"/users/:id"`)
     * @param handler - Route handler invoked when the pattern matches
     * @example
     * router.get("/ping", async () => new Response("pong"));
     */
    get(path: string, handler: Handler): void {
        this.add("GET", path, handler);
    }

    /**
     * Register a POST route.
     * @param path - URL pattern (e.g. `"/users"`)
     * @param handler - Route handler invoked when the pattern matches
     * @example
     * router.post("/users", async (req) => {
     *   const body = await req.json();
     *   return Response.json({ created: body });
     * });
     */
    post(path: string, handler: Handler): void {
        this.add("POST", path, handler);
    }

    /**
     * Register a PUT route.
     * @param path - URL pattern (e.g. `"/users/:id"`)
     * @param handler - Route handler invoked when the pattern matches
     * @example
     * router.put("/users/:id", async (req, params) => {
     *   return Response.json({ updated: params["id"] });
     * });
     */
    put(path: string, handler: Handler): void {
        this.add("PUT", path, handler);
    }

    /**
     * Register a DELETE route.
     * @param path - URL pattern (e.g. `"/users/:id"`)
     * @param handler - Route handler invoked when the pattern matches
     * @example
     * router.delete("/users/:id", async (req, params) => {
     *   return Response.json({ deleted: params["id"] });
     * });
     */
    delete(path: string, handler: Handler): void {
        this.add("DELETE", path, handler);
    }

    /**
     * Match an incoming request against all registered routes and execute
     * the handler of the first matching route.
     *
     * Routes are evaluated in registration order. Only the first match
     * for the given HTTP method is invoked.
     *
     * @param request - The incoming HTTP request
     * @returns The route's {@link Response} if a match is found, or `null` if no route matched
     * @example
     * const response = await router.dispatch(request);
     * if (!response) {
     *   return new Response("Not Found", { status: 404 });
     * }
     * return response;
     */
    async dispatch(request: Request): Promise<Response| null> {
        const url_ = new URL(request.url);
        for (const route of this.routes_){
            if (route.method !== request.method) continue;
            const match_ = route.pattern.exec({pathname:url_.pathname});
            if(match_) {
                const params = match_.pathname.groups as Record<string,string>;
                return route.handler(request, params, url_);
            };
        }
        return null;
    }
};