"use client"

import { useState, useEffect } from "react"
import type {
  FiltrosOcupacion,
  KPIOcupacion,
  OcupacionPorDia,
  EvolucionOcupacion,
  OcupacionPorTurno,
} from "@/app/actions/ocupacion-actions"
import {
  getKPIOcupacion,
  getOcupacionPorDia,
  getEvolucionOcupacion,
  getOcupacionPorTurno,
} from "@/app/actions/ocupacion-actions"

export function useOcupacionData(filtros: FiltrosOcupacion) {
  const [kpis, setKpis] = useState<KPIOcupacion>({
    tasaOcupacionPromedio: 0,
    reservasAtendidasTotales: 0,
    cumplimientoObjetivo: 0,
    tendenciaOcupacion: 0,
    capacidadNoUtilizada: 0,
  })
  const [ocupacionPorDia, setOcupacionPorDia] = useState<OcupacionPorDia[]>([])
  const [evolucionOcupacion, setEvolucionOcupacion] = useState<EvolucionOcupacion[]>([])
  const [ocupacionPorTurno, setOcupacionPorTurno] = useState<OcupacionPorTurno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        console.log("🔄 Iniciando carga de datos con filtros:", filtros)

        // EJECUTAR TODAS LAS CONSULTAS EN PARALELO
        const [kpisData, ocupacionDiaData, evolucionData, ocupacionTurnoData] = await Promise.all([
          getKPIOcupacion(filtros),
          getOcupacionPorDia(filtros),
          getEvolucionOcupacion(filtros),
          getOcupacionPorTurno(filtros),
        ])

        console.log("✅ Datos cargados:", {
          kpis: kpisData,
          ocupacionPorDia: ocupacionDiaData,
          evolucion: evolucionData,
          ocupacionTurno: ocupacionTurnoData,
        })

        setKpis(kpisData)
        setOcupacionPorDia(ocupacionDiaData)
        setEvolucionOcupacion(evolucionData)
        setOcupacionPorTurno(ocupacionTurnoData)
      } catch (err) {
        console.error("❌ Error al cargar datos:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filtros])

  return {
    kpis,
    ocupacionPorDia,
    evolucionOcupacion,
    ocupacionPorTurno,
    loading,
    error,
  }
}
