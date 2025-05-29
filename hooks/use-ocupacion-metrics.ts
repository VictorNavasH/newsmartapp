"use client"

import { useState, useEffect } from "react"

export interface OcupacionMetrics {
  ocupacion_total: number
  reservas_atendidas: number
  comensales: number
  capacidad_perdida: number
  dias_count: number
  detalle_por_dia: Array<{
    fecha: string
    comensales: number
    reservas: number
  }>
  detalle_por_turno: {
    mediodia: { comensales: number; reservas: number }
    noche: { comensales: number; reservas: number }
  }
  tendencia: number | null
  periodo: {
    fecha_inicio: string
    fecha_fin: string
    turno: string
    capacidad_max: number
  }
}

interface FiltrosOcupacion {
  fechaInicio: string
  fechaFin: string
  turno: "todos" | "mediodia" | "noche"
  diaSemana: "todos" | "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo"
  capacidadMax?: number
}

export function useOcupacionMetrics(filtros: FiltrosOcupacion) {
  const [data, setData] = useState<OcupacionMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          fecha_inicio: filtros.fechaInicio,
          fecha_fin: filtros.fechaFin,
          turno: filtros.turno,
          dia_semana: filtros.diaSemana,
          capacidad_max: (filtros.capacidadMax || 65).toString(),
        })

        console.log("🔄 Fetching ocupacion metrics:", `/api/metrics/ocupacion?${params}`)

        const response = await fetch(`/api/metrics/ocupacion?${params}`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("✅ Ocupacion metrics loaded:", result)

        setData(result)
      } catch (err) {
        console.error("❌ Error fetching ocupacion metrics:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filtros])

  return { data, loading, error }
}
