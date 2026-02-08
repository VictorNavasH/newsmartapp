"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchReservationsFromDB,
  fetchYearlyComparison,
  fetchPeriodComparisonData,
} from "@/lib/dataService"

// --- Metricas diarias de reservas por rango de fechas ---
export function useReservationsFromDB(startDate: Date | null, endDate: Date | null) {
  return useQuery({
    queryKey: ["reservationsDB", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchReservationsFromDB(startDate!, endDate!),
    // Datos historicos: cache largo
    staleTime: 30 * 60 * 1000,
    // Solo ejecutar si hay fechas validas
    enabled: !!startDate && !!endDate,
  })
}

// --- Comparativa anual de reservas (todos los años disponibles) ---
export function useYearlyComparison() {
  return useQuery({
    queryKey: ["yearlyComparison"],
    queryFn: fetchYearlyComparison,
    // Datos historicos que cambian poco
    staleTime: 30 * 60 * 1000,
  })
}

// --- Comparativa de periodos entre dos años ---
export function usePeriodComparison(
  startDay: number,
  startMonth: number,
  endDay: number,
  endMonth: number,
  yearA: number,
  yearB: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ["periodComparison", startDay, startMonth, endDay, endMonth, yearA, yearB],
    queryFn: () => fetchPeriodComparisonData(startDay, startMonth, endDay, endMonth, yearA, yearB),
    staleTime: 30 * 60 * 1000,
    enabled,
  })
}
