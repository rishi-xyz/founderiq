import Elysia from "elysia";

export const dashboardRoute = new Elysia().get("/dashboard", () => {}, {
    beforeHandle(){},
})