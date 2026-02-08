import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock supabase before importing dataService
vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

// Mock env to avoid missing env var errors
vi.mock("../env", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-key",
  AI_API_KEY: null,
}))

describe("lib/dataService utilities", () => {
  describe("getBusinessDate", () => {
    it("returns a Date object", async () => {
      const { getBusinessDate } = await import("../dataService")
      const result = getBusinessDate()

      expect(result).toBeInstanceOf(Date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })

    it("returns a date with time set to midnight", async () => {
      const { getBusinessDate } = await import("../dataService")
      const result = getBusinessDate()

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })
  })

  describe("aggregateMetrics", () => {
    it("returns empty metrics for empty array", async () => {
      const { aggregateMetrics } = await import("../dataService")
      const result = aggregateMetrics([])

      expect(result.date).toBe("")
      expect(result.total.revenue).toBe(0)
      expect(result.total.pax).toBe(0)
      expect(result.total.transactions).toBe(0)
      expect(result.lunch.revenue).toBe(0)
      expect(result.dinner.revenue).toBe(0)
    })

    it("aggregates revenue and pax correctly", async () => {
      const { aggregateMetrics } = await import("../dataService")

      const createShift = (revenue: number, pax: number) => ({
        reservations: 10,
        pax,
        tables: 19,
        tables_used: 15,
        occupancy_rate: 0,
        avg_pax_per_res: 0,
        avg_pax_per_table: 0,
        avg_pax_per_table_used: 0,
        table_rotation: 0,
        revenue,
        tips: 0,
        tips_count: 0,
        transactions: 5,
        avg_ticket_transaction: revenue / 5,
        avg_ticket_res: 0,
        avg_ticket_pax: 0,
        avg_ticket_table: 0,
        payment_methods: { card: revenue * 0.7, cash: revenue * 0.2, digital: revenue * 0.1 },
        sales_data: {
          categories: [],
          top_products: [],
          all_products: [],
          modifiers: { with_options: 0, without_options: 0, total_items: 0 },
        },
        expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} },
        tables_breakdown: [],
        verifactu_metrics: { success: 5, error: 0, pending: 0 },
      })

      const data = [
        {
          date: "2025-01-01",
          total: createShift(1000, 50),
          lunch: createShift(400, 20),
          dinner: createShift(600, 30),
        },
        {
          date: "2025-01-02",
          total: createShift(1200, 60),
          lunch: createShift(500, 25),
          dinner: createShift(700, 35),
        },
      ]

      const result = aggregateMetrics(data)

      expect(result.total.revenue).toBe(2200)
      expect(result.total.pax).toBe(110)
      expect(result.lunch.revenue).toBe(900)
      expect(result.dinner.revenue).toBe(1300)
      expect(result.date).toBe("2025-01-01 - 2025-01-02")
    })
  })

  describe("aggregateTableMetrics", () => {
    it("returns empty array for empty input", async () => {
      const { aggregateTableMetrics } = await import("../dataService")
      const result = aggregateTableMetrics([])

      expect(result).toEqual([])
    })

    it("aggregates table data and sorts by revenue", async () => {
      const { aggregateTableMetrics } = await import("../dataService")

      const data = [
        {
          table_id: "t1",
          numero_mesa: 1,
          nombre_mesa: "Mesa 1",
          fecha: "2025-01-01",
          turno: "Comida" as const,
          total_facturado: 500,
          total_propinas: 25,
          num_facturas: 5,
          ranking_dia: 1,
          ranking_turno: 1,
        },
        {
          table_id: "t1",
          numero_mesa: 1,
          nombre_mesa: "Mesa 1",
          fecha: "2025-01-01",
          turno: "Cena" as const,
          total_facturado: 700,
          total_propinas: 35,
          num_facturas: 7,
          ranking_dia: 1,
          ranking_turno: 1,
        },
        {
          table_id: "t2",
          numero_mesa: 2,
          nombre_mesa: "Mesa 2",
          fecha: "2025-01-01",
          turno: "Comida" as const,
          total_facturado: 300,
          total_propinas: 15,
          num_facturas: 3,
          ranking_dia: 2,
          ranking_turno: 2,
        },
      ]

      const result = aggregateTableMetrics(data)

      expect(result).toHaveLength(2)
      // t1 should be first (1200 total revenue > 300)
      expect(result[0].table_id).toBe("t1")
      expect(result[0].total_facturado).toBe(1200)
      expect(result[0].total_propinas).toBe(60)
      expect(result[0].num_facturas).toBe(12)
      expect(result[0].avg_factura).toBe(100) // 1200/12

      expect(result[1].table_id).toBe("t2")
      expect(result[1].total_facturado).toBe(300)
    })
  })
})
