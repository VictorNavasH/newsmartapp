"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchProductMix,
  fetchCategoryMix,
  fetchOptionMix,
  fetchFoodCostProducts,
} from "@/lib/dataService"

// --- Mix de productos por rango de fechas y filtros ---
export function useProductMix(
  startDate: string,
  endDate: string,
  turno?: string,
  categoria?: string,
) {
  return useQuery({
    queryKey: ["productMix", startDate, endDate, turno, categoria],
    queryFn: () => fetchProductMix(startDate, endDate, turno, categoria),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Mix de categorias por rango de fechas ---
export function useCategoryMix(startDate: string, endDate: string, turno?: string) {
  return useQuery({
    queryKey: ["categoryMix", startDate, endDate, turno],
    queryFn: () => fetchCategoryMix(startDate, endDate, turno),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Mix de opciones/modificadores por rango de fechas ---
export function useOptionMix(
  startDate: string,
  endDate: string,
  turno?: string,
  soloExtraPago?: boolean,
) {
  return useQuery({
    queryKey: ["optionMix", startDate, endDate, turno, soloExtraPago],
    queryFn: () => fetchOptionMix(startDate, endDate, turno, soloExtraPago),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Food cost de todos los productos ---
export function useFoodCostProducts() {
  return useQuery({
    queryKey: ["foodCostProducts"],
    queryFn: fetchFoodCostProducts,
    // Datos de escandallos cambian poco
    staleTime: 30 * 60 * 1000,
  })
}
