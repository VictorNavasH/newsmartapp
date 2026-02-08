import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useAlerts } from "../useAlerts"
import type { AlertContext } from "@/lib/alertEngine"

// Mock alertEngine
vi.mock("@/lib/alertEngine", () => ({
  evaluateAlerts: vi.fn(),
  resetAlertCooldowns: vi.fn(),
}))

import { evaluateAlerts } from "@/lib/alertEngine"

describe("hooks/useAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("evaluates alerts when context changes and enabled", () => {
    const context: AlertContext = {
      occupancyRate: 30,
      foodCostPercentage: 35,
    }

    renderHook(() => useAlerts(context, true))

    expect(evaluateAlerts).toHaveBeenCalledWith(context)
  })

  it("does not evaluate alerts when disabled", () => {
    const context: AlertContext = {
      occupancyRate: 30,
    }

    renderHook(() => useAlerts(context, false))

    expect(evaluateAlerts).not.toHaveBeenCalled()
  })

  it("does not evaluate alerts when context is null", () => {
    renderHook(() => useAlerts(null, true))

    expect(evaluateAlerts).not.toHaveBeenCalled()
  })

  it("throttles evaluation to max once per 30 seconds", () => {
    vi.useFakeTimers()

    const context1: AlertContext = { occupancyRate: 30 }
    const context2: AlertContext = { occupancyRate: 25 }

    const { rerender } = renderHook(
      ({ ctx, en }) => useAlerts(ctx, en),
      { initialProps: { ctx: context1 as AlertContext | null, en: true } }
    )

    expect(evaluateAlerts).toHaveBeenCalledTimes(1)

    // Re-render inmediato con nuevo contexto
    rerender({ ctx: context2, en: true })

    // No debería llamar otra vez (throttle de 30s)
    expect(evaluateAlerts).toHaveBeenCalledTimes(1)

    // Avanzar 31 segundos
    vi.advanceTimersByTime(31_000)

    // Re-render después de 31s
    const context3: AlertContext = { occupancyRate: 20 }
    rerender({ ctx: context3, en: true })

    // Ahora sí debería haber evaluado de nuevo
    expect(evaluateAlerts).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })
})
