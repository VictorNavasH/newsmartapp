"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchOperationsRealTime } from "@/lib/dataService"
import {
  fetchOperativaKPIs,
  fetchOperativaProductos,
  fetchOperativaCliente,
  fetchOperativaPorHora,
  fetchOperativaItems,
  fetchOperativaCategorias,
} from "@/lib/operativaService"

// --- Datos de operaciones en tiempo real (vista live) ---
export function useOperationsRealTime() {
  return useQuery({
    queryKey: ["operationsRealTime"],
    queryFn: fetchOperationsRealTime,
    // Datos en tiempo real: refrescar cada 2 minutos
    refetchInterval: 2 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })
}

// --- KPIs de operativa por rango de fechas ---
export function useOperativaKPIs(
  startDate: Date | null,
  endDate: Date | null,
  tipo?: "comida" | "bebida",
  categoria?: string,
) {
  return useQuery({
    queryKey: ["operativaKPIs", startDate?.toISOString(), endDate?.toISOString(), tipo, categoria],
    queryFn: () => fetchOperativaKPIs(startDate!, endDate!, tipo, categoria),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Productos de operativa por rango de fechas ---
export function useOperativaProductos(
  startDate: Date | null,
  endDate: Date | null,
  tipo?: "comida" | "bebida",
  categoria?: string,
) {
  return useQuery({
    queryKey: ["operativaProductos", startDate?.toISOString(), endDate?.toISOString(), tipo, categoria],
    queryFn: () => fetchOperativaProductos(startDate!, endDate!, tipo, categoria),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Datos de cliente de operativa ---
export function useOperativaCliente(startDate: Date | null, endDate: Date | null) {
  return useQuery({
    queryKey: ["operativaCliente", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchOperativaCliente(startDate!, endDate!),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Datos por hora de operativa ---
export function useOperativaPorHora(startDate: Date | null, endDate: Date | null) {
  return useQuery({
    queryKey: ["operativaPorHora", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchOperativaPorHora(startDate!, endDate!),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Items de operativa con filtros ---
export function useOperativaItems(
  startDate: Date | null,
  endDate: Date | null,
  tipo?: "comida" | "bebida" | "postre",
  categoria?: string,
) {
  return useQuery({
    queryKey: ["operativaItems", startDate?.toISOString(), endDate?.toISOString(), tipo, categoria],
    queryFn: () => fetchOperativaItems(startDate!, endDate!, tipo, categoria),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Categorias disponibles de operativa ---
export function useOperativaCategorias(startDate: Date | null, endDate: Date | null) {
  return useQuery({
    queryKey: ["operativaCategorias", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchOperativaCategorias(startDate!, endDate!),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}
