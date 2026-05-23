// Datos de demostración para el modo demo del Dashboard
// Siempre muestran buenos números para impresionar a interesados en traspasos

import type { RealTimeData, FinancialKPIs, LaborCostDay, WeekRevenueDay } from "@/types"
import type { KPITargets } from "@/types/kpiTargets"

export const DEMO_FINANCIAL_KPIS: FinancialKPIs[] = [
  {
    periodo: "mes",
    ingresos: 89450,
    gastos: 52200,
    margen: 37250,
    margen_pct: 41.6,
    ticket_medio: 34.80,
    comensales: 2570,
    num_facturas: 1840,
    ingresos_ant: 82300,
    gastos_ant: 50100,
    ticket_medio_ant: 32.50,
    fecha_inicio: "2026-04-01",
    fecha_fin: "2026-04-30",
  },
  {
    periodo: "Q2 2026",
    ingresos: 245800,
    gastos: 148500,
    margen: 97300,
    margen_pct: 39.6,
    ticket_medio: 33.20,
    comensales: 7400,
    num_facturas: 5280,
    ingresos_ant: 228000,
    gastos_ant: 142000,
    ticket_medio_ant: 31.80,
    fecha_inicio: "2026-04-01",
    fecha_fin: "2026-06-30",
  },
]

export const DEMO_LIVE_DATA: RealTimeData = {
  total: {
    reservations: 48,
    pax: 142,
    tables: 19,
    occupancy_rate: 87,
    avg_pax_per_res: 2.96,
    avg_pax_per_table: 7.47,
    tables_used: 18,
    table_rotation: 1.8,
    avg_pax_per_table_used: 7.89,
    revenue: 4920,
    tips: 185,
    tips_count: 22,
    transactions: 42,
    avg_ticket_transaction: 117.14,
    verifactu_metrics: { success: 42, error: 0, pending: 0 },
    expenses: { total: 0, paid: 0, pending: 0, overdue: 0, by_category: {} },
    avg_ticket_res: 102.50,
    avg_ticket_pax: 34.65,
    avg_ticket_table: 273.33,
    payment_methods: { card: 3640, cash: 920, digital: 360 },
    sales_data: {
      categories: [
        { name: "Entrantes", quantity: 68, revenue: 1120 },
        { name: "Principales", quantity: 95, revenue: 2280 },
        { name: "Postres", quantity: 42, revenue: 520 },
        { name: "Bebidas", quantity: 156, revenue: 1000 },
      ],
      top_products: [
        { id: "1", name: "Arroz NÜA", category: "Principales", quantity: 28, revenue: 560 },
        { id: "2", name: "Tataki de Atún", category: "Entrantes", quantity: 22, revenue: 396 },
        { id: "3", name: "Pulpo a la Brasa", category: "Principales", quantity: 18, revenue: 432 },
        { id: "4", name: "Tartar de Salmón", category: "Entrantes", quantity: 16, revenue: 288 },
        { id: "5", name: "Tiramisú NÜA", category: "Postres", quantity: 15, revenue: 165 },
      ],
      all_products: [],
      modifiers: { with_options: 45, without_options: 95, total_items: 140 },
    },
    tables_breakdown: [
      { id: "1", name: "Mesa 1", revenue: 340 },
      { id: "2", name: "Mesa 2", revenue: 310 },
      { id: "3", name: "Mesa 5", revenue: 295 },
      { id: "4", name: "Mesa 8", revenue: 280 },
      { id: "5", name: "Mesa 12", revenue: 265 },
    ],
  },
  lunch: {
    reservations: 22,
    pax: 64,
    tables: 16,
    occupancy_rate: 82,
    avg_pax_per_res: 2.91,
    avg_pax_per_table: 4.0,
    tables_used: 15,
    table_rotation: 1.5,
    avg_pax_per_table_used: 4.27,
    revenue: 2180,
    tips: 75,
    tips_count: 10,
    transactions: 18,
    avg_ticket_transaction: 121.11,
    verifactu_metrics: { success: 18, error: 0, pending: 0 },
    expenses: { total: 0, paid: 0, pending: 0, overdue: 0, by_category: {} },
    avg_ticket_res: 99.09,
    avg_ticket_pax: 34.06,
    avg_ticket_table: 145.33,
    payment_methods: { card: 1580, cash: 420, digital: 180 },
    sales_data: { categories: [], top_products: [], all_products: [], modifiers: { with_options: 0, without_options: 0, total_items: 0 } },
    tables_breakdown: [],
  },
  dinner: {
    reservations: 26,
    pax: 78,
    tables: 18,
    occupancy_rate: 92,
    avg_pax_per_res: 3.0,
    avg_pax_per_table: 4.33,
    tables_used: 17,
    table_rotation: 2.0,
    avg_pax_per_table_used: 4.59,
    revenue: 2740,
    tips: 110,
    tips_count: 12,
    transactions: 24,
    avg_ticket_transaction: 114.17,
    verifactu_metrics: { success: 24, error: 0, pending: 0 },
    expenses: { total: 0, paid: 0, pending: 0, overdue: 0, by_category: {} },
    avg_ticket_res: 105.38,
    avg_ticket_pax: 35.13,
    avg_ticket_table: 161.18,
    payment_methods: { card: 2060, cash: 500, digital: 180 },
    sales_data: { categories: [], top_products: [], all_products: [], modifiers: { with_options: 0, without_options: 0, total_items: 0 } },
    tables_breakdown: [],
  },
  lunch_percentage: 44,
  dinner_percentage: 56,
  prevision: {
    comensales_reservados: 142,
    comensales_reservados_comida: 64,
    comensales_reservados_cena: 78,
    mesas_reservadas: 36,
    ticket_comensal_30d: 34.65,
    ticket_mesa_30d: 273.33,
    prevision_facturacion: 4920,
    prevision_facturacion_comida: 2180,
    prevision_facturacion_cena: 2740,
    porcentaje_prevision_alcanzado: 100,
  },
}

// Generar datos de costes laborales demo (últimos 15 días)
export function getDemoLaborCostData(): LaborCostDay[] {
  const data: LaborCostDay[] = []
  const today = new Date()

  for (let i = 14; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dayOfWeek = date.getDay()

    // Lunes cerrado mediodía, martes cerrado mediodía
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Vie, Sab
    const baseRevenue = isWeekend ? 5200 : 3800
    const variation = (Math.sin(i * 0.7) * 0.15 + 1) // Variación suave
    const ventas = Math.round(baseRevenue * variation)
    const costePct = 28 + Math.sin(i * 0.5) * 4 // Entre 24-32%

    data.push({
      fecha: date.toISOString().split("T")[0],
      ventas_netas: ventas,
      coste_laboral: Math.round(ventas * costePct / 100),
      porcentaje_laboral: Math.round(costePct * 10) / 10,
      horas_trabajadas: isWeekend ? 85 : 62,
      trabajadores: isWeekend ? 12 : 9,
    })
  }

  return data
}

// Generar datos de facturación semanal demo
export function getDemoWeekRevenueData(): WeekRevenueDay[] {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  return days.map((dia, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + i)
    const isWeekend = i >= 4 // Vie, Sab, Dom
    const prevision = isWeekend ? 5400 : 3900
    const isPast = date < today
    const isToday = date.toDateString() === today.toDateString()

    const facturado = isPast || isToday
      ? Math.round(prevision * (0.95 + Math.random() * 0.15))
      : 0

    const diferencia = facturado > 0 ? facturado - prevision : null

    return {
      fecha: date.toISOString().split("T")[0],
      diaSemanaCorto: dia,
      diaMes: String(date.getDate()),
      facturadoReal: facturado,
      prevision,
      porcentajeAlcanzado: facturado > 0 ? Math.round((facturado / prevision) * 100 * 10) / 10 : 0,
      comensalesReservados: isWeekend ? 85 : 55,
      tipoDia: isPast ? "pasado" as const : isToday ? "hoy" as const : "futuro" as const,
      esHoy: isToday,
      margenErrorPct: facturado > 0 ? Math.round(((facturado - prevision) / prevision) * 100 * 10) / 10 : null,
      diferenciaEuros: diferencia,
    }
  })
}

export const DEMO_KPI_TARGETS: KPITargets = {
  dailyRevenueTarget: 4500,
  weeklyRevenueTarget: 28000,
  monthlyRevenueTarget: 85000,
  ticketMedioTarget: 45,
  ticketComensalTarget: 32,
  foodCostTarget: 30,
  laborCostTarget: 32,
  breakEvenTarget: 65000,
  lunchOccupancyTarget: 75,
  dinnerOccupancyTarget: 85,
  averageRatingTarget: 4.5,
  dailyReservationsTarget: 45,
}

export const DEMO_FOOD_COST_AVG = 27.4
export const DEMO_LABOR_COST_MONTHLY_AVG = 29.2

export const DEMO_CONCILIACION = {
  totalPendientes: 0,
  autoSinConfirmar: 0,
  requierenRevision: 0,
  albaranesPendientes: 0,
  albaranesAged: 0,
  pedidosRetrasados: 0,
}
