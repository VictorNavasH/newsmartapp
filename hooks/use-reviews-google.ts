"use client"

import { useState, useEffect } from "react"
import {
  getMetricasCompletas,
  type EstadisticasReseñas,
  type ResumenEstrellas,
  type MetricasEvolucion,
} from "@/app/actions/reviews-google-actions"

interface ReviewsGoogleData {
  estadisticas: EstadisticasReseñas | null
  resumenEstrellas: ResumenEstrellas[]
  evolucion: MetricasEvolucion[]
}

export function useReviewsGoogle() {
  const [data, setData] = useState<ReviewsGoogleData>({
    estadisticas: null,
    resumenEstrellas: [],
    evolucion: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getMetricasCompletas()

      if (!result.success) {
        throw new Error(result.error)
      }

      setData({
        estadisticas: result.data!.estadisticas,
        resumenEstrellas: result.data!.resumenEstrellas,
        evolucion: result.data!.evolucion,
      })
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching reviews data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}
