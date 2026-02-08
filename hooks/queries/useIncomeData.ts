"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchIncomeFromDB,
  fetchTableBillingFromDB,
} from "@/lib/dataService"

// --- Datos de ingresos por rango de fechas ---
export function useIncomeFromDB(startDate: Date | null, endDate: Date | null) {
  return useQuery({
    queryKey: ["incomeDB", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchIncomeFromDB(startDate!, endDate!),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}

// --- Facturacion por mesas por rango de fechas ---
export function useTableBillingFromDB(startDate: Date | null, endDate: Date | null) {
  return useQuery({
    queryKey: ["tableBillingDB", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchTableBillingFromDB(startDate!, endDate!),
    staleTime: 15 * 60 * 1000,
    enabled: !!startDate && !!endDate,
  })
}
