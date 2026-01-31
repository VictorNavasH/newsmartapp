"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchReservationsFromDB, aggregateMetrics } from "../lib/dataService"
import { calculatePreviousPeriod } from "../lib/dateUtils"
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
        const currentData = await fetchReservationsFromDB(dateRange.from, dateRange.to)

        const prev = calculatePreviousPeriod(dateRange.from, dateRange.to)
        const previousData = await fetchReservationsFromDB(prev.from, prev.to)

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
