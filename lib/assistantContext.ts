import { supabase } from "./supabase"

// Tipos de contexto por página
export interface AssistantContext {
  page: string
  pageName: string
  summary: string
  data: Record<string, any>
}

// Chips sugeridos por página
export const ASSISTANT_CHIPS: Record<string, string[]> = {
  "/": ["¿Cómo vamos hoy?", "Resumen de la semana", "¿Qué tal el mes?", "Dame un insight rápido"],
  "/reservations": [
    "¿Cuántas reservas hay hoy?",
    "Ocupación del fin de semana",
    "¿Cómo va la semana?",
    "Comparar con semana anterior",
  ],
  "/revenue": [
    "¿Cuánto llevamos hoy?",
    "Ticket medio actual",
    "Comparar con mes anterior",
    "¿Cuál es nuestro mejor día?",
  ],
  "/expenses": [
    "¿En qué gastamos más?",
    "Gastos vs ingresos",
    "¿Qué proveedor es más caro?",
    "¿Cómo optimizar gastos?",
  ],
  "/products": [
    "¿Qué se vende más?",
    "Producto estrella del mes",
    "¿Qué categoría domina?",
    "Productos con bajo rendimiento",
  ],
  "/forecasting": [
    "¿Qué prevés para mañana?",
    "Predicción de la semana",
    "¿Qué precisión tiene el modelo?",
    "¿Cuándo será el próximo pico?",
  ],
  "/treasury": ["Estado de tesorería", "¿Cuánto hay en cuentas?", "Movimientos sin categorizar", "Balance del mes"],
  "/what-if": [
    "Simular día perfecto",
    "¿Qué pasa si subo precios?",
    "Escenario pesimista",
    "¿Cómo llegar a objetivos?",
  ],
  "/operations": ["Rendimiento del equipo", "Horas más productivas", "¿Cómo va el servicio?", "Comparar turnos"],
}

// Nombres amigables de las páginas
const PAGE_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/reservations": "Reservas",
  "/revenue": "Ingresos",
  "/expenses": "Gastos",
  "/products": "Productos",
  "/forecasting": "Forecasting",
  "/treasury": "Tesorería",
  "/what-if": "Simulador",
  "/operations": "Operaciones",
}

// Obtener contexto según la página actual
export async function getAssistantContext(currentPath: string): Promise<AssistantContext> {
  const pageName = PAGE_NAMES[currentPath] || "General"

  try {
    switch (currentPath) {
      case "/":
        return await getDashboardContext(pageName)
      case "/reservations":
        return await getReservationsContext(pageName)
      case "/revenue":
        return await getRevenueContext(pageName)
      case "/expenses":
        return await getExpensesContext(pageName)
      case "/forecasting":
        return await getForecastingContext(pageName)
      case "/treasury":
        return await getTreasuryContext(pageName)
      default:
        return {
          page: currentPath,
          pageName,
          summary: `Usuario en la sección ${pageName}`,
          data: {},
        }
    }
  } catch (error) {
    console.error("Error getting assistant context:", error)
    return {
      page: currentPath,
      pageName,
      summary: `Usuario en la sección ${pageName}`,
      data: {},
    }
  }
}

async function getDashboardContext(pageName: string): Promise<AssistantContext> {
  const today = new Date().toISOString().split("T")[0]

  // Obtener KPIs del dashboard
  const { data: kpis } = await supabase.from("kpis_dashboard").select("*").eq("fecha", today).single()

  return {
    page: "/",
    pageName,
    summary: `Dashboard del día ${today}`,
    data: {
      fecha: today,
      ingresos_hoy: kpis?.ingresos_totales || 0,
      reservas_hoy: kpis?.reservas_totales || 0,
      comensales_hoy: kpis?.comensales_totales || 0,
      ticket_medio: kpis?.ticket_medio || 0,
      ocupacion: kpis?.ocupacion_porcentaje || 0,
    },
  }
}

async function getReservationsContext(pageName: string): Promise<AssistantContext> {
  const today = new Date().toISOString().split("T")[0]

  const { data: reservas } = await supabase
    .from("reservas_agregadas")
    .select("*")
    .gte("fecha", today)
    .order("fecha", { ascending: true })
    .limit(7)

  const reservasHoy = reservas?.find((r) => r.fecha === today)

  return {
    page: "/reservations",
    pageName,
    summary: `Reservas desde ${today}`,
    data: {
      reservas_hoy: reservasHoy?.total_reservas || 0,
      comensales_hoy: reservasHoy?.total_comensales || 0,
      ocupacion_hoy: reservasHoy?.ocupacion_porcentaje || 0,
      proximos_7_dias:
        reservas?.map((r) => ({
          fecha: r.fecha,
          reservas: r.total_reservas,
          comensales: r.total_comensales,
        })) || [],
    },
  }
}

async function getRevenueContext(pageName: string): Promise<AssistantContext> {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const todayStr = today.toISOString().split("T")[0]

  const { data: ingresos } = await supabase
    .from("ingresos_diarios")
    .select("*")
    .gte("fecha", startOfMonth)
    .lte("fecha", todayStr)
    .order("fecha", { ascending: false })

  const ingresosHoy = ingresos?.[0]
  const totalMes = ingresos?.reduce((sum, d) => sum + (d.ingresos_totales || 0), 0) || 0

  return {
    page: "/revenue",
    pageName,
    summary: `Ingresos del mes actual`,
    data: {
      ingresos_hoy: ingresosHoy?.ingresos_totales || 0,
      ticket_medio_hoy: ingresosHoy?.ticket_medio || 0,
      total_mes: totalMes,
      dias_facturados: ingresos?.length || 0,
      media_diaria: ingresos?.length ? totalMes / ingresos.length : 0,
    },
  }
}

async function getExpensesContext(pageName: string): Promise<AssistantContext> {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const todayStr = today.toISOString().split("T")[0]

  const { data: gastos } = await supabase
    .from("gastos_por_categoria")
    .select("*")
    .gte("fecha", startOfMonth)
    .lte("fecha", todayStr)

  const totalGastos = gastos?.reduce((sum, g) => sum + (g.total || 0), 0) || 0
  const porCategoria =
    gastos?.reduce(
      (acc, g) => {
        acc[g.categoria] = (acc[g.categoria] || 0) + g.total
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  return {
    page: "/expenses",
    pageName,
    summary: `Gastos del mes actual`,
    data: {
      total_gastos_mes: totalGastos,
      por_categoria: porCategoria,
      categoria_mayor_gasto: Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A",
    },
  }
}

async function getForecastingContext(pageName: string): Promise<AssistantContext> {
  const today = new Date().toISOString().split("T")[0]

  const { data: forecast } = await supabase.rpc("get_forecast_kpis")

  return {
    page: "/forecasting",
    pageName,
    summary: `Predicciones desde ${today}`,
    data: {
      prediccion_hoy: forecast?.prediccion_hoy || 0,
      reservas_confirmadas_hoy: forecast?.reservas_hoy || 0,
      ocupacion_semana: forecast?.ocupacion_semana || 0,
      precision_modelo: forecast?.precision_modelo || 0,
    },
  }
}

async function getTreasuryContext(pageName: string): Promise<AssistantContext> {
  const { data: kpis } = await supabase.rpc("get_treasury_kpis")
  const { data: accounts } = await supabase.rpc("get_treasury_accounts")

  return {
    page: "/treasury",
    pageName,
    summary: `Estado de tesorería`,
    data: {
      saldo_total: kpis?.saldo_total || 0,
      ingresos_mes: kpis?.ingresos_mes || 0,
      gastos_mes: kpis?.gastos_mes || 0,
      sin_categorizar: kpis?.num_sin_categorizar || 0,
      cuentas:
        accounts?.map((a: any) => ({
          nombre: a.nombre_cuenta,
          saldo: a.saldo_actual,
        })) || [],
    },
  }
}
