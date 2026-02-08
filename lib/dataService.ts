import type {
  DailyCompleteMetrics,
  ShiftMetrics,
  SalesBreakdown,
  SalesItem,
  CategorySales,
  ExpenseStats,
  TableSales,
  WeekReservationDay,
  TableBillingMetrics,
  TableAggregatedMetrics,
  ExpenseTag,
  Expense,
  ExpenseTagSummary,
  ExpenseProviderSummary,
  OperacionesData,
  ProductMixItem,
  CategoryMixItem,
  OptionMixItem,
  YearlyComparisonData,
  MonthlyReservationData,
  ForecastDay,
  ForecastKPIs,
  ForecastHistorico,
  ForecastPrecision,
  FinancialKPIs,
  OcupacionDia,
  LaborCostDay,
  WeekRevenueDay,
  BenchmarkItem,
  BenchmarkResumen,
  ComparisonResult,
  FoodCostProduct,
  FoodCostSummary,
  PeriodComparisonAggregate,
} from "../types"
import { supabase } from "./supabase" // Corregida importación para usar el cliente correcto
import { generateMockForecastData, generateMockForecastCalendar } from "./mockData"

// Re-export mock-dependent functions for backward compatibility
export { fetchHistoryRange, fetchFinancialHistory, fetchUpcomingInvoices } from "./mockData"

const CAPACITY_LUNCH = 66
const CAPACITY_DINNER = 66
const CAPACITY_PER_SHIFT = 66 // Added constant for clarity in occupancy calculation

// --- HELPER FOR LOCAL ISO STRING ---
// Helper to convert a Date object to an ISO string without shifting the timezone
const toLocalISOString = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0")
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${pad(month)}-${pad(day)}`
}


export const getBusinessDate = (): Date => {
  const now = new Date()

  const spainFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  })

  const parts = spainFormatter.formatToParts(now)
  const year = Number.parseInt(parts.find((p) => p.type === "year")?.value || "0")
  const month = Number.parseInt(parts.find((p) => p.type === "month")?.value || "1") - 1 // JS months are 0-indexed
  const day = Number.parseInt(parts.find((p) => p.type === "day")?.value || "1")
  const hour = Number.parseInt(parts.find((p) => p.type === "hour")?.value || "0")

  // Corte a las 02:00 (igual que fn_dia_operativo en Supabase)
  if (hour < 2) {
    // Devolver el día anterior en España
    const result = new Date(year, month, day - 1)
    result.setHours(0, 0, 0, 0)
    return result
  }

  const result = new Date(year, month, day)
  result.setHours(0, 0, 0, 0)
  return result
}

export const fetchWeekReservations = async (offsetWeeks = 0): Promise<WeekReservationDay[]> => {
  try {
    const now = new Date()
    const spainTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
    spainTime.setHours(0, 0, 0, 0)

    // getDay(): 0 = Sun, 1 = Mon, ... 6 = Sat
    const day = spainTime.getDay()
    // ISO 8601: Week starts on Monday.
    const diff = day === 0 ? 6 : day - 1

    const startOfCurrentWeek = new Date(spainTime)
    startOfCurrentWeek.setDate(spainTime.getDate() - diff)

    const startOfTargetWeek = new Date(startOfCurrentWeek)
    startOfTargetWeek.setDate(startOfCurrentWeek.getDate() + offsetWeeks * 7)

    const endOfTargetWeek = new Date(startOfTargetWeek)
    endOfTargetWeek.setDate(startOfTargetWeek.getDate() + 6)

    // --- FIX FOR UNDECLARED VARIABLE 'pad' ---
    const pad = (num: number) => String(num).padStart(2, "0")
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
    // --- END FIX ---

    const startDateStr = formatDateStr(startOfTargetWeek)
    const endDateStr = formatDateStr(endOfTargetWeek)

    const { data, error } = await supabase
      .from("reservas_agregadas_diarias")
      .select("*")
      .gte("fecha", startDateStr)
      .lte("fecha", endDateStr)
      .order("fecha", { ascending: true })

    if (error) {
      console.error("[v0] Supabase error fetching week reservations (Full Log):", {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
      throw error
    }

    const dbMap = new Map(data.map((row: any) => [row.fecha.substring(0, 10), row]))
    const days: WeekReservationDay[] = []

    const businessDate = getBusinessDate()
    const businessDateStr = formatDateStr(businessDate)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfTargetWeek)
      date.setDate(startOfTargetWeek.getDate() + i)

      const dateStr = formatDateStr(date)
      const row = dbMap.get(dateStr)

      const pax = row?.total_comensales ?? 0
      const paxLunch = row?.comensales_comida ?? 0
      const paxDinner = row?.comensales_cena ?? 0

      const occupancyLunch = CAPACITY_PER_SHIFT > 0 ? Math.round((paxLunch / CAPACITY_PER_SHIFT) * 100) : 0
      const occupancyDinner = CAPACITY_PER_SHIFT > 0 ? Math.round((paxDinner / CAPACITY_PER_SHIFT) * 100) : 0
      const totalCapacity = CAPACITY_PER_SHIFT * 2 // 132
      const occupancyTotal = totalCapacity > 0 ? Math.round((pax / totalCapacity) * 100) : 0

      // Determine status based on occupancy
      let status: "low" | "medium" | "high" | "full" = "low"
      if (occupancyTotal >= 95) status = "full"
      else if (occupancyTotal >= 70) status = "high"
      else if (occupancyTotal >= 40) status = "medium"

      const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      const dayOfWeek = dayNames[date.getDay()]

      days.push({
        date: dateStr,
        pax,
        reservations: pax,
        reservationsLunch: paxLunch,
        reservationsDinner: paxDinner,
        status,
        isToday: dateStr === businessDateStr,
        occupancyTotal,
        occupancyLunch,
        occupancyDinner,
        dayOfWeek,
      })
    }

    return days
  } catch (err: any) {
    console.error("[v0] Error fetching week reservations (Full Log):", {
      err,
      message: err.message,
      stack: err.stack,
      stringified: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    })
    return []
  }
}

// --- LIVE DATA GENERATION ---
export const fetchRealTimeData = async (): Promise<{
  lunch: ShiftMetrics
  dinner: ShiftMetrics
  total: ShiftMetrics
  lunch_percentage: number
  dinner_percentage: number
  prevision: {
    comensales_reservados: number
    comensales_reservados_comida: number
    comensales_reservados_cena: number
    mesas_reservadas: number
    prevision_facturacion: number
    prevision_facturacion_comida: number
    prevision_facturacion_cena: number
    porcentaje_prevision_alcanzado: number
    ticket_comensal_30d: number
    ticket_mesa_30d: number
  }
}> => {
  // Helper to create a zeroed-out shift structure
  const createEmptyShift = (): ShiftMetrics => ({
    reservations: 0,
    pax: 0,
    tables: 0,
    occupancy_rate: 0,
    avg_pax_per_res: 0,
    avg_pax_per_table: 0,
    expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} },
    sales_data: {
      categories: [],
      top_products: [],
      all_products: [],
      modifiers: { with_options: 0, without_options: 0, total_items: 0 },
    },
    tables_breakdown: [],
    verifactu_metrics: { success: 0, error: 0, pending: 0 },
    // Missing fields for ShiftMetrics
    revenue: 0,
    tips: 0,
    tips_count: 0,
    transactions: 0,
    avg_ticket_transaction: 0,
    avg_ticket_res: 0,
    avg_ticket_pax: 0,
    avg_ticket_table: 0,
    payment_methods: { card: 0, cash: 0, digital: 0 },
    tables_used: 0,
    table_rotation: 0,
    avg_pax_per_table_used: 0,
  })

  const createEmptyPrevision = () => ({
    comensales_reservados: 0,
    comensales_reservados_comida: 0,
    comensales_reservados_cena: 0,
    mesas_reservadas: 0,
    prevision_facturacion: 0,
    prevision_facturacion_comida: 0,
    prevision_facturacion_cena: 0,
    porcentaje_prevision_alcanzado: 0,
    ticket_comensal_30d: 0,
    ticket_mesa_30d: 0,
  })

  try {
    const todayStr = toLocalISOString(getBusinessDate())

    // Use .maybeSingle() combined with a filter on today's date
    // This ensures we get EITHER today's row OR null (if no sales yet)
    // We NEVER get yesterday's data by mistake.
    const { data, error } = await supabase
      .from("vw_dashboard_ventas_facturas_live")
      .select("*")
      .eq("fecha", todayStr)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching live data (Full Log):", {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
      // In case of error, return empty (zeros), NEVER mocks
      const empty = createEmptyShift()
      return {
        lunch: empty,
        dinner: empty,
        total: empty,
        lunch_percentage: 0,
        dinner_percentage: 0,
        prevision: createEmptyPrevision(),
      }
    }

    if (!data) {
      // Correct behavior: If no sales today, show 0. Do NOT generate random data.
      const empty = createEmptyShift()
      return {
        lunch: empty,
        dinner: empty,
        total: empty,
        lunch_percentage: 0,
        dinner_percentage: 0,
        prevision: createEmptyPrevision(),
      }
    }

    // --- 1. PARSE SALES & VERIFACTU ---
    // Flexible mapping for column names based on logs
    const totalRevenue =
      data.venta_neta_total ??
      data.venta_total ??
      data.facturacion ??
      data["venta neta"] ??
      data["venta_neta"] ??
      data.venta ??
      0

    const lunchRevenue = data.venta_comida ?? data.venta_mediodia ?? data["venta comida"] ?? 0
    const dinnerRevenue = data.venta_cena ?? data.venta_noche ?? data["venta cena"] ?? 0

    const lunchPercentage = Number.parseFloat(String(data.porcentaje_comida ?? 0)) || 0
    const dinnerPercentage = Number.parseFloat(String(data.porcentaje_cena ?? 0)) || 0

    const totalTickets =
      data.total_tickets ?? data.total_facturas ?? data.facturas_total ?? data.tickets ?? data["total facturas"] ?? 0

    const avgTicketTotal = data.ticket_medio ?? 0
    const lunchTickets = data.tickets_comida ?? 0
    const dinnerTickets = data.tickets_cena ?? 0
    const avgTicketLunch = data.ticket_medio_comida ?? 0
    const avgTicketDinner = data.ticket_medio_cena ?? 0

    // VeriFactu
    const vfTotal = data.verifactu_total ?? data.total_facturas ?? 0

    // --- 2. PARSE PRODUCTS (NEW) ---
    // Mapping productos_ranking (Array of JSON objects)
    const rawProducts = (data.productos_ranking as any[]) || []
    const top_products: SalesItem[] = rawProducts.map((p) => ({
      id: p.nombre,
      name: p.nombre,
      category: p.categoria,
      quantity: p.unidades,
      revenue: p.facturado,
    }))

    // Aggregate by Category for "Categoría Top"
    const catsMap = new Map<string, CategorySales>()
    top_products.forEach((item) => {
      if (catsMap.has(item.category)) {
        const c = catsMap.get(item.category)!
        c.quantity += item.quantity
        c.revenue += item.revenue
      } else {
        catsMap.set(item.category, { name: item.category, quantity: item.quantity, revenue: item.revenue })
      }
    })
    const categories = Array.from(catsMap.values()).sort((a, b) => b.revenue - a.revenue)

    const sales_data: SalesBreakdown = {
      categories,
      top_products,
      all_products: top_products,
      modifiers: { with_options: 0, without_options: 0, total_items: 0 }, // Not provided by view yet
    }

    // --- 3. PARSE PAYMENTS (NEW) ---
    // Flexible mapping for payment columns
    const card =
      data.cobro_tarjeta ?? data.pago_tarjeta ?? data.tarjeta ?? data["cobro tarjeta"] ?? data["cobro_tarjeta"] ?? 0
    const cash =
      data.cobro_efectivo ??
      data.pago_efectivo ??
      data.efectivo ??
      data["cobro efectivo"] ??
      data["cobro_efectivo"] ??
      0
    // Try to find digital/apps/others
    const digital = data.cobro_otros ?? data.cobro_apps ?? data.pago_otros ?? data.otros ?? data["cobro otros"] ?? 0

    const payment_methods = { card, cash, digital }

    const verifactu_metrics = {
      success: data.verifactu_ok ?? 0,
      error: data.verifactu_error ?? 0,
      pending: data.verifactu_pendientes ?? 0,
    }

    const prevision = {
      comensales_reservados: data.comensales_reservados ?? 0,
      comensales_reservados_comida: data.comensales_reservados_comida ?? 0,
      comensales_reservados_cena: data.comensales_reservados_cena ?? 0,
      mesas_reservadas: data.mesas_reservadas ?? 0,
      prevision_facturacion: data.prevision_facturacion ?? 0,
      prevision_facturacion_comida: data.prevision_facturacion_comida ?? 0,
      prevision_facturacion_cena: data.prevision_facturacion_cena ?? 0,
      porcentaje_prevision_alcanzado: data.porcentaje_prevision_alcanzado ?? 0,
      ticket_comensal_30d: data.ticket_comensal_30d ?? 0,
      ticket_mesa_30d: data.ticket_mesa_30d ?? 0,
    }

    // Construct the "Total" shift object with real data
    const totalShift: ShiftMetrics = {
      ...createEmptyShift(), // Start with zeros
      revenue: totalRevenue,
      transactions: totalTickets,
      avg_ticket_transaction: avgTicketTotal,
      verifactu_metrics, // Use parsed verifactu_metrics instead of zeros
      // Injected New Data
      sales_data,
      payment_methods,
    }

    // Construct partial Lunch/Dinner objects (only revenue known for now)
    const lunchShift: ShiftMetrics = {
      ...createEmptyShift(),
      revenue: lunchRevenue,
      transactions: lunchTickets,
      avg_ticket_transaction: avgTicketLunch,
    }

    const dinnerShift: ShiftMetrics = {
      ...createEmptyShift(),
      revenue: dinnerRevenue,
      transactions: dinnerTickets,
      avg_ticket_transaction: avgTicketDinner,
    }

    return {
      lunch: lunchShift,
      dinner: dinnerShift,
      total: totalShift,
      lunch_percentage: lunchPercentage,
      dinner_percentage: dinnerPercentage,
      prevision, // Añadido objeto prevision
    }
  } catch (err) {
    console.error("[v0] Unexpected error in fetchRealTimeData:", err)
    const empty = createEmptyShift()
    return {
      lunch: empty,
      dinner: empty,
      total: empty,
      lunch_percentage: 0,
      dinner_percentage: 0,
      prevision: createEmptyPrevision(),
    }
  }
}

// --- AGGREGATION UTILITY ---
const aggregateShifts = (shifts: ShiftMetrics[], shiftType: "total" | "lunch" | "dinner" = "total"): ShiftMetrics => {
  const result: ShiftMetrics = {
    reservations: 0,
    pax: 0,
    tables: 0,
    occupancy_rate: 0,
    avg_pax_per_res: 0,
    avg_pax_per_table: 0,
    tables_used: 0,
    table_rotation: 0,
    avg_pax_per_table_used: 0,
    revenue: 0,
    tips: 0,
    tips_count: 0,
    transactions: 0,
    avg_ticket_transaction: 0,
    avg_ticket_res: 0, // Added missing fields from original code
    avg_ticket_pax: 0,
    avg_ticket_table: 0,
    payment_methods: { card: 0, cash: 0, digital: 0 },
    sales_data: {
      categories: [],
      top_products: [],
      all_products: [],
      modifiers: { with_options: 0, without_options: 0, total_items: 0 },
    },
    expenses: {
      total: 0,
      paid: 0,
      overdue: 0,
      pending: 0,
      by_category: {},
    },
    tables_breakdown: [],
    verifactu_metrics: { success: 0, error: 0, pending: 0 },
  }

  if (shifts.length === 0) return result

  let validTicketTransactionCount = 0
  let validTicketResCount = 0
  let validTicketPaxCount = 0
  let validTicketTableCount = 0

  let sumTicketTransaction = 0
  let sumTicketRes = 0
  let sumTicketPax = 0
  let sumTicketTable = 0

  // Sum simple fields
  shifts.forEach((s) => {
    result.reservations += s.reservations
    result.pax += s.pax
    result.tables += s.tables // This is the *theoretical* capacity, not used tables
    result.tables_used += s.tables_used || 0 // Actual tables used
    result.revenue += s.revenue
    result.tips += s.tips
    result.tips_count += s.tips_count
    result.transactions += s.transactions

    if (s.payment_methods) {
      result.payment_methods.card += s.payment_methods.card || 0
      result.payment_methods.cash += s.payment_methods.cash || 0
      result.payment_methods.digital += s.payment_methods.digital || 0
    }

    if (s.verifactu_metrics) {
      result.verifactu_metrics.success += s.verifactu_metrics.success || 0
      result.verifactu_metrics.error += s.verifactu_metrics.error || 0
      result.verifactu_metrics.pending += s.verifactu_metrics.pending || 0
    }

    // Expenses
    result.expenses.total += s.expenses.total
    result.expenses.paid += s.expenses.paid
    result.expenses.overdue += s.expenses.overdue
    result.expenses.pending += s.expenses.pending
    Object.entries(s.expenses.by_category).forEach(([cat, val]) => {
      result.expenses.by_category[cat] = (result.expenses.by_category[cat] || 0) + val
    })

    if (s.avg_ticket_transaction > 0) {
      sumTicketTransaction += s.avg_ticket_transaction
      validTicketTransactionCount++
    }
    if (s.avg_ticket_res > 0) {
      sumTicketRes += s.avg_ticket_res
      validTicketResCount++
    }
    if (s.avg_ticket_pax > 0) {
      sumTicketPax += s.avg_ticket_pax
      validTicketPaxCount++
    }
    if (s.avg_ticket_table > 0) {
      sumTicketTable += s.avg_ticket_table
      validTicketTableCount++
    }
  })

  if (validTicketTransactionCount > 0) {
    result.avg_ticket_transaction = Number.parseFloat((sumTicketTransaction / validTicketTransactionCount).toFixed(2))
  }
  if (validTicketResCount > 0) {
    result.avg_ticket_res = Number.parseFloat((sumTicketRes / validTicketResCount).toFixed(2))
  }
  if (validTicketPaxCount > 0) {
    result.avg_ticket_pax = Number.parseFloat((sumTicketPax / validTicketPaxCount).toFixed(2))
  }
  if (validTicketTableCount > 0) {
    result.avg_ticket_table = Number.parseFloat((sumTicketTable / validTicketTableCount).toFixed(2))
  }

  // Recalculate other averages that make sense to recalculate from totals
  if (result.reservations > 0) {
    result.avg_pax_per_res = Number.parseFloat((result.pax / result.reservations).toFixed(2))
  }

  if (result.tables_used > 0) {
    result.avg_pax_per_table_used = Number.parseFloat((result.pax / result.tables_used).toFixed(2))
  }

  // Usar el valor de BD si existe (mayor que 0), si no calcular como fallback
  const existingRotation = shifts.find((s) => s.table_rotation > 0)?.table_rotation
  if (existingRotation) {
    result.table_rotation = existingRotation
  } else if (result.tables_used > 0) {
    // Fallback: solo calcular si no hay valor de BD
    result.table_rotation = Number.parseFloat((result.reservations / result.tables_used).toFixed(2))
  }

  const existingOccupancy = shifts.find((s) => s.occupancy_rate > 0)?.occupancy_rate
  if (existingOccupancy) {
    result.occupancy_rate = existingOccupancy
  } else {
    // total = día completo (132 plazas), lunch/dinner = turno individual (66 plazas)
    const totalCapacity = shiftType === "total" ? CAPACITY_PER_SHIFT * 2 : CAPACITY_PER_SHIFT
    if (totalCapacity > 0) {
      result.occupancy_rate = Number.parseFloat(((result.pax / totalCapacity) * 100).toFixed(2))
    }
  }

  if (result.tables > 0) {
    result.avg_pax_per_table = Number.parseFloat((result.pax / result.tables).toFixed(2))
  }

  return result
}

export const aggregateMetrics = (data: DailyCompleteMetrics[]): DailyCompleteMetrics => {
  const totalShift = aggregateShifts(
    data.map((d) => d.total),
    "total",
  )
  const lunchShift = aggregateShifts(
    data.map((d) => d.lunch),
    "lunch",
  )
  const dinnerShift = aggregateShifts(
    data.map((d) => d.dinner),
    "dinner",
  )

  // Extract capacity from first record to attach to aggregated result
  const capacity = data.length > 0 && data[0].capacity ? data[0].capacity : undefined

  return {
    date: data.length > 0 ? `${data[0].date} - ${data[data.length - 1].date}` : "",
    capacity, // Attach capacity to aggregated metrics
    total: totalShift,
    lunch: lunchShift,
    dinner: dinnerShift,
  }
}

export const fetchReservationsFromDB = async (startDate: Date, endDate: Date): Promise<DailyCompleteMetrics[]> => {
  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  const { data: rows, error } = await supabase
    .from("vw_metricas_diarias_base")
    .select("*")
    .gte("fecha", startDateStr)
    .lte("fecha", endDateStr)
    .order("fecha", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching reservations from DB:", error)
    return []
  }

  const firstRow = rows?.[0]
  const capacity = firstRow
    ? {
      plazas_turno: firstRow.capacidad_plazas_turno || 66,
      plazas_dia: firstRow.capacidad_plazas_dia || 132,
      mesas_turno: firstRow.capacidad_mesas_turno || 19,
      mesas_dia: firstRow.capacidad_mesas_dia || 38,
    }
    : undefined

  // Transform DB data to DailyCompleteMetrics format
  const mapped = (rows || []).map((row: any) => {
    const paxDia = Number.parseFloat(row.comensales_total_dia) || 0
    const paxComida = Number.parseFloat(row.comensales_comida) || 0
    const paxCena = Number.parseFloat(row.comensales_cena) || 0
    const capacidadDia = Number.parseFloat(row.capacidad_plazas_dia) || 132
    const capacidadTurno = Number.parseFloat(row.capacidad_plazas_turno) || 66

    // Use DB value if exists, otherwise calculate
    const ocupacionDia = row.ocupacion_dia ? Number.parseFloat(row.ocupacion_dia) : (paxDia / capacidadDia) * 100
    const ocupacionComida = row.ocupacion_comida
      ? Number.parseFloat(row.ocupacion_comida)
      : (paxComida / capacidadTurno) * 100
    const ocupacionCena = row.ocupacion_cena ? Number.parseFloat(row.ocupacion_cena) : (paxCena / capacidadTurno) * 100

    return {
      date: row.fecha,
      capacity,
      total: {
        reservations: Number.parseFloat(row.reservas_total_dia) || 0,
        pax: paxDia,
        tables: Number.parseFloat(row.capacidad_mesas_dia) || 38,
        tables_used: row.mesas_ocupadas_dia || 0,
        revenue: Number.parseFloat(row.total_facturado_dia) || 0,
        tips: Number.parseFloat(row.total_propinas_dia) || 0,
        tips_count: Number.parseInt(row.propinas_count_dia) || 0,
        transactions: Number.parseInt(row.num_transacciones_dia) || 0,
        avg_ticket_transaction: Number.parseFloat(row.ticket_medio_transaccion_dia) || 0,
        avg_ticket_res: Number.parseFloat(row.ticket_medio_por_reserva_dia) || 0,
        avg_ticket_pax: Number.parseFloat(row.ticket_medio_por_comensal_dia) || 0,
        avg_ticket_table: Number.parseFloat(row.ticket_medio_por_mesa_dia) || 0,
        avg_pax_per_res: Number.parseFloat(row.pax_medio_reserva_dia) || 0,
        avg_pax_per_table: row.pax_medio_mesa_dia || 0,
        avg_pax_per_table_used: Number.parseFloat(row.pax_medio_mesa_dia) || 0,
        table_rotation: Number.parseFloat(row.rotacion_mesas_dia) || 0,
        occupancy_rate: Number.parseFloat(row.ocupacion_porcentaje_dia) || Number.parseFloat(ocupacionDia.toFixed(2)),

        payment_methods: {
          card: Number.parseFloat(row.facturado_tarjeta_dia) || 0,
          cash: Number.parseFloat(row.facturado_efectivo_dia) || 0,
          digital: Number.parseFloat(row.facturado_otros_dia) || 0,
        },

        verifactu_metrics: {
          success: Number.parseInt(row.verifactu_ok) || 0,
          error: Number.parseInt(row.verifactu_error) || 0,
          pending: Number.parseInt(row.verifactu_pendientes) || 0,
        },
        expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} }, // Not available in this view
        sales_data: {
          categories: [],
          top_products: [],
          all_products: [],
          modifiers: { with_options: 0, without_options: 0, total_items: 0 },
        }, // Not available in this view
        tables_breakdown: [], // Not available in this view
      },
      lunch: {
        reservations: Number.parseFloat(row.reservas_comida) || 0,
        pax: paxComida,
        tables: Number.parseFloat(row.capacidad_mesas_turno) || 19,
        tables_used: row.mesas_ocupadas_comida || 0,
        revenue: Number.parseFloat(row.total_facturado_comida) || 0,
        tips: Number.parseFloat(row.total_propinas_comida) || 0,
        tips_count: Number.parseInt(row.propinas_count_comida) || 0,
        transactions: Number.parseInt(row.num_transacciones_comida) || 0,
        avg_ticket_transaction: Number.parseFloat(row.ticket_medio_transaccion_comida) || 0,
        avg_ticket_res: Number.parseFloat(row.ticket_medio_por_reserva_comida) || 0,
        avg_ticket_pax: Number.parseFloat(row.ticket_medio_por_comensal_comida) || 0,
        avg_ticket_table: Number.parseFloat(row.ticket_medio_por_mesa_comida) || 0,
        avg_pax_per_res: Number.parseFloat(row.pax_medio_reserva_comida) || 0,
        avg_pax_per_table: row.pax_medio_mesa_comida || 0,
        avg_pax_per_table_used: Number.parseFloat(row.pax_medio_mesa_comida) || 0,
        table_rotation: Number.parseFloat(row.rotacion_mesas_comida) || 0,
        occupancy_rate:
          Number.parseFloat(row.ocupacion_porcentaje_comida) || Number.parseFloat(ocupacionComida.toFixed(2)),

        payment_methods: {
          card: Number.parseFloat(row.facturado_tarjeta_comida) || 0,
          cash: Number.parseFloat(row.facturado_efectivo_comida) || 0,
          digital: Number.parseFloat(row.facturado_otros_comida) || 0,
        },

        verifactu_metrics: {
          success: Number.parseInt(row.verifactu_ok_comida) || 0,
          error: Number.parseInt(row.verifactu_error_comida) || 0,
          pending: Number.parseInt(row.verifactu_pendientes_comida) || 0,
        },
        expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} },
        sales_data: {
          categories: [],
          top_products: [],
          all_products: [],
          modifiers: { with_options: 0, without_options: 0, total_items: 0 },
        },
        tables_breakdown: [],
      },
      dinner: {
        reservations: Number.parseFloat(row.reservas_cena) || 0,
        pax: paxCena,
        tables: Number.parseFloat(row.capacidad_mesas_turno) || 19,
        tables_used: row.mesas_ocupadas_cena || 0,
        revenue: Number.parseFloat(row.total_facturado_cena) || 0,
        tips: Number.parseFloat(row.total_propinas_cena) || 0,
        tips_count: Number.parseInt(row.propinas_count_cena) || 0,
        transactions: Number.parseInt(row.num_transacciones_cena) || 0,
        avg_ticket_transaction: Number.parseFloat(row.ticket_medio_transaccion_cena) || 0,
        avg_ticket_res: Number.parseFloat(row.ticket_medio_por_reserva_cena) || 0,
        avg_ticket_pax: Number.parseFloat(row.ticket_medio_por_comensal_cena) || 0,
        avg_ticket_table: Number.parseFloat(row.ticket_medio_por_mesa_cena) || 0,
        avg_pax_per_res: Number.parseFloat(row.pax_medio_reserva_cena) || 0,
        avg_pax_per_table: row.pax_medio_mesa_cena || 0,
        avg_pax_per_table_used: Number.parseFloat(row.pax_medio_mesa_cena) || 0,
        table_rotation: Number.parseFloat(row.rotacion_mesas_cena) || 0,
        occupancy_rate: Number.parseFloat(row.ocupacion_porcentaje_cena) || Number.parseFloat(ocupacionCena.toFixed(2)),

        payment_methods: {
          card: Number.parseFloat(row.facturado_tarjeta_cena) || 0,
          cash: Number.parseFloat(row.facturado_efectivo_cena) || 0,
          digital: Number.parseFloat(row.facturado_otros_cena) || 0,
        },

        verifactu_metrics: {
          success: Number.parseInt(row.verifactu_ok_cena) || 0,
          error: Number.parseInt(row.verifactu_error_cena) || 0,
          pending: Number.parseInt(row.verifactu_pendientes_cena) || 0,
        },
        expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} },
        sales_data: {
          categories: [],
          top_products: [],
          all_products: [],
          modifiers: { with_options: 0, without_options: 0, total_items: 0 },
        },
        tables_breakdown: [],
      },
    }
  })

  return mapped
}

// --- FETCH INCOME FROM DB ---
export const fetchIncomeFromDB = async (startDate: Date, endDate: Date): Promise<DailyCompleteMetrics[]> => {
  const start = startDate.toISOString().split("T")[0]
  const end = endDate.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("vw_metricas_diarias_base")
    .select("*")
    .gte("fecha", start)
    .lte("fecha", end)
    .order("fecha", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching income from DB:", error)
    return []
  }

  const firstRow = data?.[0]
  const capacity = firstRow
    ? {
      plazas_turno: firstRow.capacidad_plazas_turno || 66,
      plazas_dia: firstRow.capacidad_plazas_dia || 132,
      mesas_turno: firstRow.capacidad_mesas_turno || 19,
      mesas_dia: firstRow.capacidad_mesas_dia || 38,
    }
    : undefined

  // Transform DB data to DailyCompleteMetrics format
  return (data || []).map((row: any) => ({
    date: row.fecha,
    capacity,
    total: {
      reservations: Number.parseFloat(row.reservas_total_dia) || 0,
      pax: Number.parseFloat(row.comensales_total_dia) || 0,
      tables: Number.parseFloat(row.capacidad_mesas_dia) || 38,
      tables_used: row.mesas_ocupadas_dia || 0,
      revenue: Number.parseFloat(row.total_facturado_dia) || 0,
      tips: Number.parseFloat(row.total_propinas_dia) || 0,
      tips_count: Number.parseInt(row.propinas_count_dia) || 0,
      transactions: Number.parseInt(row.num_transacciones_dia) || 0,
      avg_ticket_transaction: Number.parseFloat(row.ticket_medio_transaccion_dia) || 0,
      avg_ticket_res: Number.parseFloat(row.ticket_medio_por_reserva_dia) || 0,
      avg_ticket_pax: Number.parseFloat(row.ticket_medio_por_comensal_dia) || 0,
      avg_ticket_table: Number.parseFloat(row.ticket_medio_por_mesa_dia) || 0,
      avg_pax_per_res: Number.parseFloat(row.pax_medio_reserva_dia) || 0,
      avg_pax_per_table: row.pax_medio_mesa_dia || 0,
      avg_pax_per_table_used: Number.parseFloat(row.pax_medio_mesa_dia) || 0,
      table_rotation: Number.parseFloat(row.rotacion_mesas_dia) || 0,
      occupancy_rate: Number.parseFloat(row.ocupacion_porcentaje_dia) || 0,

      payment_methods: {
        card: Number.parseFloat(row.facturado_tarjeta_dia) || 0,
        cash: Number.parseFloat(row.facturado_efectivo_dia) || 0,
        digital: Number.parseFloat(row.facturado_otros_dia) || 0,
      },

      verifactu_metrics: { success: 0, error: 0, pending: 0 }, // Not available in this view
      expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} }, // Not available in this view
      sales_data: {
        categories: [],
        top_products: [],
        all_products: [],
        modifiers: { with_options: 0, without_options: 0, total_items: 0 },
      }, // Not available in this view
      tables_breakdown: [], // Not available in this view
    },
    lunch: {
      reservations: Number.parseFloat(row.reservas_comida) || 0,
      pax: Number.parseFloat(row.comensales_comida) || 0,
      tables: Number.parseFloat(row.capacidad_mesas_turno) || 19,
      tables_used: row.mesas_ocupadas_comida || 0,
      revenue: Number.parseFloat(row.total_facturado_comida) || 0,
      tips: Number.parseFloat(row.total_propinas_comida) || 0,
      tips_count: Number.parseInt(row.propinas_count_comida) || 0,
      transactions: Number.parseInt(row.num_transacciones_comida) || 0,
      avg_ticket_transaction: Number.parseFloat(row.ticket_medio_transaccion_comida) || 0,
      avg_ticket_res: Number.parseFloat(row.ticket_medio_por_reserva_comida) || 0,
      avg_ticket_pax: Number.parseFloat(row.ticket_medio_por_comensal_comida) || 0,
      avg_ticket_table: Number.parseFloat(row.ticket_medio_por_mesa_comida) || 0,
      avg_pax_per_res: Number.parseFloat(row.pax_medio_reserva_comida) || 0,
      avg_pax_per_table: row.pax_medio_mesa_comida || 0,
      avg_pax_per_table_used: Number.parseFloat(row.pax_medio_mesa_comida) || 0,
      table_rotation: Number.parseFloat(row.rotacion_mesas_comida) || 0,
      occupancy_rate: Number.parseFloat(row.ocupacion_porcentaje_comida) || 0,

      payment_methods: {
        card: 0, // No disponible por turno
        cash: 0,
        digital: 0,
      },

      verifactu_metrics: { success: 0, error: 0, pending: 0 },
      expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} },
      sales_data: {
        categories: [],
        top_products: [],
        all_products: [],
        modifiers: { with_options: 0, without_options: 0, total_items: 0 },
      },
      tables_breakdown: [],
    },
    dinner: {
      reservations: Number.parseFloat(row.reservas_cena) || 0,
      pax: Number.parseFloat(row.comensales_cena) || 0,
      tables: Number.parseFloat(row.capacidad_mesas_turno) || 19,
      tables_used: row.mesas_ocupadas_cena || 0,
      revenue: Number.parseFloat(row.total_facturado_cena) || 0,
      tips: Number.parseFloat(row.total_propinas_cena) || 0,
      tips_count: Number.parseInt(row.propinas_count_cena) || 0,
      transactions: Number.parseInt(row.num_transacciones_cena) || 0,
      avg_ticket_transaction: Number.parseFloat(row.ticket_medio_transaccion_cena) || 0,
      avg_ticket_res: Number.parseFloat(row.ticket_medio_por_reserva_cena) || 0,
      avg_ticket_pax: Number.parseFloat(row.ticket_medio_por_comensal_cena) || 0,
      avg_ticket_table: Number.parseFloat(row.ticket_medio_por_mesa_cena) || 0,
      avg_pax_per_res: Number.parseFloat(row.pax_medio_reserva_cena) || 0,
      avg_pax_per_table: row.pax_medio_mesa_cena || 0,
      avg_pax_per_table_used: Number.parseFloat(row.pax_medio_mesa_cena) || 0,
      table_rotation: Number.parseFloat(row.rotacion_mesas_cena) || 0,
      occupancy_rate: Number.parseFloat(row.ocupacion_porcentaje_cena) || 0,

      payment_methods: {
        card: 0,
        cash: 0,
        digital: 0,
      },

      verifactu_metrics: { success: 0, error: 0, pending: 0 },
      expenses: { total: 0, paid: 0, overdue: 0, pending: 0, by_category: {} },
      sales_data: {
        categories: [],
        top_products: [],
        all_products: [],
        modifiers: { with_options: 0, without_options: 0, total_items: 0 },
      },
      tables_breakdown: [],
    },
  }))
}

// --- FETCH TABLE BILLING FROM DB ---
export const fetchTableBillingFromDB = async (startDate: Date, endDate: Date): Promise<TableBillingMetrics[]> => {
  const { data, error } = await supabase
    .from("vw_facturacion_mesas")
    .select("*")
    .gte("fecha", startDate.toISOString().split("T")[0])
    .lte("fecha", endDate.toISOString().split("T")[0])
    .order("fecha", { ascending: true })
    .order("ranking_dia", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching table billing data:", error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((row: any) => ({
    table_id: row.table_id,
    numero_mesa: row.numero_mesa,
    nombre_mesa: row.nombre_mesa,
    fecha: row.fecha,
    turno: row.turno,
    total_facturado: Number.parseFloat(row.total_facturado) || 0,
    total_propinas: Number.parseFloat(row.total_propinas) || 0,
    num_facturas: row.num_facturas || 0,
    ranking_dia: row.ranking_dia,
    ranking_turno: row.ranking_turno,
  }))
}

export const aggregateTableMetrics = (data: TableBillingMetrics[]): TableAggregatedMetrics[] => {
  const tableMap = new Map<string, TableAggregatedMetrics>()

  data.forEach((row) => {
    if (!tableMap.has(row.table_id)) {
      tableMap.set(row.table_id, {
        table_id: row.table_id,
        numero_mesa: row.numero_mesa,
        nombre_mesa: row.nombre_mesa,
        total_facturado: 0,
        total_propinas: 0,
        num_facturas: 0,
        avg_factura: 0,
        avg_ranking: 0,
      })
    }

    const table = tableMap.get(row.table_id)!
    table.total_facturado += row.total_facturado
    table.total_propinas += row.total_propinas
    table.num_facturas += row.num_facturas
  })

  // Calculate averages and sort by revenue
  const result = Array.from(tableMap.values())
    .map((table) => ({
      ...table,
      avg_factura: table.num_facturas > 0 ? table.total_facturado / table.num_facturas : 0,
    }))
    .sort((a, b) => b.total_facturado - a.total_facturado)

  // Assign rankings
  result.forEach((table, index) => {
    table.avg_ranking = index + 1
  })

  return result
}

// Fetch expense tags from Supabase RPC
export const fetchExpenseTags = async (): Promise<ExpenseTag[]> => {
  try {
    const { data, error } = await supabase.rpc("get_expense_tags")

    if (error) {
      console.error("[v0] Error fetching expense tags:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchExpenseTags:", err)
    return []
  }
}

// Fetch expenses filtered by tags, dates and status
export const fetchExpensesByTags = async (
  tags?: string[],
  startDate?: string,
  endDate?: string,
  status?: "paid" | "pending" | "overdue",
): Promise<Expense[]> => {
  try {
    const params: Record<string, any> = {}

    if (tags && tags.length > 0) {
      params.p_tags = tags
    }
    if (startDate) {
      params.p_fecha_inicio = startDate
    }
    if (endDate) {
      params.p_fecha_fin = endDate
    }
    if (status) {
      params.p_status = status
    }

    const { data, error } = await supabase.rpc("get_gastos_by_tags", params)

    if (error) {
      console.error("[v0] Error fetching expenses by tags:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchExpensesByTags:", err)
    return []
  }
}

export const fetchExpensesByDueDate = async (
  dueDateStart: string,
  dueDateEnd: string,
  status?: "paid" | "pending" | "overdue",
): Promise<Expense[]> => {
  try {
    const params: Record<string, any> = {
      p_due_date_inicio: dueDateStart,
      p_due_date_fin: dueDateEnd,
    }

    if (status) {
      params.p_status = status
    }

    const { data, error } = await supabase.rpc("get_gastos_by_due_date", params)

    if (error) {
      console.error("[v0] Error fetching expenses by due date:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchExpensesByDueDate:", err)
    return []
  }
}

// Fetch expense summary by tags
export const fetchExpenseSummaryByTags = async (
  tags?: string[],
  startDate?: string,
  endDate?: string,
): Promise<ExpenseTagSummary[]> => {
  try {
    const params: Record<string, any> = {}

    if (tags && tags.length > 0) {
      params.p_tags = tags
    }
    if (startDate) {
      params.p_fecha_inicio = startDate
    }
    if (endDate) {
      params.p_fecha_fin = endDate
    }

    const { data, error } = await supabase.rpc("get_gastos_resumen_by_tags", params)

    if (error) {
      console.error("[v0] Error fetching expense summary:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchExpenseSummaryByTags:", err)
    return []
  }
}

export const fetchExpenseSummaryByProvider = async (
  startDate?: string,
  endDate?: string,
): Promise<ExpenseProviderSummary[]> => {
  try {
    const params: Record<string, any> = {}

    if (startDate) {
      params.p_fecha_inicio = startDate
    }
    if (endDate) {
      params.p_fecha_fin = endDate
    }

    const { data, error } = await supabase.rpc("get_gastos_resumen_by_provider", params)

    if (error) {
      console.error("[v0] Error fetching expense summary by provider:", error)
      // Fallback: calcular desde expenses si no existe la RPC
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchExpenseSummaryByProvider:", err)
    return []
  }
}

export const fetchOperationsRealTime = async (): Promise<OperacionesData | null> => {
  try {
    const { data, error } = await supabase.from("vw_operaciones_tiempo_real").select("*").single()

    if (error) {
      console.error("[v0] Error fetching operations data:", error)
      return null
    }

    if (!data) {
      return null
    }

    return data as OperacionesData
  } catch (err) {
    console.error("[v0] Exception fetching operations:", err)
    return null
  }
}

// --- PRODUCT MIX DATA ---

export async function fetchProductMix(
  startDate: string,
  endDate: string,
  turno?: string,
  categoria?: string,
): Promise<ProductMixItem[]> {
  try {
    let query = supabase.from("vw_mix_productos").select("*").gte("fecha_texto", startDate).lte("fecha_texto", endDate)

    if (turno && turno !== "todos") {
      query = query.eq("turno_nombre", turno)
    }
    if (categoria && categoria !== "todas") {
      query = query.eq("categoria_nombre", categoria)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching product mix:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Exception fetching product mix:", err)
    return []
  }
}

export async function fetchCategoryMix(startDate: string, endDate: string, turno?: string): Promise<CategoryMixItem[]> {
  try {
    let query = supabase.from("vw_mix_categorias").select("*").gte("fecha_texto", startDate).lte("fecha_texto", endDate)

    if (turno && turno !== "todos") {
      query = query.eq("turno_nombre", turno)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching category mix:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Exception fetching category mix:", err)
    return []
  }
}

export async function fetchOptionMix(
  startDate: string,
  endDate: string,
  turno?: string,
  soloExtraPago?: boolean,
): Promise<OptionMixItem[]> {
  try {
    let query = supabase.from("vw_mix_opciones").select("*").gte("fecha_texto", startDate).lte("fecha_texto", endDate)

    if (turno && turno !== "todos") {
      query = query.eq("turno_nombre", turno)
    }
    if (soloExtraPago) {
      query = query.eq("es_extra_pago", true)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching option mix:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Exception fetching option mix:", err)
    return []
  }
}

export const fetchYearlyComparison = async (): Promise<YearlyComparisonData[]> => {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("reservas_agregadas_diarias")
      .select(
        "fecha, total_reservas, total_comensales, reservas_comida, reservas_cena, comensales_comida, comensales_cena",
      )
      .lte("fecha", yesterdayStr) // Solo hasta ayer
      .order("fecha", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching yearly comparison:", error)
      return []
    }

    const currentYear = yesterday.getFullYear()

    // Agrupar por año y mes
    // Años anteriores: mostrar completos (12 meses con datos disponibles)
    // Año actual: mostrar hasta el mes actual (va creciendo conforme pasan los meses)
    const yearMap = new Map<number, Map<number, MonthlyReservationData>>()

    for (const row of data || []) {
      const date = new Date(row.fecha)
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // 1-12

      // Ya no filtramos años anteriores - se muestran completos
      // El año actual se filtra naturalmente por .lte("fecha", yesterdayStr)

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map())
      }

      const monthMap = yearMap.get(year)!
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          mes: month,
          mes_nombre: new Date(year, month - 1).toLocaleDateString("es-ES", { month: "short" }),
          total_reservas: 0,
          total_comensales: 0,
          reservas_comida: 0,
          reservas_cena: 0,
          comensales_comida: 0,
          comensales_cena: 0,
          dias_operativos: 0,
        })
      }

      const monthData = monthMap.get(month)!
      monthData.total_reservas += row.total_reservas || 0
      monthData.total_comensales += row.total_comensales || 0
      monthData.reservas_comida += row.reservas_comida || 0
      monthData.reservas_cena += row.reservas_cena || 0
      monthData.comensales_comida += row.comensales_comida || 0
      monthData.comensales_cena += row.comensales_comida || 0 // Corrected: This should be comensales_cena
      monthData.dias_operativos += 1
    }

    // Convertir a array de YearlyComparisonData
    const result: YearlyComparisonData[] = []

    for (const [year, monthMap] of yearMap) {
      const meses = Array.from(monthMap.values()).sort((a, b) => a.mes - b.mes)

      const totals = meses.reduce(
        (acc, m) => ({
          reservas: acc.reservas + m.total_reservas,
          comensales: acc.comensales + m.total_comensales,
          comensales_comida: acc.comensales_comida + m.comensales_comida,
          comensales_cena: acc.comensales_cena + m.comensales_cena,
        }),
        { reservas: 0, comensales: 0, comensales_comida: 0, comensales_cena: 0 },
      )

      result.push({ año: year, meses, totals })
    }

    return result.sort((a, b) => a.año - b.año)
  } catch (err) {
    console.error("[v0] Error in fetchYearlyComparison:", err)
    return []
  }
}

// --- FORECASTING FUNCTIONS ---

export async function fetchForecastData(): Promise<{
  kpis: ForecastKPIs
  proximos7dias: ForecastDay[]
  precision: ForecastPrecision
}> {
  const today = getBusinessDate()
  const todayStr = toLocalISOString(today)

  // Get next 7 days forecast
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 7)
  const endStr = toLocalISOString(endDate)

  // Get historical data (last 4 weeks for precision)
  const fourWeeksAgo = new Date(today)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
  const fourWeeksAgoStr = toLocalISOString(fourWeeksAgo)

  // Fetch from vw_forecasting_analysis
  const { data: allData, error } = await supabase
    .from("vw_forecasting_analysis")
    .select("*")
    .gte("fecha", fourWeeksAgoStr)
    .lte("fecha", endStr)
    .order("fecha", { ascending: true })

  if (error) {
  }

  // If no data from DB, generate mock data
  if (!allData || allData.length === 0) {
    return generateMockForecastData(today, todayStr)
  }

  // Separate future data (next 7 days) and past data (historical)
  const proximos7dias: ForecastDay[] = allData
    .filter((d: any) => d.fecha >= todayStr && d.fecha <= endStr)
    .map((d: any) => ({
      fecha: d.fecha,
      nombre_dia: d.nombre_dia || "",
      mes: d.mes || new Date(d.fecha).getMonth() + 1,
      comensales_real: d.comensales_real || 0,
      comensales_comida_real: d.comensales_comida_real || 0,
      comensales_cena_real: d.comensales_cena_real || 0,
      comensales_prediccion: d.comensales_prediccion || 0,
      comensales_comida_pred: d.comensales_comida_pred || 0,
      comensales_cena_pred: d.comensales_cena_pred || 0,
      ventas_prediccion: d.ventas_prediccion || 0,
      confianza_prediccion: d.confianza_prediccion || 0.75,
      error_prediccion: d.error_prediccion,
      error_porcentaje: d.error_porcentaje,
      nivel_lluvia: d.nivel_lluvia,
      temp_max: d.temp_max,
      es_festivo: d.es_festivo || false,
      evento_principal: d.evento_principal,
      comensales_semana_ant: d.comensales_semana_ant,
      comensales_año_ant: d.comensales_año_ant,
      tipo_fecha: d.tipo_fecha || "futuro",
      // DB fields for capacity and occupancy
      capacidad_turno: d.capacidad_turno || 66,
      capacidad_dia: d.capacidad_dia || 132,
      capacidad_mesas: d.capacidad_mesas || 19,
      ocupacion_pct_prediccion: d.ocupacion_pct_prediccion || 0,
      ocupacion_pct_comida_pred: d.ocupacion_pct_comida_pred || 0,
      ocupacion_pct_cena_pred: d.ocupacion_pct_cena_pred || 0,
      ocupacion_pct_real: d.ocupacion_pct_real || 0,
      ocupacion_pct_comida_real: d.ocupacion_pct_comida_real || 0,
      ocupacion_pct_cena_real: d.ocupacion_pct_cena_real || 0,
      nivel_ocupacion: d.nivel_ocupacion || "tranquilo",
    }))

  // Historical data for precision calculation
  const historicalData = allData.filter((d: any) => d.fecha < todayStr && d.tipo_fecha === "pasado")

  const historico: ForecastHistorico[] = historicalData.map((h: any) => ({
    fecha: h.fecha,
    prediccion: h.comensales_prediccion || 0,
    real: h.comensales_real || 0,
    diferencia: (h.comensales_real || 0) - (h.comensales_prediccion || 0),
    error_pct: h.error_porcentaje ? Math.abs(h.error_porcentaje) : 0,
  }))

  // Calculate precision metrics
  const errores = historico.filter((h) => h.error_pct > 0).map((h) => h.error_pct)
  const precisionMedia = errores.length > 0 ? 100 - errores.reduce((a, b) => a + b, 0) / errores.length : 85
  const mejorDia =
    historico.length > 0 ? historico.reduce((a, b) => (a.error_pct < b.error_pct ? a : b)) : { fecha: "", error_pct: 0 }
  const peorDia =
    historico.length > 0 ? historico.reduce((a, b) => (a.error_pct > b.error_pct ? a : b)) : { fecha: "", error_pct: 0 }

  // KPIs
  const hoy = proximos7dias.find((d) => d.fecha === todayStr) || proximos7dias[0]
  const capacidadDiaria = 132 // Capacity from your restaurant
  const ocupacionSemana =
    proximos7dias.length > 0
      ? Math.floor(
        (proximos7dias.reduce((a, b) => a + b.comensales_prediccion, 0) / (proximos7dias.length * capacidadDiaria)) *
        100,
      )
      : 0

  return {
    kpis: {
      prediccion_hoy: hoy?.comensales_prediccion || 0,
      reservas_hoy: hoy?.comensales_real || 0, // In future dates, comensales_real = reservas confirmadas
      ocupacion_semana: Math.min(100, ocupacionSemana),
      precision_modelo: Math.floor(precisionMedia),
    },
    proximos7dias,
    precision: {
      semanas: historico,
      precision_media: precisionMedia,
      mejor_dia: { fecha: mejorDia.fecha, error: mejorDia.error_pct },
      peor_dia: { fecha: peorDia.fecha, error: peorDia.error_pct },
    },
  }
}

export async function fetchForecastCalendar(year: number, month: number): Promise<ForecastDay[]> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const { data, error } = await supabase
    .from("vw_forecasting_analysis")
    .select("*")
    .gte("fecha", toLocalISOString(startDate))
    .lte("fecha", toLocalISOString(endDate))
    .order("fecha", { ascending: true })

  if (error || !data || data.length === 0) {
    // Generate mock data for the month
    const today = getBusinessDate()
    return generateMockForecastCalendar(year, month, today)
  }

  return data.map((d: any) => ({
    fecha: d.fecha,
    nombre_dia: d.nombre_dia || "",
    mes: d.mes || month,
    comensales_real: d.comensales_real || 0,
    comensales_comida_real: d.comensales_comida_real || 0,
    comensales_cena_real: d.comensales_cena_real || 0,
    comensales_prediccion: d.comensales_prediccion || 0,
    comensales_comida_pred: d.comensales_comida_pred || 0,
    comensales_cena_pred: d.comensales_cena_pred || 0,
    ventas_prediccion: d.ventas_prediccion || 0,
    confianza_prediccion: d.confianza_prediccion || 0.75,
    capacidad_turno: d.capacidad_turno || 66,
    capacidad_dia: d.capacidad_dia || 132,
    capacidad_mesas: d.capacidad_mesas || 19,
    ocupacion_pct_prediccion: d.ocupacion_pct_prediccion || 0,
    ocupacion_pct_comida_pred: d.ocupacion_pct_comida_pred || 0,
    ocupacion_pct_cena_pred: d.ocupacion_pct_cena_pred || 0,
    ocupacion_pct_real: d.ocupacion_pct_real || 0,
    ocupacion_pct_comida_real: d.ocupacion_pct_comida_real || 0,
    ocupacion_pct_cena_real: d.ocupacion_pct_cena_real || 0,
    nivel_ocupacion: d.nivel_ocupacion || "tranquilo",
    error_prediccion: d.error_prediccion,
    error_porcentaje: d.error_porcentaje,
    nivel_lluvia: d.nivel_lluvia,
    temp_max: d.temp_max,
    es_festivo: d.es_festivo || false,
    evento_principal: d.evento_principal,
    comensales_semana_ant: d.comensales_semana_ant,
    comensales_año_ant: d.comensales_año_ant,
    tipo_fecha: d.tipo_fecha || "futuro",
  }))
}

export async function fetchFinancialKPIs(): Promise<FinancialKPIs[]> {
  try {
    const { data, error } = await supabase
      .from("vw_dashboard_financiero")
      .select("*")
      .order("periodo", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching financial KPIs (Full Log):", {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
      return []
    }

    return (data || []).map((row: any) => ({
      periodo: row.periodo,
      ingresos: row.ingresos || 0,
      gastos: row.gastos || 0,
      margen: row.margen || 0,
      margen_pct: row.margen_pct || 0,
      num_facturas: row.num_facturas || 0,
      comensales: row.comensales || 0,
      ticket_medio: row.ticket_medio || 0,
      ingresos_ant: row.ingresos_ant || 0,
      gastos_ant: row.gastos_ant || 0,
      ticket_medio_ant: row.ticket_medio_ant || 0,
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
    }))
  } catch (error) {
    console.error("[v0] Error in fetchFinancialKPIs:", error)
    return []
  }
}

export async function fetchOcupacionSemanal(): Promise<OcupacionDia[]> {
  try {
    const { data, error } = await supabase
      .from("vw_dashboard_ocupacion")
      .select("*")
      .order("fecha", { ascending: true })
      .limit(7)

    if (error) {
      console.error("[v0] Error fetching ocupacion semanal:", error)
      return []
    }

    // Mapeo de días de inglés a español
    const diasMap: Record<string, string> = {
      Mon: "Lun",
      Tue: "Mar",
      Wed: "Mié",
      Thu: "Jue",
      Fri: "Vie",
      Sat: "Sáb",
      Sun: "Dom",
    }

    return (data || []).map((row: any) => ({
      fecha: row.fecha,
      dia_semana: diasMap[row.dia_semana] || row.dia_semana,
      comensales_comida: row.comensales_comida || 0,
      comensales_cena: row.comensales_cena || 0,
      total_comensales: row.total_comensales || 0,
      ocupacion_total_pct: row.ocupacion_total_pct || 0,
      nivel_ocupacion: row.nivel_ocupacion || "tranquilo",
      es_hoy: row.es_hoy || false,
    }))
  } catch (error) {
    console.error("[v0] Error in fetchOcupacionSemanal:", error)
    return []
  }
}

export async function fetchLaborCostAnalysis(startDate: string, endDate: string): Promise<LaborCostDay[]> {
  try {
    const { data, error } = await supabase
      .from("vw_labor_cost_analysis")
      .select("*")
      .gte("fecha", startDate)
      .lte("fecha", endDate)
      .order("fecha", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching labor cost analysis (Full Log):", {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
      return []
    }

    return (data || []).map((row: any) => ({
      fecha: row.fecha,
      ventas_netas: row.ventas_netas || 0,
      coste_laboral: row.coste_laboral || 0,
      horas_trabajadas: row.horas_trabajadas || 0,
      trabajadores: row.trabajadores || 0,
      porcentaje_laboral: row.porcentaje_laboral || 0,
    }))
  } catch (err) {
    console.error("[v0] Error in fetchLaborCostAnalysis:", err)
    return []
  }
}

export async function fetchWeekRevenue(weekOffset = 0): Promise<WeekRevenueDay[]> {
  try {
    const { data, error } = await supabase.rpc("rpc_facturacion_semana", { p_week_offset: weekOffset })

    if (error) {
      console.error("[v0] Error fetching week revenue (Full Log):", {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
      return []
    }

    // Mapeo de días de inglés a español
    const diasMap: Record<string, string> = {
      Mon: "Lun",
      Tue: "Mar",
      Wed: "Mié",
      Thu: "Jue",
      Fri: "Vie",
      Sat: "Sáb",
      Sun: "Dom",
    }

    return (data || []).map((row: any) => ({
      fecha: row.fecha,
      diaSemanaCorto: diasMap[row.dia_semana_corto] || row.dia_semana_corto,
      diaMes: row.dia_mes,
      tipoDia: row.tipo_dia,
      esHoy: row.es_hoy || false,
      esFuturo: row.es_futuro || false,
      facturadoReal: row.facturado_real || 0,
      prevision: row.prevision || 0,
      previsionComida: row.prevision_comida || 0,
      previsionCena: row.prevision_cena || 0,
      porcentajeAlcanzado: row.porcentaje_alcanzado || 0,
      margenErrorPct: row.margen_error_pct,
      diferenciaEuros: row.diferencia_euros,
      comensalesReales: row.comensales_reales || 0,
      comensalesReservados: row.comensales_reservados || 0,
      comensalesReservadosComida: row.comensales_reservados_comida || 0,
      comensalesReservadosCena: row.comensales_reservados_cena || 0,
      ticketComensal30d: row.ticket_comensal_30d || 0,
    }))
  } catch (error) {
    console.error("[v0] Error in fetchWeekRevenue:", error)
    return []
  }
}

export async function fetchBenchmarks(fechaInicio: string, fechaFin: string): Promise<BenchmarkResumen> {
  try {
    const { data, error } = await supabase.rpc("get_benchmarks_resumen", {
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin,
    })

    if (error) {
      console.error("[fetchBenchmarks] Error:", error)
      return {
        benchmarks: [],
        totales: {
          margen_operativo: 0,
          margen_operativo_euros: 0,
          margen_neto: 0,
          margen_neto_euros: 0,
          total_gastos: 0,
          total_ventas: 0,
        },
      }
    }

    // Separar benchmarks de totales
    const benchmarks: BenchmarkItem[] = []
    let margenOperativo = 0
    let margenOperativoEuros = 0
    let margenNeto = 0
    let margenNetoEuros = 0
    let totalGastos = 0
    let totalVentas = 0

    for (const row of data || []) {
      const etiqueta = row.benchmark || ""

      if (etiqueta === "_MARGEN_OPERATIVO") {
        margenOperativo = row.porcentaje || 0
        margenOperativoEuros = row.gasto || 0
      } else if (etiqueta === "_MARGEN_NETO") {
        margenNeto = row.porcentaje || 0
        margenNetoEuros = row.gasto || 0
      } else if (etiqueta === "_TOTAL_GASTOS") {
        totalGastos = row.gasto || 0
        totalVentas = row.ventas || 0
      } else if (etiqueta === "_TOTAL_OPERATIVO") {
        if (totalVentas === 0) {
          totalVentas = row.ventas || 0
        }
      } else if (etiqueta && !etiqueta.startsWith("_")) {
        benchmarks.push({
          etiqueta: etiqueta,
          gasto: row.gasto || 0,
          pagado: row.pagado || 0,
          pendiente: row.pendiente || 0,
          ventas: row.ventas || 0,
          porcentaje: row.porcentaje || 0,
          porcentaje_gastos: row.porcentaje_gastos || 0,
          min_sector: row.rango_min,
          max_sector: row.rango_max,
        })
      }
    }

    return {
      benchmarks,
      totales: {
        margen_operativo: margenOperativo,
        margen_operativo_euros: margenOperativoEuros,
        margen_neto: margenNeto,
        margen_neto_euros: margenNetoEuros,
        total_gastos: totalGastos,
        total_ventas: totalVentas,
      },
    }
  } catch (err) {
    console.error("[fetchBenchmarks] Exception:", err)
    return {
      benchmarks: [],
      totales: {
        margen_operativo: 0,
        margen_operativo_euros: 0,
        margen_neto: 0,
        margen_neto_euros: 0,
        total_gastos: 0,
        total_ventas: 0,
      },
    }
  }
}

export async function fetchPeriodComparisonData(
  startDay: number,
  startMonth: number,
  endDay: number,
  endMonth: number,
  yearA: number,
  yearB: number,
): Promise<{ yearA: PeriodComparisonAggregate; yearB: PeriodComparisonAggregate }> {
  // Construir fechas para cada año
  const startA = `${yearA}-${String(startMonth + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`
  const endA = `${yearA}-${String(endMonth + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`
  const startB = `${yearB}-${String(startMonth + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`
  const endB = `${yearB}-${String(endMonth + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`

  const [resultA, resultB] = await Promise.all([
    supabase
      .from("reservas_agregadas_diarias")
      .select(
        "fecha, total_reservas, total_comensales, reservas_comida, reservas_cena, comensales_comida, comensales_cena",
      )
      .gte("fecha", startA)
      .lte("fecha", endA),
    supabase
      .from("reservas_agregadas_diarias")
      .select(
        "fecha, total_reservas, total_comensales, reservas_comida, reservas_cena, comensales_comida, comensales_cena",
      )
      .gte("fecha", startB)
      .lte("fecha", endB),
  ])

  const aggregate = (data: any[] | null) => {
    if (!data || data.length === 0) {
      return {
        total_reservas: 0,
        total_comensales: 0,
        reservas_comida: 0,
        reservas_cena: 0,
        comensales_comida: 0,
        comensales_cena: 0,
        dias_operativos: 0,
      }
    }
    return data.reduce(
      (acc, row) => ({
        total_reservas: acc.total_reservas + (row.total_reservas || 0),
        total_comensales: acc.total_comensales + (row.total_comensales || 0),
        reservas_comida: acc.reservas_comida + (row.reservas_comida || 0),
        reservas_cena: acc.reservas_cena + (row.reservas_cena || 0),
        comensales_comida: acc.comensales_comida + (row.comensales_comida || 0),
        comensales_cena: acc.comensales_cena + (row.comensales_cena || 0),
        dias_operativos: acc.dias_operativos + 1,
      }),
      {
        total_reservas: 0,
        total_comensales: 0,
        reservas_comida: 0,
        reservas_cena: 0,
        comensales_comida: 0,
        comensales_cena: 0,
        dias_operativos: 0,
      },
    )
  }

  const resultAggA = aggregate(resultA.data)
  const resultAggB = aggregate(resultB.data)

  return {
    yearA: resultAggA,
    yearB: resultAggB,
  }
}

export const fetchPeriodComparison = fetchPeriodComparisonData

export async function fetchFoodCostProducts(): Promise<FoodCostSummary> {
  try {
    const { data, error } = await supabase.from("vw_food_cost").select("*").order("food_cost_pct", { ascending: false })

    if (error) {
      console.error("[fetchFoodCostProducts] Error:", error.message)
      return {
        productos: [],
        kpis: {
          food_cost_promedio: 0,
          total_productos: 0,
          productos_criticos: 0,
          productos_warning: 0,
          productos_ok: 0,
        },
        por_categoria: [],
      }
    }

    const productos: FoodCostProduct[] = (data || []).map((row: any) => ({
      sku: row.sku || "",
      variantId: row.variant_id ?? null,
      precioManual: row.precio_manual === true,
      producto: row.nombre_producto || "",
      categoria: row.categoria || "Sin categoría",
      tipo: row.tipo || "Comida",
      pvp: Number.parseFloat(row.pvp) || 0,
      pvp_neto: Number.parseFloat(row.pvp_neto) || 0,
      coste: Number.parseFloat(row.coste_escandallo) || 0,
      food_cost_pct: Number.parseFloat(row.food_cost_pct) || 0,
      food_cost_peor_pct: Number.parseFloat(row.food_cost_peor_pct) || 0,
      tiene_patatas: row.tiene_patatas === true,
      tiene_helado: row.tiene_helado === true,
      tiene_ensalada: row.tiene_ensalada === true,
    }))

    // Calcular KPIs
    const total_productos = productos.length
    const productos_criticos = productos.filter((p) => p.food_cost_pct > 30).length
    const productos_warning = productos.filter((p) => p.food_cost_pct >= 20 && p.food_cost_pct <= 30).length
    const productos_ok = productos.filter((p) => p.food_cost_pct < 20).length

    const food_cost_promedio =
      total_productos > 0 ? productos.reduce((sum, p) => sum + p.food_cost_pct, 0) / total_productos : 0

    // Agrupar por categoría
    const categoriasMap = new Map<string, { productos: number; sum_food_cost: number }>()
    productos.forEach((p) => {
      const cat = p.categoria
      if (!categoriasMap.has(cat)) {
        categoriasMap.set(cat, { productos: 0, sum_food_cost: 0 })
      }
      const entry = categoriasMap.get(cat)!
      entry.productos += 1
      entry.sum_food_cost += p.food_cost_pct
    })

    const por_categoria = Array.from(categoriasMap.entries()).map(([categoria, stats]) => ({
      categoria,
      productos: stats.productos,
      food_cost_promedio: stats.productos > 0 ? stats.sum_food_cost / stats.productos : 0,
    }))

    return {
      productos,
      kpis: {
        food_cost_promedio,
        total_productos,
        productos_criticos,
        productos_warning,
        productos_ok,
      },
      por_categoria,
    }
  } catch (err) {
    console.error("[fetchFoodCostProducts] Exception:", err)
    return {
      productos: [],
      kpis: {
        food_cost_promedio: 0,
        total_productos: 0,
        productos_criticos: 0,
        productos_warning: 0,
        productos_ok: 0,
      },
      por_categoria: [],
    }
  }
}

export async function updateManualPrice(
  sku: string,
  variantId: number | null,
  newPrice: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (variantId !== null) {
      // Es una variante
      const { error } = await supabase.rpc("update_variant_manual_price", {
        p_variant_id: variantId,
        p_manual_price: newPrice,
      })
      if (error) {
        console.error("[updateManualPrice] Error variante:", error.message)
        return { success: false, error: error.message }
      }
    } else {
      // Es un producto
      const { error } = await supabase.rpc("update_manual_price", {
        p_sku: sku,
        p_manual_price: newPrice,
      })
      if (error) {
        console.error("[updateManualPrice] Error producto:", error.message)
        return { success: false, error: error.message }
      }
    }
    return { success: true }
  } catch (err: any) {
    console.error("[updateManualPrice] Exception:", err)
    return { success: false, error: err.message || "Error desconocido" }
  }
}

export async function clearManualPrice(
  sku: string,
  variantId: number | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (variantId !== null) {
      // Es una variante - resetear a null
      const { error } = await supabase.rpc("update_variant_manual_price", {
        p_variant_id: variantId,
        p_manual_price: null,
      })
      if (error) {
        console.error("[clearManualPrice] Error variante:", error.message)
        return { success: false, error: error.message }
      }
    } else {
      // Es un producto
      const { error } = await supabase.rpc("clear_manual_price", {
        p_sku: sku,
      })
      if (error) {
        console.error("[clearManualPrice] Error producto:", error.message)
        return { success: false, error: error.message }
      }
    }
    return { success: true }
  } catch (err: any) {
    console.error("[clearManualPrice] Exception:", err)
    return { success: false, error: err.message || "Error desconocido" }
  }
}
