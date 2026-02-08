import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock env before importing
vi.mock("../env", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  AI_API_KEY: null,
}))

// Mock @supabase/supabase-js
const mockGetUser = vi.fn()
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

// Minimal mock for NextRequest
function createMockRequest(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as any
}

describe("lib/apiAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns unauthenticated when no Authorization header", async () => {
    const { verifyAuth } = await import("../apiAuth")
    const req = createMockRequest({})

    const result = await verifyAuth(req)

    expect(result.authenticated).toBe(false)
    expect(result.error).toContain("Token")
  })

  it("returns unauthenticated when no Bearer prefix", async () => {
    const { verifyAuth } = await import("../apiAuth")
    const req = createMockRequest({ authorization: "Basic some-token" })

    const result = await verifyAuth(req)

    expect(result.authenticated).toBe(false)
    expect(result.error).toContain("Token")
  })

  it("returns unauthenticated for invalid token (getUser fails)", async () => {
    const { verifyAuth } = await import("../apiAuth")
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Invalid") })
    const req = createMockRequest({ authorization: "Bearer invalid-token" })

    const result = await verifyAuth(req)

    expect(result.authenticated).toBe(false)
    expect(result.error).toContain("inválida")
  })

  it("verifies domain restriction — rejects non-allowed domain", async () => {
    const { verifyAuth } = await import("../apiAuth")
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@gmail.com",
        },
      },
      error: null,
    })
    const req = createMockRequest({ authorization: "Bearer valid-token" })

    const result = await verifyAuth(req)

    expect(result.authenticated).toBe(false)
    expect(result.error).toContain("Dominio")
  })

  it("authenticates valid user with allowed domain", async () => {
    const { verifyAuth } = await import("../apiAuth")
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-456",
          email: "admin@nuasmartrestaurant.com",
        },
      },
      error: null,
    })
    const req = createMockRequest({ authorization: "Bearer valid-token" })

    const result = await verifyAuth(req)

    expect(result.authenticated).toBe(true)
    expect(result.userId).toBe("user-456")
    expect(result.email).toBe("admin@nuasmartrestaurant.com")
  })
})
