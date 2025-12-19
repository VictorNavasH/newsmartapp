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
    const { data, error } = await supabase
      .from("vw_forecasting_analysis")
      .select("facturacion_real, comensales_real, ticket_medio, capacidad_turno, capacidad_dia, capacidad_mesas")
      .eq("tipo_fecha", "pasado")
      .not("facturacion_real", "is", null)
      .order("fecha", { ascending: false })
      .limit(60)

    if (error || !data?.length) {
      return DEFAULT_DATA
    }

    const facturaciones = data.map((d) => d.facturacion_real).filter(Boolean) as number[]
    const comensales = data.map((d) => d.comensales_real).filter(Boolean) as number[]

    return {
      facturacion_media_dia:
        facturaciones.length > 0
          ? Math.round(facturaciones.reduce((a, b) => a + b, 0) / facturaciones.length)
          : DEFAULT_DATA.facturacion_media_dia,
      ticket_medio_historico: 25,
      comensales_media:
        comensales.length > 0
          ? Math.round(comensales.reduce((a, b) => a + b, 0) / comensales.length)
          : DEFAULT_DATA.comensales_media,
      capacidad_turno: data[0]?.capacidad_turno ?? DEFAULT_DATA.capacidad_turno,
      capacidad_dia: data[0]?.capacidad_dia ?? DEFAULT_DATA.capacidad_dia,
      total_mesas: data[0]?.capacidad_mesas ?? DEFAULT_DATA.total_mesas,
      mejor_dia_facturacion: facturaciones.length > 0 ? Math.max(...facturaciones) : DEFAULT_DATA.mejor_dia_facturacion,
      dias_operativos_mes: 26,
    }
  } catch {
    return DEFAULT_DATA
  }
}
