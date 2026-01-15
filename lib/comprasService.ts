import { supabase } from "@/lib/supabase"
import type {
  CompraPedido,
  CompraFacturaConciliacion,
  CompraAlbaranDisponible,
  CompraProveedor,
  CompraKPIs,
  ProductFormat,
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

  return data || []
}

// ============================================
// CONCILIACIÓN
// ============================================

export async function fetchFacturasConciliacion(filters?: {
  estadoConciliacion?: string
  estadoPago?: string
  proveedor?: string
  soloRevision?: boolean
}): Promise<CompraFacturaConciliacion[]> {
  let query = supabase.from("vw_compras_conciliacion").select("*").order("factura_fecha", { ascending: false })

  if (filters?.estadoConciliacion && filters.estadoConciliacion !== "todos") {
    query = query.eq("estado_conciliacion", filters.estadoConciliacion)
  }
  if (filters?.estadoPago && filters.estadoPago !== "todos") {
    query = query.eq("estado_pago", filters.estadoPago)
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

  return data || []
}

export async function fetchAlbaranesDisponibles(proveedorId?: string): Promise<CompraAlbaranDisponible[]> {
  let query = supabase.from("vw_compras_albaranes_para_vincular").select("*").order("fecha", { ascending: false })

  if (proveedorId) {
    query = query.eq("gstock_supplier_id", proveedorId)
  }

  const { data, error } = await query

  if (error) {
    console.error("[fetchAlbaranesDisponibles] Error:", error.message)
    return []
  }

  return data || []
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
  const { data, error } = await supabase.from("vw_compras_resumen").select("*").single()

  if (error) {
    console.error("[fetchKPIs] Error:", error.message)
    return null
  }

  return data
}

// ============================================
// FORMATOS DE PRODUCTOS
// ============================================

export async function fetchProductFormats(): Promise<ProductFormat[]> {
  const { data, error } = await supabase.from("gstock_product_formats").select("gstock_format_id, name").order("name")

  if (error) {
    console.error("[fetchProductFormats] Error:", error.message)
    return []
  }

  return data || []
}
