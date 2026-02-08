import type {
  DailyCompleteMetrics,
  ShiftMetrics,
  SalesBreakdown,
  SalesItem,
  CategorySales,
  ExpenseStats,
  Invoice,
  TableSales,
  ForecastDay,
  ForecastKPIs,
  ForecastHistorico,
  ForecastPrecision,
} from "../types"
import { MOCK_DATA_DELAY } from "../constants"

// --- CAPACITY CONSTANTS (duplicated from dataService for mock use) ---
const CAPACITY_LUNCH = 66
const CAPACITY_DINNER = 66

// --- HELPER FOR LOCAL ISO STRING (duplicated from dataService for mock use) ---
const toLocalISOString = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0")
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${pad(month)}-${pad(day)}`
}

// --- SMART TABLES LIST ---
export const SMART_TABLES = [...Array.from({ length: 18 }, (_, i) => `Smart Table ${i + 1}`), "Smart Table Demo 1"]

// --- MOCK PRODUCTS ---
// Expanded to 6 Categories as requested
export const CATEGORIES = ["Entrantes", "Principales", "Postres", "Bebidas", "Vinos", "Cócteles"]
export const PRODUCTS_DB = [
  { name: "Croquetas Jamón", cat: "Entrantes", price: 12 },
  { name: "Ensalada Burrata", cat: "Entrantes", price: 16 },
  { name: "Tartar Atún", cat: "Entrantes", price: 22 },
  { name: "Pulpo Brasa", cat: "Entrantes", price: 24 },

  { name: "Solomillo Vaca", cat: "Principales", price: 28 },
  { name: "Rodaballo", cat: "Principales", price: 32 },
  { name: "Arroz Negro", cat: "Principales", price: 24 },
  { name: "Burger Gourmet", cat: "Principales", price: 18 },
  { name: "Tataki Salmón", cat: "Principales", price: 26 },

  { name: "Tarta Queso", cat: "Postres", price: 9 },
  { name: "Coulant Choco", cat: "Postres", price: 10 },
  { name: "Torrija Brioche", cat: "Postres", price: 9 },

  { name: "Agua", cat: "Bebidas", price: 3 },
  { name: "Coca Cola", cat: "Bebidas", price: 4 },
  { name: "Cerveza Artesana", cat: "Bebidas", price: 5 },

  { name: "Ribera Duero (Copa)", cat: "Vinos", price: 6 },
  { name: "Rioja Reserva (Bot)", cat: "Vinos", price: 35 },
  { name: "Albariño (Bot)", cat: "Vinos", price: 28 },

  { name: "Mojito", cat: "Cócteles", price: 12 },
  { name: "Espresso Martini", cat: "Cócteles", price: 14 },
  { name: "Negroni", cat: "Cócteles", price: 12 },
  { name: "Moscow Mule", cat: "Cócteles", price: 13 },
]

// --- MOCK PROVIDERS FOR INVOICES ---
export const PROVIDERS_DB = [
  { name: "Makro Distribución", cat: "Materia Prima (COGS)" },
  { name: "Estrella Damm", cat: "Materia Prima (COGS)" },
  { name: "Endesa Energía", cat: "Alquiler & Suministros" },
  { name: "Frutas Hermanos", cat: "Materia Prima (COGS)" },
  { name: "Carnes Selectas", cat: "Materia Prima (COGS)" },
  { name: "Seguros Mapfre", cat: "Alquiler & Suministros" },
  { name: "Gestoría Fiscal", cat: "Marketing & Otros" },
  { name: "Bodegas Torres", cat: "Materia Prima (COGS)" },
  { name: "Publicidad Meta", cat: "Marketing & Otros" },
]

export const generateSalesData = (revenueTarget: number): SalesBreakdown => {
  // Generate random sales to roughly match revenue target
  let currentRevenue = 0
  const items: SalesItem[] = []
  const itemsMap = new Map<string, SalesItem>()

  while (currentRevenue < revenueTarget * 0.9) {
    const prod = PRODUCTS_DB[Math.floor(Math.random() * PRODUCTS_DB.length)]
    const qty = Math.floor(Math.random() * 3) + 1
    const itemRev = prod.price * qty

    currentRevenue += itemRev

    if (itemsMap.has(prod.name)) {
      const existing = itemsMap.get(prod.name)!
      existing.quantity += qty
      existing.revenue += itemRev
    } else {
      itemsMap.set(prod.name, {
        id: prod.name,
        name: prod.name,
        category: prod.cat,
        quantity: qty,
        revenue: itemRev,
      })
    }
  }

  const all_products = Array.from(itemsMap.values())

  const catsMap = new Map<string, CategorySales>()
  all_products.forEach((item) => {
    if (catsMap.has(item.category)) {
      const c = catsMap.get(item.category)!
      c.quantity += item.quantity
      c.revenue += item.revenue
    } else {
      catsMap.set(item.category, { name: item.category, quantity: item.quantity, revenue: item.revenue })
    }
  })

  const categories = Array.from(catsMap.values()).sort((a, b) => b.revenue - a.revenue)
  const top_products = [...all_products].sort((a, b) => b.quantity - a.quantity)

  const totalItems = all_products.reduce((acc, i) => acc + i.quantity, 0)
  const itemsWithOptionsCapability = Math.floor(totalItems * 0.4)
  const with_options = Math.floor(itemsWithOptionsCapability * (0.3 + Math.random() * 0.4))
  const without_options = itemsWithOptionsCapability - with_options

  return {
    categories,
    top_products,
    all_products,
    modifiers: { with_options, without_options, total_items: itemsWithOptionsCapability },
  }
}

export const generateExpenses = (revenue: number): ExpenseStats => {
  // Ratios typical for restaurants
  const COGS_RATIO = 0.3 + (Math.random() * 0.05 - 0.025) // ~30%
  const LABOR_RATIO = 0.32 + (Math.random() * 0.05 - 0.025) // ~32%
  const RENT_DAILY = 200 // Fixed
  const MARKETING_RATIO = 0.05 // ~5%

  const cogs = revenue * COGS_RATIO
  const labor = revenue * LABOR_RATIO
  const marketing = revenue * MARKETING_RATIO

  const total = cogs + labor + RENT_DAILY + marketing

  // Status Simulation
  // Most paid, some overdue (randomly)
  const overdueChance = Math.random()
  let overdue = 0
  let pending = 0
  let paid = 0

  if (overdueChance > 0.9) {
    overdue = total * (0.1 + Math.random() * 0.2) // 10-30% overdue
  }
  if (Math.random() > 0.7) {
    pending = total * (0.05 + Math.random() * 0.15)
  }

  paid = total - overdue - pending

  return {
    total,
    paid,
    overdue,
    pending,
    by_category: {
      "Materia Prima (COGS)": cogs,
      Personal: labor,
      "Alquiler & Suministros": RENT_DAILY,
      "Marketing & Otros": marketing,
    },
  }
}

// Helper to distribute revenue among specific tables
export const generateTableSales = (revenue: number): TableSales[] => {
  // Assign random weights to each table
  const weights = SMART_TABLES.map(() => Math.random())
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  // Distribute revenue based on weights
  return SMART_TABLES.map((name, index) => ({
    id: name,
    name: name,
    revenue: (weights[index] / totalWeight) * revenue,
  })).sort((a, b) => b.revenue - a.revenue)
}

// Helper to generate a single shift
export const generateShift = (basePax: number, type: "LUNCH" | "DINNER"): ShiftMetrics => {
  const capacity = 66
  const pax = Math.min(Math.max(0, basePax + Math.floor(Math.random() * 20 - 10)), capacity + 5)
  const avgPaxPerRes = type === "DINNER" ? 3.2 : 2.8
  const reservations = Math.max(1, Math.round(pax / avgPaxPerRes))
  const tables = Math.max(1, Math.round(reservations * 0.9))
  const avgPaxPerTable = tables > 0 ? Number.parseFloat((pax / tables).toFixed(2)) : 0

  const ticketPerPax = type === "DINNER" ? 65 : 45
  const revenue = pax * (ticketPerPax + Math.random() * 10)
  const tips = revenue * (0.05 + Math.random() * 0.07)
  const transactions = Math.max(1, Math.round(tables * 1.1))
  const avg_ticket_transaction = Number.parseFloat((revenue / transactions).toFixed(2))

  // Calculate how many tips were left (roughly 40-70% of transactions)
  const tips_count = Math.round(transactions * (0.4 + Math.random() * 0.3))

  const cardPct = 0.75 + Math.random() * 0.15
  const cashPct = 0.1 + Math.random() * 0.05
  const card = revenue * cardPct
  const cash = revenue * cashPct
  const digital = revenue - card - cash

  const occupancy_rate = Number.parseFloat(((pax / capacity) * 100).toFixed(1))

  const sales_data = generateSalesData(revenue)
  const expenses = generateExpenses(revenue)
  const tables_breakdown = generateTableSales(revenue)

  // Simulate VeriFactu Breakdown
  // 95% Success, 4% Error, 1% Pending
  const vPending = Math.round(transactions * (0.01 + Math.random() * 0.05))
  const vError = Math.random() > 0.9 ? Math.floor(Math.random() * 2) : 0 // Only occasional errors
  const vSuccess = Math.max(0, transactions - vPending - vError)

  return {
    reservations,
    pax,
    tables,
    occupancy_rate,
    avg_pax_per_res: Number.parseFloat((pax / reservations).toFixed(2)) || 0,
    avg_pax_per_table: avgPaxPerTable,
    revenue,
    tips,
    tips_count,
    transactions,
    avg_ticket_transaction,
    avg_ticket_pax: Number.parseFloat((revenue / pax).toFixed(2)) || 0,
    avg_ticket_res: Number.parseFloat((revenue / reservations).toFixed(2)) || 0,
    avg_ticket_table: Number.parseFloat((revenue / tables).toFixed(2)) || 0,
    payment_methods: { card, cash, digital },
    sales_data,
    expenses,
    tables_breakdown,
    verifactu_metrics: {
      success: vSuccess,
      error: vError,
      pending: vPending,
    },
    // Added missing fields that might be present in more recent versions or expected by consumers
    tables_used: 0,
    table_rotation: 0,
    avg_pax_per_table_used: 0,
  }
}

export const generateMockHistory = (days: number): DailyCompleteMetrics[] => {
  const data: DailyCompleteMetrics[] = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
    const isMonday = dayOfWeek === 1

    const baseLunch = isWeekend ? 100 : isMonday ? 30 : 60
    const baseDinner = isWeekend ? 170 : isMonday ? 50 : 100

    const lunch = generateShift(baseLunch, "LUNCH")
    const dinner = generateShift(baseDinner, "DINNER")

    const totalPax = lunch.pax + dinner.pax
    const totalCapacity = 132
    const totalRevenue = lunch.revenue + dinner.revenue
    const totalTransactions = lunch.transactions + dinner.transactions
    const totalReservations = lunch.reservations + dinner.reservations
    const totalTables = lunch.tables + dinner.tables

    const totalSalesData = { ...lunch.sales_data } // Simplified

    // Aggregate Expenses for Daily Total
    const totalExpenses: ExpenseStats = {
      total: lunch.expenses.total + dinner.expenses.total,
      paid: lunch.expenses.paid + dinner.expenses.paid,
      overdue: lunch.expenses.overdue + dinner.expenses.overdue,
      pending: lunch.expenses.pending + dinner.expenses.pending,
      by_category: {},
    }
    // Merge categories
    Object.keys(lunch.expenses.by_category).forEach((cat) => {
      totalExpenses.by_category[cat] = (lunch.expenses.by_category[cat] || 0) + (dinner.expenses.by_category[cat] || 0)
    })

    // Aggregate Tables
    const tableMap = new Map<string, number>()
      ;[...lunch.tables_breakdown, ...dinner.tables_breakdown].forEach((t) => {
        tableMap.set(t.id, (tableMap.get(t.id) || 0) + t.revenue)
      })
    const totalTablesBreakdown: TableSales[] = Array.from(tableMap.entries())
      .map(([id, rev]) => ({
        id,
        name: id,
        revenue: rev,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const dataPoint: DailyCompleteMetrics = {
      date: dateStr,
      lunch,
      dinner,
      total: {
        reservations: totalReservations,
        pax: totalPax,
        tables: CAPACITY_LUNCH + CAPACITY_DINNER, // Total theoretical tables
        occupancy_rate: Number.parseFloat(((totalPax / totalCapacity) * 100).toFixed(1)),
        revenue: totalRevenue,
        tips: lunch.tips + dinner.tips,
        tips_count: lunch.tips_count + dinner.tips_count,
        transactions: totalTransactions,
        avg_ticket_transaction:
          lunch.transactions + dinner.transactions ? totalRevenue / (lunch.transactions + dinner.transactions) : 0,
        avg_pax_per_res: totalReservations ? Number.parseFloat((totalPax / totalReservations).toFixed(2)) : 0,
        avg_pax_per_table: totalTables ? Number.parseFloat((totalPax / totalTables).toFixed(2)) : 0, // Rough approx
        avg_ticket_pax: totalPax ? Number.parseFloat((totalRevenue / totalPax).toFixed(2)) : 0,
        avg_ticket_res: totalReservations ? Number.parseFloat((totalRevenue / totalReservations).toFixed(2)) : 0,
        avg_ticket_table: totalTables ? Number.parseFloat((totalRevenue / totalTables).toFixed(2)) : 0,
        payment_methods: {
          card: lunch.payment_methods.card + dinner.payment_methods.card,
          cash: lunch.payment_methods.cash + dinner.payment_methods.cash,
          digital: lunch.payment_methods.digital + dinner.payment_methods.digital,
        },
        sales_data: totalSalesData,
        expenses: totalExpenses,
        tables_breakdown: totalTablesBreakdown,
        verifactu_metrics: {
          success: lunch.verifactu_metrics.success + dinner.verifactu_metrics.success,
          error: lunch.verifactu_metrics.error + dinner.verifactu_metrics.error,
          pending: lunch.verifactu_metrics.pending + dinner.verifactu_metrics.pending,
        },
        // Added missing fields from the mock shift structure
        tables_used: CAPACITY_LUNCH + CAPACITY_DINNER, // Mock total theoretical capacity
        table_rotation: 0, // Mock value, would be calculated from DB
        avg_pax_per_table_used: 0, // Mock value, would be calculated from DB
      },
    }
    data.push(dataPoint)
  }
  return data.reverse()
}

export const mockHistory = generateMockHistory(400)

export const fetchHistoryRange = async (startDate: Date, endDate: Date): Promise<DailyCompleteMetrics[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const start = new Date(startDate.toISOString().split("T")[0])
      const end = new Date(endDate.toISOString().split("T")[0])
      const filtered = mockHistory.filter((d) => {
        const dDate = new Date(d.date)
        return dDate >= start && dDate <= end
      })
      resolve(filtered)
    }, MOCK_DATA_DELAY)
  })
}

// --- HELPER FOR DASHBOARD FINANCIAL CHART ---
export const fetchFinancialHistory = async (
  period: "week" | "month" | "quarter" | "year",
): Promise<{ date: string; income: number; expenses: number }[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const days = period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 365
      // Slice mock history
      const slice = mockHistory.slice(Math.max(mockHistory.length - days, 0))

      // Map to simple structure
      // If 'year', we might want to aggregate by month, but for simplicity, let's return daily points for now
      // or aggregate by week if it is too dense.

      const result = slice.map((d) => ({
        date: d.date,
        income: d.total.revenue,
        expenses: d.total.expenses.total,
      }))

      // If Year/Quarter, aggregate to reduce points
      if (period === "year" || period === "quarter") {
        const aggregated: { date: string; income: number; expenses: number }[] = []
        // Group by Month (YYYY-MM)
        const map = new Map<string, { income: number; expenses: number }>()

        result.forEach((r) => {
          const month = r.date.substring(0, 7) // YYYY-MM
          if (!map.has(month)) map.set(month, { income: 0, expenses: 0 })
          const e = map.get(month)!
          e.income += r.income
          e.expenses += r.expenses
        })

        Array.from(map.entries()).forEach(([month, val]) => {
          aggregated.push({ date: month, income: val.income, expenses: val.expenses })
        })
        resolve(aggregated)
      } else {
        resolve(result)
      }
    }, MOCK_DATA_DELAY)
  })
}

export const fetchUpcomingInvoices = async (days: number): Promise<Invoice[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const invoices: Invoice[] = []
      const today = new Date()

      // Generate roughly 1 invoice per day of future
      const count = days + Math.floor(Math.random() * 5)

      for (let i = 0; i < count; i++) {
        const provider = PROVIDERS_DB[Math.floor(Math.random() * PROVIDERS_DB.length)]
        const amount = 50 + Math.random() * 1500

        const date = new Date(today)
        date.setDate(today.getDate() + Math.floor(Math.random() * days))

        invoices.push({
          id: `INV-${1000 + i}`,
          provider: provider.name,
          category: provider.cat,
          amount: Number.parseFloat(amount.toFixed(2)),
          dueDate: date.toISOString().split("T")[0],
        })
      }
      resolve(invoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
    }, 400)
  })
}

// --- FORECAST MOCK GENERATORS ---

// Helper function to generate mock forecast data when DB is empty (7-day view)
export function generateMockForecastData(
  today: Date,
  todayStr: string,
): {
  kpis: ForecastKPIs
  proximos7dias: ForecastDay[]
  precision: ForecastPrecision
} {
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

  const proximos7dias: ForecastDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const diaSemana = date.getDay()
    const esFinDeSemana = diaSemana === 0 || diaSemana === 5 || diaSemana === 6

    const basePrediccion = esFinDeSemana ? 140 : 90
    const prediccion = basePrediccion + Math.floor(Math.random() * 30) - 15
    const reservasActuales = Math.floor(prediccion * (0.4 + Math.random() * 0.3))

    proximos7dias.push({
      fecha: toLocalISOString(date),
      nombre_dia: diasSemana[diaSemana],
      mes: date.getMonth() + 1,
      comensales_real: reservasActuales,
      comensales_comida_real: Math.floor(reservasActuales * 0.4),
      comensales_cena_real: Math.floor(reservasActuales * 0.6),
      comensales_prediccion: prediccion,
      comensales_comida_pred: Math.floor(prediccion * 0.4),
      comensales_cena_pred: Math.floor(prediccion * 0.6),
      ventas_prediccion: prediccion * 25,
      confianza_prediccion: 0.7 + Math.random() * 0.25,
      error_prediccion: null,
      error_porcentaje: null,
      nivel_lluvia: ["sin_lluvia", "llovizna", "lluvia_ligera"][Math.floor(Math.random() * 3)],
      temp_max: 18 + Math.floor(Math.random() * 10),
      es_festivo: false,
      evento_principal: null,
      comensales_semana_ant: Math.floor(prediccion * (0.8 + Math.random() * 0.4)),
      comensales_año_ant: Math.floor(prediccion * (0.7 + Math.random() * 0.6)),
      tipo_fecha: i === 0 ? "hoy" : "futuro",
      // Mock capacity and occupancy
      capacidad_turno: 66,
      capacidad_dia: 132,
      capacidad_mesas: 19,
      ocupacion_pct_prediccion: (prediccion / 132) * 100,
      ocupacion_pct_comida_pred: (Math.floor(prediccion * 0.4) / 66) * 100,
      ocupacion_pct_cena_pred: (Math.floor(prediccion * 0.6) / 66) * 100,
      ocupacion_pct_real: (reservasActuales / 132) * 100,
      ocupacion_pct_comida_real: (Math.floor(reservasActuales * 0.4) / 66) * 100,
      ocupacion_pct_cena_real: (Math.floor(reservasActuales * 0.6) / 66) * 100,
      nivel_ocupacion: "normal",
    })
  }

  // Generate mock historical data
  const historico: ForecastHistorico[] = []
  for (let i = 28; i > 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const prediccion = 80 + Math.floor(Math.random() * 60)
    const real = prediccion + Math.floor(Math.random() * 30) - 15
    const diferencia = real - prediccion
    historico.push({
      fecha: toLocalISOString(date),
      prediccion,
      real,
      diferencia,
      error_pct: Math.abs((diferencia / prediccion) * 100),
    })
  }

  const errores = historico.map((h) => h.error_pct)
  const precisionMedia = 100 - errores.reduce((a, b) => a + b, 0) / errores.length
  const mejorDia = historico.reduce((a, b) => (a.error_pct < b.error_pct ? a : b))
  const peorDia = historico.reduce((a, b) => (a.error_pct > b.error_pct ? a : b))

  const hoy = proximos7dias[0]
  const ocupacionSemana = Math.floor((proximos7dias.reduce((a, b) => a + b.comensales_prediccion, 0) / 7 / 132) * 100)

  return {
    kpis: {
      prediccion_hoy: hoy?.comensales_prediccion || 0,
      reservas_hoy: hoy?.comensales_real || 0,
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

// Helper function to generate mock forecast calendar data when DB is empty (full month view)
export function generateMockForecastCalendar(year: number, month: number, today: Date): ForecastDay[] {
  const endDate = new Date(year, month, 0)
  const days: ForecastDay[] = []
  const daysInMonth = endDate.getDate()
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const diaSemana = date.getDay()
    const esFinDeSemana = diaSemana === 0 || diaSemana === 5 || diaSemana === 6
    const esPasado = date < today
    const esHoy = date.toDateString() === today.toDateString()

    const basePrediccion = esFinDeSemana ? 140 : 90
    const prediccion = basePrediccion + Math.floor(Math.random() * 30) - 15
    const reservasActuales = esPasado
      ? Math.floor(prediccion * (0.8 + Math.random() * 0.2))
      : Math.floor(prediccion * (0.3 + Math.random() * 0.4))

    const capacidadDia = 132
    const ocupacionPct = (prediccion / capacidadDia) * 100
    const nivelOcupacion =
      ocupacionPct < 25 ? "tranquilo" : ocupacionPct < 50 ? "normal" : ocupacionPct < 75 ? "fuerte" : "pico"

    days.push({
      fecha: toLocalISOString(date),
      nombre_dia: diasSemana[diaSemana],
      mes: month,
      comensales_real: reservasActuales,
      comensales_comida_real: Math.floor(reservasActuales * 0.4),
      comensales_cena_real: Math.floor(reservasActuales * 0.6),
      comensales_prediccion: prediccion,
      comensales_comida_pred: Math.floor(prediccion * 0.4),
      comensales_cena_pred: Math.floor(prediccion * 0.6),
      ventas_prediccion: prediccion * 25,
      confianza_prediccion: 0.7 + Math.random() * 0.25,
      capacidad_turno: 66,
      capacidad_dia: 132,
      capacidad_mesas: 19,
      ocupacion_pct_prediccion: ocupacionPct,
      ocupacion_pct_comida_pred: (Math.floor(prediccion * 0.4) / 66) * 100,
      ocupacion_pct_cena_pred: (Math.floor(prediccion * 0.6) / 66) * 100,
      ocupacion_pct_real: (reservasActuales / capacidadDia) * 100,
      ocupacion_pct_comida_real: (Math.floor(reservasActuales * 0.4) / 66) * 100,
      ocupacion_pct_cena_real: (Math.floor(reservasActuales * 0.6) / 66) * 100,
      nivel_ocupacion: nivelOcupacion,
      error_prediccion: esPasado ? reservasActuales - prediccion : null,
      error_porcentaje: esPasado ? ((reservasActuales - prediccion) / prediccion) * 100 : null,
      nivel_lluvia: "sin_lluvia",
      temp_max: 18 + Math.floor(Math.random() * 10),
      es_festivo: false,
      evento_principal: null,
      comensales_semana_ant: null,
      comensales_año_ant: null,
      tipo_fecha: esPasado ? "pasado" : esHoy ? "hoy" : "futuro",
    })
  }
  return days
}
