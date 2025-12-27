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
      case "/products":
        return await getProductsContext(pageName)
      case "/operations":
        return await getOperationsContext(pageName)
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

  const { data: dashboard } = await supabase
    .from("vw_dashboard_ventas_facturas_live")
    .select("*")
    .eq("fecha_negocio", today)
    .single()

  return {
    page: "/",
    pageName,
    summary: `Dashboard del día ${today}`,
    data: {
      fecha: today,
      ingresos_hoy: dashboard?.total_neto || 0,
      facturas_hoy: dashboard?.num_facturas || 0,
      comensales_hoy: dashboard?.comensales_facturados || 0,
      ticket_medio: dashboard?.ticket_medio || 0,
      total_tarjeta: dashboard?.total_tarjeta || 0,
      total_efectivo: dashboard?.total_efectivo || 0,
      iva_repercutido: dashboard?.iva_repercutido || 0,
    },
  }
}

async function getReservationsContext(pageName: string): Promise<AssistantContext> {
  const today = new Date().toISOString().split("T")[0]

  const { data: reservas } = await supabase
    .from("reservas_agregadas_diarias")
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
      comida_comensales: reservasHoy?.comida_comensales || 0,
      cena_comensales: reservasHoy?.cena_comensales || 0,
      proximos_7_dias:
        reservas?.map((r) => ({
          fecha: r.fecha,
          reservas: r.total_reservas,
          comensales: r.total_comensales,
          comida: r.comida_comensales,
          cena: r.cena_comensales,
        })) || [],
    },
  }
}

async function getRevenueContext(pageName: string): Promise<AssistantContext> {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const todayStr = today.toISOString().split("T")[0]

  const { data: ingresos } = await supabase
    .from("vw_dashboard_financiero")
    .select("*")
    .gte("fecha", startOfMonth)
    .lte("fecha", todayStr)
    .order("fecha", { ascending: false })

  const ingresosHoy = ingresos?.[0]
  const totalMes = ingresos?.reduce((sum, d) => sum + (d.ingresos_netos || 0), 0) || 0

  return {
    page: "/revenue",
    pageName,
    summary: `Ingresos del mes actual`,
    data: {
      ingresos_hoy: ingresosHoy?.ingresos_netos || 0,
      ticket_medio_hoy: ingresosHoy?.ticket_medio || 0,
      total_mes: totalMes,
      dias_facturados: ingresos?.length || 0,
      media_diaria: ingresos?.length ? totalMes / ingresos.length : 0,
      iva_mes: ingresos?.reduce((sum, d) => sum + (d.iva_repercutido || 0), 0) || 0,
    },
  }
}

async function getExpensesContext(pageName: string): Promise<AssistantContext> {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const todayStr = today.toISOString().split("T")[0]

  const { data: gastos } = await supabase
    .from("vw_gastos_agregados")
    .select("*")
    .gte("fecha", startOfMonth)
    .lte("fecha", todayStr)

  const totalGastos = gastos?.reduce((sum, g) => sum + (g.total_gasto || 0), 0) || 0
  const porCategoria =
    gastos?.reduce(
      (acc, g) => {
        const cat = g.categoria_nombre || "Sin categoría"
        acc[cat] = (acc[cat] || 0) + (g.total_gasto || 0)
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
      num_gastos: gastos?.length || 0,
    },
  }
}

async function getForecastingContext(pageName: string): Promise<AssistantContext> {
  const today = new Date().toISOString().split("T")[0]

  const { data: forecast } = await supabase.rpc("api_get_forecasting_context")

  const forecastData = forecast?.[0]?.api_get_forecasting_context || forecast?.[0] || {}

  return {
    page: "/forecasting",
    pageName,
    summary: `Predicciones desde ${today}`,
    data: {
      prediccion_hoy: forecastData.prediccion_ingresos_hoy || 0,
      reservas_confirmadas_hoy: forecastData.reservas_confirmadas_hoy || 0,
      ocupacion_prevista: forecastData.ocupacion_prevista || 0,
      tendencia_semana: forecastData.tendencia_semanal || "estable",
      precision_modelo: forecastData.precision_modelo || 0,
      comparativa_semana_anterior: forecastData.comparativa_semana_anterior || 0,
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

async function getProductsContext(pageName: string): Promise<AssistantContext> {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const todayStr = today.toISOString().split("T")[0]

  const { data: productos } = await supabase
    .from("vw_productos_ranking")
    .select("*")
    .gte("fecha", startOfMonth)
    .lte("fecha", todayStr)
    .order("total_vendido", { ascending: false })
    .limit(20)

  const totalVentas = productos?.reduce((sum, p) => sum + (p.total_vendido || 0), 0) || 0
  const totalUnidades = productos?.reduce((sum, p) => sum + (p.cantidad_vendida || 0), 0) || 0

  const porCategoria =
    productos?.reduce(
      (acc, p) => {
        const cat = p.categoria || "Sin categoría"
        acc[cat] = (acc[cat] || 0) + (p.total_vendido || 0)
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  return {
    page: "/products",
    pageName,
    summary: `Productos vendidos del mes actual`,
    data: {
      total_ventas_mes: totalVentas,
      total_unidades_mes: totalUnidades,
      productos_distintos: productos?.length || 0,
      top_5_productos:
        productos?.slice(0, 5).map((p) => ({
          nombre: p.producto_nombre,
          cantidad: p.cantidad_vendida,
          total: p.total_vendido,
        })) || [],
      ventas_por_categoria: porCategoria,
      categoria_mas_vendida: Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A",
    },
  }
}

async function getOperationsContext(pageName: string): Promise<AssistantContext> {
  const today = new Date().toISOString().split("T")[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const { data: operativa } = await supabase.rpc("get_operativa_kpis", {
    fecha_inicio: weekAgo,
    fecha_fin: today,
    filtro_tipo: null,
    filtro_categoria: null,
  })

  const totales =
    operativa?.reduce(
      (acc: any, d: any) => ({
        items_servidos: (acc.items_servidos || 0) + Number.parseInt(d.items_servidos || 0),
        items_comida: (acc.items_comida || 0) + Number.parseInt(d.items_comida || 0),
        items_bebida: (acc.items_bebida || 0) + Number.parseInt(d.items_bebida || 0),
        alertas_30min: (acc.alertas_30min || 0) + Number.parseInt(d.alertas_30min || 0),
        alertas_45min: (acc.alertas_45min || 0) + Number.parseInt(d.alertas_45min || 0),
      }),
      {},
    ) || {}

  const tiempoMedioCocina = operativa?.length
    ? operativa.reduce((sum: number, d: any) => sum + Number.parseFloat(d.tiempo_medio_cocina || 0), 0) /
      operativa.length
    : 0

  const tiempoMedioSala = operativa?.length
    ? operativa.reduce((sum: number, d: any) => sum + Number.parseFloat(d.tiempo_medio_sala || 0), 0) / operativa.length
    : 0

  return {
    page: "/operations",
    pageName,
    summary: `Operativa de los últimos 7 días`,
    data: {
      periodo: { desde: weekAgo, hasta: today },
      items_servidos_semana: totales.items_servidos || 0,
      items_comida: totales.items_comida || 0,
      items_bebida: totales.items_bebida || 0,
      tiempo_medio_cocina_min: tiempoMedioCocina.toFixed(1),
      tiempo_medio_sala_min: tiempoMedioSala.toFixed(1),
      alertas_30min: totales.alertas_30min || 0,
      alertas_45min: totales.alertas_45min || 0,
      detalle_diario: operativa || [],
    },
  }
}
