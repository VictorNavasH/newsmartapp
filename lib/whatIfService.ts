import { supabase } from "./supabase"
import type { WhatIfReferenceData } from "../types"

const DEFAULT_DATA: WhatIfReferenceData = {
  facturacion_media_dia: 1076,
  ticket_medio_historico: 25.16,
  comensales_media: 45,
  capacidad_turno: 66,
  capacidad_dia: 132,
  total_mesas: 19,
  mejor_dia_facturacion: 4063,
  dias_operativos_mes: 26,
}

export async function fetchWhatIfReferenceData(): Promise<WhatIfReferenceData> {
  try {
    const { data, error } = await supabase.rpc("get_whatif_reference_data")

    if (error) {
      return DEFAULT_DATA
    }

    // RPC returns a single row
    const row = Array.isArray(data) ? data[0] : data

    return {
      facturacion_media_dia: row?.facturacion_media_dia ?? DEFAULT_DATA.facturacion_media_dia,
      ticket_medio_historico: row?.ticket_medio_historico ?? DEFAULT_DATA.ticket_medio_historico,
      comensales_media: row?.comensales_media ?? DEFAULT_DATA.comensales_media,
      capacidad_turno: row?.capacidad_turno ?? DEFAULT_DATA.capacidad_turno,
      capacidad_dia: row?.capacidad_dia ?? DEFAULT_DATA.capacidad_dia,
      total_mesas: row?.total_mesas ?? DEFAULT_DATA.total_mesas,
      mejor_dia_facturacion: row?.mejor_dia_facturacion ?? DEFAULT_DATA.mejor_dia_facturacion,
      dias_operativos_mes: row?.dias_operativos_mes ?? DEFAULT_DATA.dias_operativos_mes,
    }
  } catch {
    return DEFAULT_DATA
  }
}
