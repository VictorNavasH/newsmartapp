"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchForecastData,
  fetchForecastCalendar,
  fetchBenchmarks,
} from "@/lib/dataService"

// --- Datos de forecasting (KPIs + proximos 7 dias + precision) ---
export function useForecastData() {
  return useQuery({
    queryKey: ["forecastData"],
    queryFn: fetchForecastData,
    // Forecast se recalcula periodicamente
    staleTime: 15 * 60 * 1000,
  })
}

// --- Calendario mensual de forecasting ---
export function useForecastCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ["forecastCalendar", year, month],
    queryFn: () => fetchForecastCalendar(year, month),
    staleTime: 15 * 60 * 1000,
  })
}

// --- Benchmarks del sector por rango de fechas ---
export function useBenchmarks(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: ["benchmarks", fechaInicio, fechaFin],
    queryFn: () => fetchBenchmarks(fechaInicio, fechaFin),
    // Datos de benchmarks son historicos
    staleTime: 30 * 60 * 1000,
    enabled: !!fechaInicio && !!fechaFin,
  })
}
