"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchExpenseTags,
  fetchExpensesByTags,
  fetchExpensesByDueDate,
  fetchExpenseSummaryByTags,
  fetchExpenseSummaryByProvider,
} from "@/lib/dataService"

// --- Tags de gastos disponibles ---
export function useExpenseTags() {
  return useQuery({
    queryKey: ["expenseTags"],
    queryFn: fetchExpenseTags,
    // Los tags cambian muy poco, cache largo
    staleTime: 30 * 60 * 1000,
  })
}

// --- Gastos filtrados por tags, fechas y estado ---
export function useExpensesByTags(
  tags?: string[],
  startDate?: string,
  endDate?: string,
  status?: "paid" | "pending" | "overdue",
) {
  return useQuery({
    queryKey: ["expensesByTags", tags, startDate, endDate, status],
    queryFn: () => fetchExpensesByTags(tags, startDate, endDate, status),
    staleTime: 15 * 60 * 1000,
  })
}

// --- Gastos filtrados por fecha de vencimiento ---
export function useExpensesByDueDate(
  dueDateStart: string,
  dueDateEnd: string,
  status?: "paid" | "pending" | "overdue",
) {
  return useQuery({
    queryKey: ["expensesByDueDate", dueDateStart, dueDateEnd, status],
    queryFn: () => fetchExpensesByDueDate(dueDateStart, dueDateEnd, status),
    staleTime: 15 * 60 * 1000,
    enabled: !!dueDateStart && !!dueDateEnd,
  })
}

// --- Resumen de gastos agrupados por tags ---
export function useExpenseSummaryByTags(
  tags?: string[],
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["expenseSummaryByTags", tags, startDate, endDate],
    queryFn: () => fetchExpenseSummaryByTags(tags, startDate, endDate),
    staleTime: 15 * 60 * 1000,
  })
}

// --- Resumen de gastos agrupados por proveedor ---
export function useExpenseSummaryByProvider(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["expenseSummaryByProvider", startDate, endDate],
    queryFn: () => fetchExpenseSummaryByProvider(startDate, endDate),
    staleTime: 15 * 60 * 1000,
  })
}
