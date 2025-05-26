"use client"

import { useState, useEffect } from "react"
import {
  getReviewsMetrics,
  getDistribucionEstrellas,
  getEvolucionPuntuacion,
  getReseñasRecientes,
  getDiasSemanaStats,
  getPalabrasClave,
  getTemasPrincipales,
  type ReviewsMetrics,
  type DistribucionEstrellas,
  type EvolucionPuntuacion,
  type ReseñaReciente,
  type DiaSemanaStats,
  type PalabraClave,
  type TemaPrincipal,
} from "@/app/actions/reviews-actions"

interface ReviewsData {
  metrics: ReviewsMetrics | null
  distribucion: DistribucionEstrellas[]
  evolucion: EvolucionPuntuacion[]
  reseñasRecientes: ReseñaReciente[]
  diasSemana: DiaSemanaStats[]
  palabrasClave: { positivas: PalabraClave[]; negativas: PalabraClave[] } | null
  temas: TemaPrincipal[]
}

export function useReviewsData() {
  const [data, setData] = useState<ReviewsData>({
    metrics: null,
    distribucion: [],
    evolucion: [],
    reseñasRecientes: [],
    diasSemana: [],
    palabrasClave: null,
    temas: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        metricsResult,
        distribucionResult,
        evolucionResult,
        reseñasResult,
        diasResult,
        palabrasResult,
        temasResult,
      ] = await Promise.all([
        getReviewsMetrics(),
        getDistribucionEstrellas(),
        getEvolucionPuntuacion(),
        getReseñasRecientes(),
        getDiasSemanaStats(),
        getPalabrasClave(),
        getTemasPrincipales(),
      ])

      if (!metricsResult.success) throw new Error(metricsResult.error)
      if (!distribucionResult.success) throw new Error(distribucionResult.error)
      if (!evolucionResult.success) throw new Error(evolucionResult.error)
      if (!reseñasResult.success) throw new Error(reseñasResult.error)
      if (!diasResult.success) throw new Error(diasResult.error)
      if (!palabrasResult.success) throw new Error(palabrasResult.error)
      if (!temasResult.success) throw new Error(temasResult.error)

      setData({
        metrics: metricsResult.data!,
        distribucion: distribucionResult.data!,
        evolucion: evolucionResult.data!,
        reseñasRecientes: reseñasResult.data!,
        diasSemana: diasResult.data!,
        palabrasClave: palabrasResult.data!,
        temas: temasResult.data!,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}
