"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchReservationsFromDB, aggregateMetrics } from "../lib/dataService"
import type { DailyCompleteMetrics, ComparisonResult, DateRange } from "../types"

interface UseComparisonReturn {
  current: DailyCompleteMetrics | null
  previous: DailyCompleteMetrics | null
  loading: boolean
  calculateDelta: (curr: number, prev: number) => ComparisonResult
}

export const useComparison = (dateRange: DateRange): UseComparisonReturn => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ current: DailyCompleteMetrics; previous: DailyCompleteMetrics } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 1. Current Period Data
        const currentData = await fetchReservationsFromDB(dateRange.from, dateRange.to)

        const oneDayMs = 24 * 60 * 60 * 1000
        const daysDiff = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / oneDayMs) + 1

        let prevFrom: Date
        let prevTo: Date

        if (daysDiff <= 7) {
          // Para periodos de hasta 7 dias: comparar con mismos dias de la semana anterior
          // Ej: Sabado 30 nov -> Sabado 23 nov (7 dias antes)
          // Ej: Lun-Jue (25-28 nov) -> Lun-Jue (18-21 nov)
          prevFrom = new Date(dateRange.from)
          prevFrom.setDate(prevFrom.getDate() - 7)
          prevTo = new Date(dateRange.to)
          prevTo.setDate(prevTo.getDate() - 7)
        } else if (daysDiff <= 31) {
          // Para periodos de hasta 31 dias (mes): comparar con mismo rango del mes anterior
          prevFrom = new Date(dateRange.from)
          prevFrom.setMonth(prevFrom.getMonth() - 1)
          prevTo = new Date(dateRange.to)
          prevTo.setMonth(prevTo.getMonth() - 1)

          // Ajustar si el mes anterior tiene menos dias
          const maxDayPrevMonth = new Date(prevTo.getFullYear(), prevTo.getMonth() + 1, 0).getDate()
          if (prevTo.getDate() > maxDayPrevMonth) {
            prevTo.setDate(maxDayPrevMonth)
          }
        } else {
          // Para periodos mas largos: periodo inmediatamente anterior
          prevTo = new Date(dateRange.from)
          prevTo.setDate(prevTo.getDate() - 1)
          prevFrom = new Date(prevTo)
          prevFrom.setDate(prevFrom.getDate() - (daysDiff - 1))
        }

        const previousData = await fetchReservationsFromDB(prevFrom, prevTo)

        // 3. Aggregate
        const currentAgg = aggregateMetrics(currentData)
        const previousAgg = aggregateMetrics(previousData)

        setData({
          current: currentAgg,
          previous: previousAgg,
        })
      } catch (err) {
        console.error("[v0] Error loading comparison data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  const calculateDelta = useCallback((curr: number, prev: number): ComparisonResult => {
    // Avoid division by zero
    const delta = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100

    return {
      value: curr,
      previous: prev,
      delta: Number.parseFloat(delta.toFixed(1)),
      trend: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
    }
  }, [])

  return {
    current: data?.current || null,
    previous: data?.previous || null,
    loading,
    calculateDelta,
  }
}
