type Handler = (request:Request, params:Record<string,string>, url:URL) =>Promise<Response>;

interface Route {
  method: string
  pattern: URLPattern
  handler: Handler
}

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

    get(path: string, handler: Handler): void {
        this.add("GET", path, handler);
    }

    post(path: string, handler: Handler): void {
        this.add("POST", path, handler);
    }

    put(path: string, handler: Handler): void {
        this.add("PUT", path, handler);
    }

    delete(path: string, handler: Handler): void {
        this.add("DELETE", path, handler);
    }

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