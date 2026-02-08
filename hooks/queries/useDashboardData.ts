"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchRealTimeData,
  fetchWeekReservations,
  fetchFinancialKPIs,
  fetchLaborCostAnalysis,
  fetchWeekRevenue,
  fetchOcupacionSemanal,
} from "@/lib/dataService"

// --- Datos en tiempo real del dashboard (ventas, turnos, pagos) ---
export function useRealTimeData() {
  return useQuery({
    queryKey: ["realTimeData"],
    queryFn: fetchRealTimeData,
    // Datos de ventas en vivo: refrescar cada 2 minutos
    refetchInterval: 2 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })
}

// --- Reservas de la semana (con offset para navegar semanas) ---
export function useWeekReservations(offsetWeeks = 0) {
  return useQuery({
    queryKey: ["weekReservations", offsetWeeks],
    queryFn: () => fetchWeekReservations(offsetWeeks),
    // Las reservas cambian menos frecuentemente
    staleTime: 10 * 60 * 1000,
  })
}

// --- KPIs financieros (ingresos, gastos, margen por periodo) ---
export function useFinancialKPIs() {
  return useQuery({
    queryKey: ["financialKPIs"],
    queryFn: fetchFinancialKPIs,
    // KPIs financieros son datos consolidados
    staleTime: 15 * 60 * 1000,
  })
}

// --- Analisis de coste laboral por rango de fechas ---
export function useLaborCostAnalysis(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["laborCost", startDate, endDate],
    queryFn: () => fetchLaborCostAnalysis(startDate, endDate),
    // Datos historicos consolidados
    staleTime: 15 * 60 * 1000,
    // Solo ejecutar si hay fechas validas
    enabled: !!startDate && !!endDate,
  })
}

// --- Facturacion semanal (con offset para navegar semanas) ---
export function useWeekRevenue(weekOffset = 0) {
  return useQuery({
    queryKey: ["weekRevenue", weekOffset],
    queryFn: () => fetchWeekRevenue(weekOffset),
    staleTime: 5 * 60 * 1000,
  })
}

// --- Ocupacion semanal (7 dias) ---
export function useOcupacionSemanal() {
  return useQuery({
    queryKey: ["ocupacionSemanal"],
    queryFn: fetchOcupacionSemanal,
    staleTime: 10 * 60 * 1000,
  })
}
