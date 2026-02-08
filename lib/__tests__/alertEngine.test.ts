import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  evaluateAlerts,
  resetAlertCooldowns,
  DEFAULT_ALERT_RULES,
  type AlertContext,
  type AlertRule,
} from "../alertEngine"

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

import { toast } from "sonner"

describe("lib/alertEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAlertCooldowns()
  })

  it("fires warning when occupancy is low", () => {
    const context: AlertContext = {
      occupancyRate: 30,
    }

    evaluateAlerts(context)

    expect(toast.warning).toHaveBeenCalled()
    const callArgs = (toast.warning as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[0]).toContain("30%")
  })

  it("fires critical alert when food cost exceeds target", () => {
    const context: AlertContext = {
      foodCostPercentage: 38,
      foodCostTarget: 32,
    }

    evaluateAlerts(context)

    expect(toast.error).toHaveBeenCalled()
    const callArgs = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[0]).toContain("38.0%")
  })

  it("cooldown prevents repeated alerts", () => {
    const context: AlertContext = {
      occupancyRate: 30,
    }

    // Primer disparo
    evaluateAlerts(context)
    expect(toast.warning).toHaveBeenCalledTimes(1)

    // Segundo disparo inmediato — debería ser bloqueado por cooldown
    evaluateAlerts(context)
    expect(toast.warning).toHaveBeenCalledTimes(1)
  })

  it("resetAlertCooldowns clears cooldowns", () => {
    const context: AlertContext = {
      occupancyRate: 30,
    }

    evaluateAlerts(context)
    expect(toast.warning).toHaveBeenCalledTimes(1)

    // Reset cooldowns
    resetAlertCooldowns()

    // Ahora debería disparar otra vez
    evaluateAlerts(context)
    expect(toast.warning).toHaveBeenCalledTimes(2)
  })

  it("does not fire alerts when all metrics are good", () => {
    const context: AlertContext = {
      occupancyRate: 85,
      foodCostPercentage: 25,
      foodCostTarget: 32,
      laborCostPercentage: 30,
      laborCostTarget: 35,
      overdueInvoices: 0,
      ticketMedio: 50,
      ticketMedioTarget: 45,
      cancellationsToday: 1,
      dailyRevenue: 4500,
      dailyRevenueTarget: 4000,
    }

    evaluateAlerts(context)

    expect(toast.error).not.toHaveBeenCalled()
    expect(toast.warning).not.toHaveBeenCalled()
    expect(toast.info).not.toHaveBeenCalled()
  })

  it("fires multiple alerts for multiple conditions met", () => {
    const context: AlertContext = {
      occupancyRate: 20,
      foodCostPercentage: 40,
      foodCostTarget: 32,
      overdueInvoices: 3,
    }

    evaluateAlerts(context)

    // low-occupancy (warning) + high-food-cost (critical) + overdue-invoices (critical)
    expect(toast.warning).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledTimes(2)
  })
})
