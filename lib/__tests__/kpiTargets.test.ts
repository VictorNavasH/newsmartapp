import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { calculateProgress, loadKPITargets, saveKPITargets } from "../kpiTargets"
import { DEFAULT_KPI_TARGETS } from "@/types/kpiTargets"

// Mock env to avoid missing env var errors
vi.mock("../env", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-key",
  AI_API_KEY: null,
}))

describe("lib/kpiTargets", () => {
  describe("calculateProgress", () => {
    it("calculates normal progress (revenue at 80% of target)", () => {
      const result = calculateProgress(3200, 4000)

      expect(result.current).toBe(3200)
      expect(result.target).toBe(4000)
      expect(result.percentage).toBe(80)
      expect(result.status).toBe("at-risk")
      expect(result.delta).toBe(-800)
      expect(result.deltaPercentage).toBe(-20)
    })

    it("calculates isLowerBetter correctly (food cost at 28% vs 30% target = on-track)", () => {
      const result = calculateProgress(28, 30, true)

      // Formula: ((2 * 30 - 28) / 30) * 100 = (60 - 28) / 30 * 100 = 106.7%
      expect(result.percentage).toBeGreaterThan(90)
      expect(result.status).toBe("on-track")
      expect(result.delta).toBe(2) // Positivo = bien (estamos por debajo del target)
    })

    it("calculates behind status when far from target", () => {
      const result = calculateProgress(2000, 4000)

      expect(result.percentage).toBe(50)
      expect(result.status).toBe("behind")
      expect(result.delta).toBe(-2000)
    })

    it("handles zero target", () => {
      const result = calculateProgress(100, 0)

      expect(result.percentage).toBe(0)
      expect(result.status).toBe("behind")
      expect(result.delta).toBe(100)
      expect(result.deltaPercentage).toBe(0)
    })

    it("returns on-track when at or above 90%", () => {
      const result = calculateProgress(3700, 4000)

      expect(result.percentage).toBe(92.5)
      expect(result.status).toBe("on-track")
    })

    it("returns at-risk when between 70% and 90%", () => {
      const result = calculateProgress(3000, 4000)

      expect(result.percentage).toBe(75)
      expect(result.status).toBe("at-risk")
    })

    it("calculates isLowerBetter behind status when cost exceeds target significantly", () => {
      const result = calculateProgress(45, 30, true)

      // Formula: ((60 - 45) / 30) * 100 = 50%
      expect(result.percentage).toBe(50)
      expect(result.status).toBe("behind")
      expect(result.delta).toBe(-15) // Negativo = mal (estamos por encima)
    })
  })

  describe("loadKPITargets", () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it("returns defaults when localStorage is empty", () => {
      const result = loadKPITargets()

      expect(result).toEqual(DEFAULT_KPI_TARGETS)
    })

    it("returns defaults when localStorage has invalid JSON", () => {
      localStorage.setItem("nua-kpi-targets", "not-json")

      const result = loadKPITargets()

      expect(result).toEqual(DEFAULT_KPI_TARGETS)
    })

    it("merges stored values with defaults for missing keys", () => {
      localStorage.setItem("nua-kpi-targets", JSON.stringify({ dailyRevenueTarget: 5000 }))

      const result = loadKPITargets()

      expect(result.dailyRevenueTarget).toBe(5000)
      expect(result.monthlyRevenueTarget).toBe(DEFAULT_KPI_TARGETS.monthlyRevenueTarget)
      expect(result.foodCostTarget).toBe(DEFAULT_KPI_TARGETS.foodCostTarget)
    })
  })

  describe("saveKPITargets + loadKPITargets round trip", () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it("saves and loads targets correctly", () => {
      const customTargets = {
        ...DEFAULT_KPI_TARGETS,
        dailyRevenueTarget: 6000,
        foodCostTarget: 25,
        averageRatingTarget: 4.8,
      }

      saveKPITargets(customTargets)
      const loaded = loadKPITargets()

      expect(loaded).toEqual(customTargets)
    })
  })
})
