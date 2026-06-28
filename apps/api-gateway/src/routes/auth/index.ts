import { Elysia } from "elysia"
import { AuthModel } from "./model";
import { AuthService } from "./service";


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
  } = await AuthService.register(body);
  access_token.value = accessToken
  refresh_token.value = refreshToken
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
  const { access_token: accessToken, refresh_token: refreshToken, user } = await AuthService.login(body);

  access_token.value = accessToken
  refresh_token.value = refreshToken
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


const authRefresh = new Elysia().post("/refresh", async ({
  cookie: { access_token, refresh_token },
  set
}) => {
  const { access_token: newAccessToken, refresh_token: newRefreshToken } =
    await AuthService.refresh({
      access_token: access_token.value,
      refresh_token: refresh_token.value
    });

  access_token.value = newAccessToken
  refresh_token.value = newRefreshToken

  return {
    ok: true,
    data: { access_token: newAccessToken }
  };
}, {
  cookie: AuthModel.authCookie
})

export const AuthRoute = new Elysia().group("/auth", (app) => app.use(authRegister).use(authLogin).use(authRefresh))
