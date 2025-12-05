import { supabase } from "./supabase"
import type { WhatIfReferenceData } from "../types"

export async function fetchWhatIfReferenceData(): Promise<WhatIfReferenceData> {
  const { data, error } = await supabase.rpc("get_whatif_reference_data")

  if (error) {
    console.error("[v0] Error fetching what-if reference data:", error)
    // Return default values if RPC fails
    return {
      facturacion_media_dia: 1076,
      ticket_medio_historico: 25.16,
      comensales_media: 45,
      capacidad_turno: 66,
      capacidad_dia: 132,
      total_mesas: 19,
      mejor_dia_facturacion: 4063,
      dias_operativos_mes: 26,
    }
  }

  // RPC returns a single row
  const row = Array.isArray(data) ? data[0] : data

  return {
    facturacion_media_dia: row?.facturacion_media_dia ?? 1076,
    ticket_medio_historico: row?.ticket_medio_historico ?? 25.16,
    comensales_media: row?.comensales_media ?? 45,
    capacidad_turno: row?.capacidad_turno ?? 66,
    capacidad_dia: row?.capacidad_dia ?? 132,
    total_mesas: row?.total_mesas ?? 19,
    mejor_dia_facturacion: row?.mejor_dia_facturacion ?? 4063,
    dias_operativos_mes: row?.dias_operativos_mes ?? 26,
  }
}
