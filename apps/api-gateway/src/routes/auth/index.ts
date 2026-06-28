/**
 * @fileoverview Auth routes at `/api/v1/auth`. Tokens delivered as httpOnly signed cookies.
 * @note Refresh token used for silent rotation — old session deleted, new one created.
 */
import { Elysia } from "elysia"
import { AuthModel } from "./model";
import { AuthService } from "./service";

/**
 * POST /register — Create a new user and set auth cookies.
 *
 * @param {string} body.email - Valid email
 * @param {string} body.password - Min 8 chars
 * @param {string} [body.name] - Display name
 * @returns {Object} 201 — `{ ok: true, data: { user: { id, email, name, role } } }`
 * @throws {ApiError} 409 — user_already_exists
 * @throws {ApiError} 500 — error_creating_user / error_creating_session
 *
 * @example POST /register { "email":"a@b.com","password":"pass1234" } → 201 { ok:true, data:{ user } }
 */
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

/**
 * POST /login — Authenticate user and set auth cookies.
 *
 * @param {string} body.email - Registered email
 * @param {string} body.password - Account password
 * @returns {Object} 201 — `{ ok: true, data: { user: { id, email, role, name }, access_token } }`
 * @throws {ApiError} 401 — user_not_found / wrong_credentials
 * @throws {ApiError} 500 — error_creating_session
 *
 * @example POST /login { "email":"a@b.com","password":"pass1234" } → 201 { ok:true, data:{ user, access_token } }
 */
const authLogin = new Elysia().post("/login", async ({
  body,
  cookie: {
    access_token,
    refresh_token
  },
  set
}) => {
  const { access_token: accessToken, refresh_token: refreshToken, user } = await AuthService.login({ email:body.email, password:body.password });

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

/**
 * POST /refresh — Rotate access+refresh tokens using signed refresh_token cookie.
 *
 * @returns {Object} 200 — `{ ok: true, data: { access_token } }`
 * @throws {ApiError} 401 — missing_refresh_token / invalid_refresh_token / session_expired / user_not_found
 * @throws {ApiError} 500 — error_refreshing_token
 *
 * @example POST /refresh (Cookie: refresh_token=...) → 200 { ok:true, data:{ access_token } }
 */
const authRefresh = new Elysia().post("/refresh", async ({
  cookie: { access_token, refresh_token },
  set
}) => {
  const { access_token: newAccessToken, refresh_token: newRefreshToken } =
    await AuthService.refresh(refresh_token.value!);

  access_token.value = newAccessToken
  refresh_token.value = newRefreshToken

  return {
    ok: true,
    data: { access_token: newAccessToken }
  };
}, {
  cookie: AuthModel.authCookie
})

/**
 * POST /logout — Delete session and clear auth cookies.
 *
 * @returns {void} 204 — No content
 * @throws {ApiError} 500 — failed_session_deletion
 *
 * @example POST /logout (Cookie: refresh_token=...) → 204
 */
const authLogout = new Elysia().post("/logout", async ({ cookie: {
  access_token,
  refresh_token
} }) => {
  await AuthService.logout(refresh_token.value!);
  access_token.remove();
  refresh_token.remove();
}, {
  cookie: AuthModel['authCookie']
})

export const AuthRoute = new Elysia().group("/auth", (app) => app.use(authRegister).use(authLogin).use(authRefresh).use(authLogout))