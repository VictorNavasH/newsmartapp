import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("lib/env", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("throws descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    await expect(() => import("../env")).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*no configurada/
    )
  })

  it("throws descriptive error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    await expect(() => import("../env")).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY.*no configurada/
    )
  })

  it("exports values when env vars are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key-123"
    process.env.IA_ASSISTANT_SMART_APP = "ai-key-456"

    const env = await import("../env")

    expect(env.SUPABASE_URL).toBe("https://test.supabase.co")
    expect(env.SUPABASE_ANON_KEY).toBe("test-key-123")
    expect(env.AI_API_KEY).toBe("ai-key-456")
  })

  it("returns null for AI_API_KEY when not set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key-123"
    delete process.env.IA_ASSISTANT_SMART_APP

    const env = await import("../env")

    expect(env.AI_API_KEY).toBeNull()
  })
})
