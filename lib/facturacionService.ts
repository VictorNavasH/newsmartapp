import { supabase } from "@/lib/supabase"
import type {
  FacturacionResumenGlobal,
  FacturacionListadoItem,
  FacturacionCuadreDiario,
  FacturacionTipoIngreso,
  FacturacionAlerta,
  FacturacionMensual,
  CuadreListadoItem,
  FacturaZReport,
  ZReportDisponible,
  FacturaHuerfana,
  FacturaAdyacente,
  AjusteCuadre,
  CrearAjusteParams,
} from "@/types"

export async function fetchFacturacionResumen(): Promise<FacturacionResumenGlobal | null> {
  const { data, error } = await supabase.from("v_facturacion_resumen_global").select("*").single()

  if (error) {
    console.error("Error fetching facturacion resumen:", error)
    return null
  }

  return data
}

export async function fetchFacturacionListado(
  startDate?: string,
  endDate?: string,
  filters?: {
    metodoPago?: string
    verifactuEstado?: string
    searchTerm?: string
  },
  pagination?: {
    page: number
    pageSize: number
  },
): Promise<{ data: FacturacionListadoItem[]; count: number }> {
  const page = pagination?.page || 1
  const pageSize = pagination?.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("v_facturas_listado")
    .select("*", { count: "exact" })
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })

  if (startDate) {
    query = query.gte("fecha", startDate)
  }
  if (endDate) {
    query = query.lte("fecha", endDate)
  }
  if (filters?.metodoPago && filters.metodoPago !== "all") {
    query = query.eq("metodo_pago", filters.metodoPago)
  }
  if (filters?.verifactuEstado && filters.verifactuEstado !== "all") {
    query = query.eq("verifactu_estado", filters.verifactuEstado)
  }
  if (filters?.searchTerm) {
    query = query.or(`numero_completo.ilike.%${filters.searchTerm}%,mesa.ilike.%${filters.searchTerm}%`)
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching facturacion listado:", error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

export async function fetchFacturacionKPIs(
  startDate: string,
  endDate: string,
): Promise<{
  total_facturado: number
  total_tarjeta: number
  total_efectivo: number
  num_facturas: number
  ticket_medio: number
  base_imponible: number
  iva_total: number
  verifactu_ok: number
  verifactu_error: number
  verifactu_pendiente: number
}> {
  const { data, error } = await supabase
    .from("v_facturas_listado")
    .select("importe_total, base_imponible, iva, metodo_pago, metodo_pago_nombre, verifactu_estado")
    .gte("fecha", startDate)
    .lte("fecha", endDate)

  if (error || !data) {
    console.error("Error fetching facturacion KPIs:", error)
    return {
      total_facturado: 0,
      total_tarjeta: 0,
      total_efectivo: 0,
      num_facturas: 0,
      ticket_medio: 0,
      base_imponible: 0,
      iva_total: 0,
      verifactu_ok: 0,
      verifactu_error: 0,
      verifactu_pendiente: 0,
    }
  }

  const total_facturado = data.reduce((sum, f) => sum + (f.importe_total || 0), 0)
  const base_imponible = data.reduce((sum, f) => sum + (f.base_imponible || 0), 0)
  const iva_total = data.reduce((sum, f) => sum + (f.iva || 0), 0)
  const total_tarjeta = data
    .filter(
      (f) =>
        f.metodo_pago === "card" ||
        f.metodo_pago === "tarjeta" ||
        f.metodo_pago_nombre?.toLowerCase().includes("tarjeta"),
    )
    .reduce((sum, f) => sum + (f.importe_total || 0), 0)
  const total_efectivo = data
    .filter(
      (f) =>
        f.metodo_pago === "cash" ||
        f.metodo_pago === "efectivo" ||
        f.metodo_pago_nombre?.toLowerCase().includes("efectivo"),
    )
    .reduce((sum, f) => sum + (f.importe_total || 0), 0)
  const num_facturas = data.length
  const ticket_medio = num_facturas > 0 ? total_facturado / num_facturas : 0
  const verifactu_ok = data.filter((f) => f.verifactu_estado === "accepted").length
  const verifactu_error = data.filter((f) => f.verifactu_estado === "rejected").length
  const verifactu_pendiente = data.filter(
    (f) => f.verifactu_estado === "waiting_for_response" || f.verifactu_estado === "not_sent",
  ).length

  return {
    total_facturado,
    total_tarjeta,
    total_efectivo,
    num_facturas,
    ticket_medio,
    base_imponible,
    iva_total,
    verifactu_ok,
    verifactu_error,
    verifactu_pendiente,
  }
}

export async function fetchCuadreDiario(startDate?: string, endDate?: string): Promise<FacturacionCuadreDiario[]> {
  let query = supabase.from("v_facturas_cuadre_diario").select("*").order("fecha", { ascending: false })

  if (startDate) {
    query = query.gte("fecha", startDate)
  }
  if (endDate) {
    query = query.lte("fecha", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching cuadre diario:", error)
    return []
  }

  return data || []
}

export async function fetchTiposIngreso(): Promise<FacturacionTipoIngreso[]> {
  const { data, error } = await supabase
    .from("v_ingresos_por_categoria")
    .select("*")
    .order("total", { ascending: false })

  if (error) {
    console.error("Error fetching tipos ingreso:", error)
    return []
  }

  return data || []
}

export async function fetchFacturacionAlertas(): Promise<FacturacionAlerta[]> {
  const { data, error } = await supabase
    .from("v_facturas_alertas")
    .select("*")
    .order("fecha_alerta", { ascending: false })

  if (error) {
    console.error("Error fetching alertas:", error)
    return []
  }

  return data || []
}

export async function fetchFacturacionMensual(): Promise<FacturacionMensual[]> {
  const { data, error } = await supabase
    .from("v_facturacion_mensual")
    .select("*")
    .order("mes", { ascending: false })
    .limit(12)

  if (error) {
    console.error("Error fetching facturacion mensual:", error)
    return []
  }

  return data || []
}

export async function resolverAlerta(alertaId: string, usuario: string): Promise<boolean> {
  const { error } = await supabase
    .from("facturacion_alertas")
    .update({
      resuelta: true,
      resuelta_por: usuario,
      resuelta_at: new Date().toISOString(),
    })
    .eq("alerta_id", alertaId)

  if (error) {
    console.error("Error resolviendo alerta:", error)
    return false
  }

  return true
}

// ============================================
// ============================================

export async function fetchCuadreListado(fechaInicio: string, fechaFin: string): Promise<CuadreListadoItem[]> {
  const { data, error } = await supabase.rpc("rpc_get_cuadre_listado", {
    p_fecha_inicio: fechaInicio,
    p_fecha_fin: fechaFin,
  })

  if (error) {
    console.error("[v0] Error fetching cuadre listado:", error.message)
    return []
  }

  return data || []
}

export async function fetchFacturasZReport(zreportId: string): Promise<FacturaZReport[]> {
  const { data, error } = await supabase.rpc("rpc_get_facturas_zreport", {
    p_zreport_id: zreportId,
  })

  if (error) {
    console.error("[v0] Error fetching facturas zreport:", error.message)
    return []
  }

  return data || []
}

export async function fetchZReportsDisponibles(fecha: string): Promise<ZReportDisponible[]> {
  const { data, error } = await supabase.rpc("rpc_get_zreports_disponibles", {
    p_fecha: fecha,
  })

  if (error) {
    console.error("[v0] Error fetching zreports disponibles:", error.message)
    return []
  }

  return data || []
}

export async function fetchFacturasHuerfanas(fecha: string): Promise<FacturaHuerfana[]> {
  const { data, error } = await supabase.rpc("rpc_get_facturas_huerfanas", {
    p_fecha: fecha,
  })

  if (error) {
    console.error("[v0] Error fetching facturas huerfanas:", error.message)
    return []
  }

  return data || []
}

export async function fetchFacturasAdyacentes(fecha: string, zreportIdExcluir: string): Promise<FacturaAdyacente[]> {
  const { data, error } = await supabase.rpc("rpc_get_facturas_adyacentes", {
    p_fecha: fecha,
    p_zreport_id_excluir: zreportIdExcluir,
  })

  if (error) {
    console.error("[v0] Error fetching facturas adyacentes:", error.message)
    return []
  }

  return data || []
}

export async function moverFactura(
  facturaId: number,
  nuevoZreportId: string,
): Promise<{ success: boolean; zreport_anterior?: string; zreport_nuevo?: string; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_mover_factura", {
    p_factura_id: facturaId,
    p_nuevo_zreport_id: nuevoZreportId,
  })

  if (error) {
    console.error("[v0] Error moviendo factura:", error.message)
    return { success: false, error: error.message }
  }

  return data || { success: true }
}

export async function crearAjuste(
  params: CrearAjusteParams,
): Promise<{ success: boolean; ajuste_id?: number; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_crear_ajuste", {
    p_zreport_id: params.zreport_id,
    p_fecha: params.fecha,
    p_tipo: params.tipo,
    p_importe: params.importe,
    p_descripcion: params.descripcion || "",
  })

  if (error) {
    console.error("[v0] Error creando ajuste:", error.message)
    return { success: false, error: error.message }
  }

  return data || { success: true }
}

export async function fetchAjustes(fecha: string, zreportId: string): Promise<AjusteCuadre[]> {
  const { data, error } = await supabase.rpc("rpc_get_ajustes", {
    p_fecha: fecha,
    p_zreport_id: zreportId,
  })

  if (error) {
    console.error("[v0] Error fetching ajustes:", error.message)
    return []
  }

  return data || []
}

export async function eliminarAjuste(ajusteId: number): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_eliminar_ajuste", {
    p_ajuste_id: ajusteId,
  })

  if (error) {
    console.error("[v0] Error eliminando ajuste:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function confirmarCuadre(fecha: string, zreportId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_confirmar_cuadre", {
    p_fecha: fecha,
    p_zreport_id: zreportId,
  })

  if (error) {
    console.error("[v0] Error confirmando cuadre:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function marcarPendiente(
  fecha: string,
  zreportId: string,
  motivo: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_marcar_pendiente", {
    p_fecha: fecha,
    p_zreport_id: zreportId,
    p_motivo: motivo,
  })

  if (error) {
    console.error("[v0] Error marcando pendiente:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
