import { pingRoute } from "./ping";
import { Router } from "./router";

export const routerv1 = new Router();

pingRoute(routerv1);