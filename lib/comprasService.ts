import { supabase } from "@/lib/supabase"
import type {
  CompraPedido,
  CompraFacturaConciliacion,
  CompraAlbaranDisponible,
  CompraProveedor,
  CompraKPIs,
  ProductFormat,
  CompraAnalisisKPI,
  CompraEvolucionMensual,
  CompraDistribucionCategoria,
  CompraTopProducto,
  CompraTablaJerarquica,
} from "@/types"

// ============================================
// PEDIDOS
// ============================================

export async function fetchPedidos(filters?: {
  proveedor?: string
  estado?: string
  fechaDesde?: string
  fechaHasta?: string
}): Promise<CompraPedido[]> {
  let query = supabase.from("vw_compras_pedidos").select("*").order("fecha_pedido", { ascending: false })

  if (filters?.proveedor && filters.proveedor !== "todos") {
    query = query.eq("gstock_supplier_id", filters.proveedor)
  }
  if (filters?.estado && filters.estado !== "todos") {
    query = query.eq("estado", filters.estado)
  }
  if (filters?.fechaDesde) {
    query = query.gte("fecha_pedido", filters.fechaDesde)
  }
  if (filters?.fechaHasta) {
    query = query.lte("fecha_pedido", filters.fechaHasta)
  }

  const { data, error } = await query

  if (error) {
    console.error("[fetchPedidos] Error:", error.message)
    return []
  }

  // Mapear 'items' (nombre en la vista) a 'pedido_items' (nombre en el tipo TypeScript)
  return (data || []).map((row: any) => ({
    ...row,
    pedido_items: row.items ?? null,
  }))
}

// ============================================
// CONCILIACIÓN
// ============================================

export async function fetchFacturasConciliacion(filters?: {
  estadoConciliacion?: string
  proveedor?: string
  soloRevision?: boolean
}): Promise<CompraFacturaConciliacion[]> {
  // Usar vw_compras_facturas_pendientes (225 facturas reales)
  // en lugar de vw_compras_conciliacion (que depende de tabla vacía gstock_conciliacion_compras)
  let query = supabase.from("vw_compras_facturas_pendientes").select("*").order("fecha_factura", { ascending: false })

  if (filters?.estadoConciliacion && filters.estadoConciliacion !== "todos") {
    query = query.eq("estado_conciliacion", filters.estadoConciliacion)
  }
  if (filters?.proveedor && filters.proveedor !== "todos") {
    query = query.eq("gstock_supplier_id", filters.proveedor)
  }
  if (filters?.soloRevision) {
    query = query.eq("requiere_revision", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("[fetchFacturasConciliacion] Error:", error.message)
    return []
  }

  // Mapear campos de vw_compras_facturas_pendientes al tipo CompraFacturaConciliacion
  return (data || []).map((row: any) => ({
    id: row.factura_id,
    factura_id: row.factura_id,
    conciliacion_id: row.conciliacion_id || null,
    gstock_supplier_id: row.gstock_supplier_id || null,
    factura_numero: row.numero_factura,
    proveedor: row.proveedor || null,
    proveedor_nif: row.proveedor_nif || null,
    factura_fecha: row.fecha_factura,
    factura_vencimiento: null,
    factura_base: Number(row.importe_base) || 0,
    factura_iva: Number(row.importe_iva) || 0,
    factura_total: Number(row.importe_total) || 0,
    factura_concepto: row.factura_notas || null,
    ia_confianza_pct: row.ia_confianza != null ? Math.round(Number(row.ia_confianza) * 100) : null,
    tipo_conciliacion: row.tipo_referencia || null,
    motivo_revision: row.motivo_revision || null,
    requiere_revision: row.requiere_revision || false,
    estado_conciliacion: row.estado_conciliacion || "pendiente",
    estado_pago: "pendiente" as const,
    albaranes_vinculados: row.documentos_gstock_ids || null,
    albaranes_candidatos: Number(row.albaranes_candidatos) || 0,
  }))
}

export async function fetchAlbaranesDisponibles(proveedorId?: string): Promise<CompraAlbaranDisponible[]> {
  let query = supabase.from("vw_compras_albaranes_para_vincular").select("*").order("fecha_albaran", { ascending: false })

  if (proveedorId) {
    query = query.eq("gstock_supplier_id", proveedorId)
  }

  const { data, error } = await query

  if (error) {
    console.error("[fetchAlbaranesDisponibles] Error:", error.message)
    return []
  }

  // Mapear campos de la vista al tipo CompraAlbaranDisponible
  return (data || []).map((row: any) => ({
    id: row.id,
    numero_albaran: row.numero_albaran,
    proveedor: row.proveedor,
    fecha: row.fecha_albaran,
    importe_total: Number(row.total) || 0,
    gstock_supplier_id: row.gstock_supplier_id || null,
  }))
}

// ============================================
// ACCIONES
// ============================================

export async function vincularAlbaranes(
  facturaId: string,
  albaranIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("fn_conciliar_manual", {
    p_factura_id: facturaId,
    p_albaran_ids: albaranIds,
    p_usuario: "webapp",
  })

  if (error) {
    console.error("[vincularAlbaranes] Error:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function confirmarConciliacion(
  conciliacionId: string,
  notas?: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("fn_confirmar_conciliacion", {
    p_conciliacion_id: conciliacionId,
    p_notas: notas || "Confirmado desde webapp",
    p_usuario: "webapp",
  })

  if (error) {
    console.error("[confirmarConciliacion] Error:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function descartarConciliacion(
  facturaId: string,
  motivo?: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("fn_descartar_conciliacion", {
    p_factura_id: facturaId,
    p_motivo: motivo || "Descartado desde webapp",
    p_usuario: "webapp",
  })

  if (error) {
    console.error("[descartarConciliacion] Error:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================
// PROVEEDORES (para filtros)
// ============================================

export async function fetchProveedores(): Promise<CompraProveedor[]> {
  const { data, error } = await supabase.from("vw_compras_proveedores").select("*").order("nombre")

  if (error) {
    console.error("[fetchProveedores] Error:", error.message)
    return []
  }

  return data || []
}

// ============================================
// KPIs
// ============================================

export async function fetchKPIs(): Promise<CompraKPIs | null> {
  // Consultar 4 fuentes en paralelo para obtener KPIs reales
  const [resumenResult, pedidosPendResult, albaranesSFResult, facturasPendResult] = await Promise.all([
    // 1. Datos mensuales de vw_compras_resumen
    supabase.from("vw_compras_resumen").select("*").single(),
    // 2. Pedidos no recepcionados (pendientes de entrega)
    supabase.from("vw_compras_pedidos").select("pedido_total").neq("estado", "recepcionado"),
    // 3. Albaranes sin facturar
    supabase.from("vw_compras_albaranes_para_vincular").select("total"),
    // 4. Facturas pendientes de conciliar
    supabase.from("vw_compras_facturas_pendientes").select("importe_total"),
  ])

  if (resumenResult.error) {
    console.error("[fetchKPIs] Error resumen:", resumenResult.error.message)
    return null
  }

  const resumen = resumenResult.data
  const pedidosPend = pedidosPendResult.data || []
  const albaranesSF = albaranesSFResult.data || []
  const facturasPend = facturasPendResult.data || []

  return {
    // Datos mensuales directos
    total_mes_albaranes: Number(resumen.total_mes_albaranes) || 0,
    total_mes_pedidos: Number(resumen.total_mes_pedidos) || 0,
    num_albaranes_mes: Number(resumen.num_albaranes_mes) || 0,
    num_pedidos_mes: Number(resumen.num_pedidos_mes) || 0,
    total_albaranes: Number(resumen.total_albaranes) || 0,
    total_pedidos: Number(resumen.total_pedidos) || 0,
    // KPIs computados
    pedidos_pendientes: pedidosPend.length,
    importe_pedidos_pendientes: pedidosPend.reduce((sum, p) => sum + (Number(p.pedido_total) || 0), 0),
    albaranes_sin_facturar: albaranesSF.length,
    importe_sin_facturar: albaranesSF.reduce((sum, a) => sum + (Number(a.total) || 0), 0),
    facturas_pendientes: facturasPend.length,
    importe_facturas_pendientes: facturasPend.reduce((sum, f) => sum + (Number(f.importe_total) || 0), 0),
  }
}

// ============================================
// FORMATOS DE PRODUCTOS
// ============================================

export async function fetchProductFormats(): Promise<ProductFormat[]> {
  const { data, error } = await supabase.from("gstock_product_formats").select("id, name").order("name")

  if (error) {
    console.error("[fetchProductFormats] Error:", error.message)
    return []
  }

  return data || []
}

// ============================================
// ANÁLISIS DE COMPRAS
// ============================================

export async function fetchComprasAnalisisKPIs(params: {
  fechaDesde: string
  fechaHasta: string
}): Promise<CompraAnalisisKPI | null> {
  const { data, error } = await supabase.rpc("compras_kpis", {
    fecha_inicio: params.fechaDesde,
    fecha_fin: params.fechaHasta,
  })

  if (error) {
    console.error("[fetchComprasAnalisisKPIs] Error:", error.message)
    return null
  }

  const rawData = data?.[0] || data
  if (!rawData) return null

  return {
    total_compras: rawData.total_gastado || 0,
    num_albaranes: rawData.num_albaranes || 0,
    ticket_medio: rawData.ticket_medio || 0,
    variacion_vs_anterior: rawData.variacion_porcentaje ?? 0,
  }
}

export async function fetchComprasEvolucionMensual(meses = 12): Promise<CompraEvolucionMensual[]> {
  const { data, error } = await supabase.rpc("compras_evolucion_mensual", {
    meses_atras: meses,
  })

  if (error) {
    console.error("[fetchComprasEvolucionMensual] Error:", error.message)
    return []
  }

  return (data || []).map((item: any) => ({
    mes: item.mes,
    mes_label: item.mes_texto || item.mes,
    total: item.total_con_iva || 0,
    total_sin_iva: item.total_sin_iva || 0,
    num_albaranes: item.num_albaranes || 0,
  }))
}

export async function fetchComprasDistribucion(params: {
  fechaDesde: string
  fechaHasta: string
}): Promise<CompraDistribucionCategoria[]> {
  const { data, error } = await supabase.rpc("compras_distribucion", {
    fecha_inicio: params.fechaDesde,
    fecha_fin: params.fechaHasta,
  })

  if (error) {
    console.error("[fetchComprasDistribucion] Error:", error.message)
    return []
  }

  return (data || []).map((item: any) => ({
    categoria: item.categoria,
    familia: item.familia || null,
    tipo: item.tipo || null,
    total: item.total_con_iva || 0,
    porcentaje: item.porcentaje || 0,
    num_albaranes: item.num_lineas || 0,
  }))
}

export async function fetchComprasTopProductos(params: {
  fechaDesde: string
  fechaHasta: string
  limite?: number
}): Promise<CompraTopProducto[]> {
  const { data, error } = await supabase.rpc("compras_top_productos", {
    fecha_inicio: params.fechaDesde,
    fecha_fin: params.fechaHasta,
    limite: params.limite || 10,
  })

  if (error) {
    console.error("[fetchComprasTopProductos] Error:", error.message)
    return []
  }

  return (data || []).map((item: any) => ({
    producto: item.producto,
    formato: item.formato || null,
    categoria: item.categoria,
    familia: item.familia || null,
    total: item.total_con_iva || 0,
    cantidad: item.cantidad || 0,
    num_albaranes: item.num_albaranes || 0,
  }))
}

export async function fetchComprasTablaJerarquica(params: {
  fechaDesde: string
  fechaHasta: string
}): Promise<CompraTablaJerarquica[]> {
  const { data, error } = await supabase.rpc("compras_tabla_jerarquica", {
    fecha_inicio: params.fechaDesde,
    fecha_fin: params.fechaHasta,
  })

  if (error) {
    console.error("[fetchComprasTablaJerarquica] Error:", error.message)
    return []
  }

  return data || []
}
