import { Elysia } from "elysia"
import { AuthModel } from "./model";
import { Auth } from "./service";


const authRegister = new Elysia().post("/register", async ({
  body,
  cookie: {
    access_token,
    refresh_token
  },
  set
}) => {
  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    user
  } = await Auth.register(body);
  access_token.set({
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  refresh_token.set({
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  set.status = 201;
  return {
    ok: true,
    data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  }
}, {
  body: AuthModel.authbody,
  cookie: AuthModel.authCookie
});

const authLogin = new Elysia().post("/login", async ({
  body,
  cookie: {
    access_token,
    refresh_token
  },
  set
}) => {
  const { access_token: accessToken, refresh_token: refreshToken, user } = await Auth.login(body);

  access_token.set({
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  refresh_token.set({
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  set.status = 201;
  return {
    ok: true,
    data: {
      user: { id: user.id, email: user.email, role: user.role, name: user.name, },
      access_token: accessToken,
    }
  }
}, {
  body: AuthModel.authbody,
  cookie: AuthModel.authCookie
})


export const AuthRoute = new Elysia().group("/auth", (app) => app.use(authRegister).use(authLogin))
