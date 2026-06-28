import { describe, it, expect, mock, beforeEach } from "bun:test"
import { ApiError } from "../../middleware"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: "usr_abc123",
  email: "alice@example.com",
  name: "Alice",
  role: "ANALYST" as const,
  organizationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSession = {
  id: "session_1",
  userId: "usr_abc123",
  refreshToken: "mock-refresh-token",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
}

const p2025 = { code: "P2025", message: "Record not found" }

// ---------------------------------------------------------------------------
// Mock functions (mutable — reset in beforeEach)
// ---------------------------------------------------------------------------

const mockFindUnique = mock<(q: any) => Promise<any>>()
const mockFindUniqueOrThrow = mock<(q: any) => Promise<any>>()
const mockSessionCreate = mock<(d: any) => Promise<any>>()
const mockSessionFindUniqueOrThrow = mock<(q: any) => Promise<any>>()
const mockSessionDelete = mock<(q: any) => Promise<any>>()

const mockTxUserCreate = mock<(d: any) => Promise<any>>()
const mockTxSessionCreate = mock<(d: any) => Promise<any>>()
const mockTxSessionDelete = mock<(q: any) => Promise<any>>()

const mock$transaction = mock<(arg: any) => Promise<any>>()

const mockSignAccessToken = mock<() => string>()
const mockSignRefreshToken = mock<() => string>()
const mockVerifyRefreshToken = mock<() => { userId: string }>()

const mockHash = mock<() => Promise<string>>()
const mockVerify = mock<() => Promise<boolean>>()

// ---------------------------------------------------------------------------
// Module mocks — run before AuthService import
// ---------------------------------------------------------------------------

mock.module("@founderiq/database", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      findUniqueOrThrow: mockFindUniqueOrThrow,
    },
    session: {
      create: mockSessionCreate,
      findUniqueOrThrow: mockSessionFindUniqueOrThrow,
      delete: mockSessionDelete,
    },
    $transaction: mock$transaction,
  },
}))

mock.module("../../lib/jwt", () => ({
  signAccessToken: mockSignAccessToken,
  signRefreshToken: mockSignRefreshToken,
  verifyRefreshToken: mockVerifyRefreshToken,
}))

mock.module("argon2", () => ({
  hash: mockHash,
  verify: mockVerify,
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { AuthService } from "./service"

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthService", () => {
  // Reset every mock to its default before each test
  beforeEach(() => {
    mockFindUnique.mockImplementation(() => Promise.resolve(null))
    mockFindUniqueOrThrow.mockImplementation(() => Promise.resolve(mockUser))
    mockSessionCreate.mockImplementation(() => Promise.resolve({ id: "session_1" }))
    mockSessionFindUniqueOrThrow.mockImplementation(() => Promise.resolve(mockSession))
    mockSessionDelete.mockImplementation(() => Promise.resolve(mockSession))

    mockTxUserCreate.mockImplementation(() => Promise.resolve(mockUser))
    mockTxSessionCreate.mockImplementation(() => Promise.resolve({ id: "session_1" }))
    mockTxSessionDelete.mockImplementation(() => Promise.resolve(mockSession))

    mock$transaction.mockImplementation((arg: any) => {
      if (typeof arg === "function") {
        const tx = {
          user: { create: mockTxUserCreate },
          session: { create: mockTxSessionCreate, delete: mockTxSessionDelete },
        }
        return arg(tx)
      }
      return Promise.resolve()
    })

    mockSignAccessToken.mockImplementation(() => "mock-access-token")
    mockSignRefreshToken.mockImplementation(() => "mock-refresh-token")
    mockVerifyRefreshToken.mockImplementation(() => ({ userId: "usr_abc123" }))

    mockHash.mockImplementation(() => Promise.resolve("$argon2id$v=19$m=65536,t=3,p=4$hash"))
    mockVerify.mockImplementation(() => Promise.resolve(true))
  })

  // ───── register ─────────────────────────────────────────────────────

  describe("register", () => {
    it("creates a user and returns access token, refresh token, and user", async () => {
      const result = await AuthService.register({
        email: "alice@example.com",
        password: "securePass123",
      })

      expect(result).toHaveProperty("access_token", "mock-access-token")
      expect(result).toHaveProperty("refresh_token", "mock-refresh-token")
      expect(result.user).toMatchObject({
        id: "usr_abc123",
        email: "alice@example.com",
        role: "ANALYST",
      })

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: "alice@example.com" } })
      expect(mockHash).toHaveBeenCalledWith("securePass123")
      expect(mockTxUserCreate).toHaveBeenCalled()
      expect(mockTxSessionCreate).toHaveBeenCalled()
      expect(mockSignAccessToken).toHaveBeenCalled()
      expect(mockSignRefreshToken).toHaveBeenCalled()
    })

    it("throws 409 user_already_exists when email is taken", async () => {
      mockFindUnique.mockImplementation(() => Promise.resolve(mockUser))

      const caught: unknown = await AuthService.register({
        email: "alice@example.com",
        password: "securePass123",
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(409)
      expect(err.code).toBe("user_already_exists")
    })

    it("throws 500 error_creating_user when user creation in transaction fails", async () => {
      mockTxUserCreate.mockImplementation(() => Promise.reject(new Error("DB error")))

      const caught: unknown = await AuthService.register({
        email: "alice@example.com",
        password: "securePass123",
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(500)
      expect(err.code).toBe("error_creating_user")
    })

    it("throws 500 error_creating_session when session creation in transaction fails", async () => {
      mockTxSessionCreate.mockImplementation(() => Promise.reject(new Error("DB error")))

      const caught: unknown = await AuthService.register({
        email: "alice@example.com",
        password: "securePass123",
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(500)
      expect(err.code).toBe("error_creating_session")
    })
  })

  // ───── login ────────────────────────────────────────────────────────

  describe("login", () => {
    it("returns tokens and user for valid credentials", async () => {
      const result = await AuthService.login({
        email: "alice@example.com",
        password: "securePass123",
      })

      expect(result).toHaveProperty("access_token", "mock-access-token")
      expect(result).toHaveProperty("refresh_token", "mock-refresh-token")
      expect(result.user).toMatchObject({ id: "usr_abc123", email: "alice@example.com" })
      expect(mockFindUniqueOrThrow).toHaveBeenCalledWith({ where: { email: "alice@example.com" } })
      expect(mockVerify).toHaveBeenCalled()
      expect(mockSessionCreate).toHaveBeenCalled()
    })

    it("throws 401 user_not_found when email does not exist", async () => {
      mockFindUniqueOrThrow.mockImplementation(() => Promise.reject(p2025))

      const caught: unknown = await AuthService.login({
        email: "unknown@example.com",
        password: "securePass123",
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe("user_not_found")
    })

    it("throws 401 wrong_credentials when password does not match", async () => {
      mockVerify.mockImplementation(() => Promise.resolve(false))

      const caught: unknown = await AuthService.login({
        email: "alice@example.com",
        password: "wrongPassword",
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe("wrong_credentials")
    })

    it("throws 500 error_creating_session when session persistence fails", async () => {
      mockSessionCreate.mockImplementation(() => Promise.reject(new Error("DB error")))

      const caught: unknown = await AuthService.login({
        email: "alice@example.com",
        password: "securePass123",
      }).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(500)
      expect(err.code).toBe("error_creating_session")
    })
  })

  // ───── refresh ─────────────────────────────────────────────────────

  describe("refresh", () => {
    it("returns new tokens for a valid refresh token", async () => {
      mockSessionFindUniqueOrThrow.mockImplementation(() => Promise.resolve(mockSession))
      mockFindUniqueOrThrow.mockImplementation(() => Promise.resolve(mockUser))

      const result = await AuthService.refresh("valid-refresh-token")

      expect(result).toHaveProperty("access_token", "mock-access-token")
      expect(result).toHaveProperty("refresh_token", "mock-refresh-token")
      expect(mockVerifyRefreshToken).toHaveBeenCalledWith("valid-refresh-token")
      expect(mock$transaction).toHaveBeenCalled()
    })

    it("throws 401 missing_refresh_token when no token provided", async () => {
      const caught: unknown = await AuthService.refresh(null as unknown as string).catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe("missing_refresh_token")
    })

    it("throws 401 invalid_refresh_token when JWT verification fails", async () => {
      mockVerifyRefreshToken.mockImplementation(() => { throw new Error("jwt malformed") })

      const caught: unknown = await AuthService.refresh("bad-token").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe("invalid_refresh_token")
    })

    it("throws 401 session_expired when session TTL has passed", async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000),
      }
      mockSessionFindUniqueOrThrow.mockImplementation(() => Promise.resolve(expiredSession))

      const caught: unknown = await AuthService.refresh("expired-session-token").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe("session_expired")
    })

    it("throws 401 user_not_found when session lookup fails with P2025", async () => {
      mockSessionFindUniqueOrThrow.mockImplementation(() => Promise.reject(p2025))

      const caught: unknown = await AuthService.refresh("orphaned-token").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe("user_not_found")
    })

    it("throws 401 user_not_found when user lookup fails with P2025", async () => {
      // Session lookup succeeds, but user lookup fails
      mockFindUniqueOrThrow.mockImplementation(() => Promise.reject(p2025))

      const caught: unknown = await AuthService.refresh("valid-token").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(401)
      expect(err.code).toBe("user_not_found")
    })

    it("throws 500 error_refreshing_token when transaction fails", async () => {
      mock$transaction.mockImplementation(() => Promise.reject(new Error("tx failed")))

      const caught: unknown = await AuthService.refresh("valid-token").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(500)
      expect(err.code).toBe("error_refreshing_token")
    })
  })

  // ───── logout ──────────────────────────────────────────────────────

  describe("logout", () => {
    it("deletes the session and resolves", async () => {
      await AuthService.logout("valid-refresh-token")

      expect(mockSessionDelete).toHaveBeenCalledWith({
        where: { refreshToken: "valid-refresh-token" },
      })
    })

    it("throws 500 failed_session_deletion when delete fails", async () => {
      mockSessionDelete.mockImplementation(() => Promise.reject(new Error("DB error")))

      const caught: unknown = await AuthService.logout("some-token").catch((e) => e)

      expect(caught).toBeInstanceOf(ApiError)
      const err = caught as ApiError
      expect(err.status).toBe(500)
      expect(err.code).toBe("failed_session_deletion")
    })
  })
})
