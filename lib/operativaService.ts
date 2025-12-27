import { supabase } from "./supabase"
import type { OperativaItem, OperativaKPI, OperativaProducto, OperativaCliente, OperativaPorHora } from "../types"
import { format } from "date-fns"

// Helper para formatear fechas
const formatDateStr = (date: Date): string => format(date, "yyyy-MM-dd")

const handleRpcError = (error: any, rpcName: string): boolean => {
  if (error?.message?.includes("does not exist") || error?.code === "42883" || error?.code === "42P01") {
    console.warn(`[v0] RPC ${rpcName} no existe todavia. Retornando datos vacios.`)
    return true
  }
  return false
}

export const fetchOperativaKPIs = async (
  startDate: Date,
  endDate: Date,
  filtroTipo?: "comida" | "bebida",
  filtroCategoria?: string,
): Promise<OperativaKPI[]> => {
  try {
    const startStr = formatDateStr(startDate)
    const endStr = formatDateStr(endDate)

    console.log(
      `[v0] fetchOperativaKPIs (RPC) - from ${startStr} to ${endStr}, tipo: ${filtroTipo}, categoria: ${filtroCategoria}`,
    )

    const { data, error } = await supabase.rpc("get_operativa_kpis", {
      fecha_inicio: startStr,
      fecha_fin: endStr,
      filtro_tipo: filtroTipo || null,
      filtro_categoria: filtroCategoria || null,
    })

    if (error) {
      if (handleRpcError(error, "get_operativa_kpis")) return []
      console.error("[v0] Error fetching operativa KPIs:", error)
      return []
    }

    console.log(`[v0] fetchOperativaKPIs - Received ${data?.length || 0} days`)
    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchOperativaKPIs:", err)
    return []
  }
}

export const fetchOperativaProductos = async (
  startDate: Date,
  endDate: Date,
  filtroTipo?: "comida" | "bebida",
  filtroCategoria?: string,
): Promise<OperativaProducto[]> => {
  try {
    const startStr = formatDateStr(startDate)
    const endStr = formatDateStr(endDate)

    console.log(
      `[v0] fetchOperativaProductos (RPC) - from ${startStr} to ${endStr}, tipo: ${filtroTipo}, categoria: ${filtroCategoria}`,
    )

    const { data, error } = await supabase.rpc("get_operativa_productos", {
      fecha_inicio: startStr,
      fecha_fin: endStr,
      filtro_tipo: filtroTipo || null,
      filtro_categoria: filtroCategoria || null,
    })

    if (error) {
      if (handleRpcError(error, "get_operativa_productos")) return []
      console.error("[v0] Error fetching operativa productos:", error)
      return []
    }

    console.log(`[v0] fetchOperativaProductos - Received ${data?.length || 0} productos`)
    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchOperativaProductos:", err)
    return []
  }
}

export const fetchOperativaCliente = async (startDate: Date, endDate: Date): Promise<OperativaCliente[]> => {
  try {
    const startStr = formatDateStr(startDate)
    const endStr = formatDateStr(endDate)

    console.log(`[v0] fetchOperativaCliente (RPC) - from ${startStr} to ${endStr}`)

    const { data, error } = await supabase.rpc("get_operativa_cliente", {
      fecha_inicio: startStr,
      fecha_fin: endStr,
    })

    if (error) {
      if (handleRpcError(error, "get_operativa_cliente")) return []
      console.error("[v0] Error fetching operativa cliente:", error)
      return []
    }

    console.log(`[v0] fetchOperativaCliente - Received ${data?.length || 0} clientes`)
    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchOperativaCliente:", err)
    return []
  }
}

export const fetchOperativaPorHora = async (startDate: Date, endDate: Date): Promise<OperativaPorHora[]> => {
  try {
    const startStr = formatDateStr(startDate)
    const endStr = formatDateStr(endDate)

    console.log(`[v0] fetchOperativaPorHora (RPC) - from ${startStr} to ${endStr}`)

    const { data, error } = await supabase.rpc("get_operativa_por_hora", {
      fecha_inicio: startStr,
      fecha_fin: endStr,
    })

    if (error) {
      if (handleRpcError(error, "get_operativa_por_hora")) return []
      console.error("[v0] Error fetching operativa por hora:", error)
      return []
    }

    console.log(`[v0] fetchOperativaPorHora - Received ${data?.length || 0} horas`)
    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchOperativaPorHora:", err)
    return []
  }
}

export const fetchOperativaItems = async (
  startDate: Date,
  endDate: Date,
  tipo?: "comida" | "bebida" | "postre",
  categoria?: string,
): Promise<OperativaItem[]> => {
  try {
    const startStr = formatDateStr(startDate)
    const endStr = formatDateStr(endDate)

    console.log(`[v0] fetchOperativaItems - from ${startStr} to ${endStr}, tipo: ${tipo}, categoria: ${categoria}`)

    let query = supabase.from("vw_operativa_items").select("*").gte("fecha", startStr).lte("fecha", endStr)

    if (tipo) {
      query = query.eq("tipo", tipo)
    }
    if (categoria) {
      query = query.eq("categoria", categoria)
    }

    const { data, error } = await query.order("fecha", { ascending: false })

    if (error) {
      if (handleRpcError(error, "vw_operativa_items")) return []
      console.error("[v0] Error fetching operativa items:", error)
      return []
    }

    console.log(`[v0] fetchOperativaItems - Received ${data?.length || 0} items`)
    return data || []
  } catch (err) {
    console.error("[v0] Error in fetchOperativaItems:", err)
    return []
  }
}

// Obtener categorias disponibles
export const fetchOperativaCategorias = async (startDate: Date, endDate: Date): Promise<string[]> => {
  try {
    const startStr = formatDateStr(startDate)
    const endStr = formatDateStr(endDate)

    const { data, error } = await supabase
      .from("vw_operativa_items")
      .select("categoria")
      .gte("fecha", startStr)
      .lte("fecha", endStr)

    if (error) {
      if (handleRpcError(error, "vw_operativa_items")) return []
      console.error("[v0] Error fetching categorias:", error)
      return []
    }

    const uniqueCategorias = [...new Set(data?.map((d: any) => d.categoria).filter(Boolean))]
    return uniqueCategorias.sort()
  } catch (err) {
    console.error("[v0] Error in fetchOperativaCategorias:", err)
    return []
  }
}
