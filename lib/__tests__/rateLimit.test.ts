import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkRateLimit } from "../rateLimit"

describe("lib/rateLimit", () => {
  beforeEach(() => {
    // Cada test usa un identificador único para evitar interferencias
  })

  it("allows requests within the limit", () => {
    const id = `test-allow-${Date.now()}`
    const config = { maxRequests: 5, windowMs: 60_000 }

    const result1 = checkRateLimit(id, config)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(4)

    const result2 = checkRateLimit(id, config)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(3)
  })

  it("blocks requests over the limit", () => {
    const id = `test-block-${Date.now()}`
    const config = { maxRequests: 3, windowMs: 60_000 }

    // Usar los 3 permitidos
    checkRateLimit(id, config)
    checkRateLimit(id, config)
    checkRateLimit(id, config)

    // El 4o debería ser bloqueado
    const result = checkRateLimit(id, config)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("resets after window expires", () => {
    const id = `test-reset-${Date.now()}`
    const config = { maxRequests: 2, windowMs: 100 } // Ventana muy corta

    // Usar el límite
    checkRateLimit(id, config)
    checkRateLimit(id, config)

    // El 3o sería bloqueado
    const blocked = checkRateLimit(id, config)
    expect(blocked.allowed).toBe(false)

    // Avanzar el tiempo más allá de la ventana
    vi.useFakeTimers()
    vi.advanceTimersByTime(200)

    const afterReset = checkRateLimit(id, config)
    expect(afterReset.allowed).toBe(true)
    expect(afterReset.remaining).toBe(1) // maxRequests - 1

    vi.useRealTimers()
  })

  it("tracks different identifiers independently", () => {
    const id1 = `test-independent-a-${Date.now()}`
    const id2 = `test-independent-b-${Date.now()}`
    const config = { maxRequests: 2, windowMs: 60_000 }

    // Usar todo el límite de id1
    checkRateLimit(id1, config)
    checkRateLimit(id1, config)
    const blocked1 = checkRateLimit(id1, config)
    expect(blocked1.allowed).toBe(false)

    // id2 debe seguir disponible
    const result2 = checkRateLimit(id2, config)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(1)
  })

  it("returns correct resetIn value", () => {
    const id = `test-resetin-${Date.now()}`
    const config = { maxRequests: 10, windowMs: 60_000 }

    const result = checkRateLimit(id, config)
    expect(result.resetIn).toBe(60_000)
  })
})
