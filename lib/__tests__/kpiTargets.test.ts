import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoisted mocks (deben declararse antes de vi.mock)
const { mockSingle, mockEq, mockSelect, mockUpsert, mockGetUser, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn(() => ({ single: mockSingle }))
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockUpsert = vi.fn().mockResolvedValue({ error: null })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } })
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    upsert: mockUpsert,
  }))
  return { mockSingle, mockEq, mockSelect, mockUpsert, mockGetUser, mockFrom }
})

// Mock env para evitar errores de variables de entorno
vi.mock("../env", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-key",
  AI_API_KEY: null,
}))

// Mock de Supabase
vi.mock("../supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
  },
}))

import { calculateProgress, loadKPITargets, saveKPITargets, loadKPITargetsLocal } from "../kpiTargets"
import { DEFAULT_KPI_TARGETS } from "@/types/kpiTargets"

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

  describe("loadKPITargetsLocal (localStorage fallback)", () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it("returns defaults when localStorage is empty", () => {
      const result = loadKPITargetsLocal()

      expect(result).toEqual(DEFAULT_KPI_TARGETS)
    })

    it("returns defaults when localStorage has invalid JSON", () => {
      localStorage.setItem("nua-kpi-targets", "not-json")

      const result = loadKPITargetsLocal()

      expect(result).toEqual(DEFAULT_KPI_TARGETS)
    })

    it("merges stored values with defaults for missing keys", () => {
      localStorage.setItem("nua-kpi-targets", JSON.stringify({ dailyRevenueTarget: 5000 }))

      const result = loadKPITargetsLocal()

      expect(result.dailyRevenueTarget).toBe(5000)
      expect(result.monthlyRevenueTarget).toBe(DEFAULT_KPI_TARGETS.monthlyRevenueTarget)
      expect(result.foodCostTarget).toBe(DEFAULT_KPI_TARGETS.foodCostTarget)
    })
  })

  describe("loadKPITargets (async, Supabase + fallback)", () => {
    beforeEach(() => {
      localStorage.clear()
      vi.clearAllMocks()
    })

    it("loads from Supabase when data is available", async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "test-id",
          restaurant_id: "test-restaurant",
          daily_revenue_target: 5500,
          monthly_revenue_target: 120000,
          ticket_medio_target: 50,
          food_cost_target: 28,
          labor_cost_target: 30,
          lunch_occupancy_target: 80,
          dinner_occupancy_target: 90,
          average_rating_target: 4.7,
          daily_reservations_target: 45,
          updated_by: null,
          updated_at: "2026-02-08T00:00:00Z",
          created_at: "2026-02-08T00:00:00Z",
        },
        error: null,
      })

      const result = await loadKPITargets()

      expect(result.dailyRevenueTarget).toBe(5500)
      expect(result.monthlyRevenueTarget).toBe(120000)
      expect(result.foodCostTarget).toBe(28)
    })

    it("falls back to localStorage when Supabase returns error", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Table not found" },
      })

      localStorage.setItem("nua-kpi-targets", JSON.stringify({ dailyRevenueTarget: 7000 }))

      const result = await loadKPITargets()

      expect(result.dailyRevenueTarget).toBe(7000)
      expect(result.monthlyRevenueTarget).toBe(DEFAULT_KPI_TARGETS.monthlyRevenueTarget)
    })

    it("falls back to defaults when both Supabase and localStorage are empty", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } })

      const result = await loadKPITargets()

      expect(result).toEqual(DEFAULT_KPI_TARGETS)
    })
  })

  describe("saveKPITargets (async, Supabase + localStorage)", () => {
    beforeEach(() => {
      localStorage.clear()
      vi.clearAllMocks()
      mockUpsert.mockResolvedValue({ error: null })
    })

    it("saves to both localStorage and Supabase", async () => {
      const customTargets = {
        ...DEFAULT_KPI_TARGETS,
        dailyRevenueTarget: 6000,
        foodCostTarget: 25,
      }

      await saveKPITargets(customTargets)

      // Verifica localStorage
      const stored = JSON.parse(localStorage.getItem("nua-kpi-targets") || "{}")
      expect(stored.dailyRevenueTarget).toBe(6000)
      expect(stored.foodCostTarget).toBe(25)
    })
  })
})
