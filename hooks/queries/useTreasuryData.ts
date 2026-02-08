"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchTreasuryKPIs,
  fetchTreasuryAccounts,
  fetchTreasuryTransactions,
  fetchTreasuryTransactionsSummary,
  fetchTreasuryCategories,
  fetchTreasuryByCategory,
  fetchTreasuryMonthlySummary,
  fetchPoolBancarioResumen,
  fetchPoolBancarioPrestamos,
  fetchPoolBancarioVencimientos,
  fetchPoolBancarioPorBanco,
  fetchPoolBancarioCalendario,
} from "@/lib/treasuryService"

// --- KPIs de tesoreria ---
export function useTreasuryKPIs(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["treasuryKPIs", startDate, endDate],
    queryFn: () => fetchTreasuryKPIs(startDate, endDate),
    staleTime: 15 * 60 * 1000,
  })
}

// --- Cuentas bancarias ---
export function useTreasuryAccounts() {
  return useQuery({
    queryKey: ["treasuryAccounts"],
    queryFn: fetchTreasuryAccounts,
    staleTime: 15 * 60 * 1000,
  })
}

// --- Transacciones con filtros y paginacion ---
export function useTreasuryTransactions(
  startDate?: string,
  endDate?: string,
  accountId?: string,
  categoryId?: string,
  tipo?: string,
  search?: string,
  limit = 100,
  offset = 0,
) {
  return useQuery({
    queryKey: ["treasuryTransactions", startDate, endDate, accountId, categoryId, tipo, search, limit, offset],
    queryFn: () => fetchTreasuryTransactions(startDate, endDate, accountId, categoryId, tipo, search, limit, offset),
    staleTime: 5 * 60 * 1000,
  })
}

// --- Resumen de transacciones (totales) ---
export function useTreasuryTransactionsSummary(
  startDate?: string,
  endDate?: string,
  accountId?: string,
  categoryId?: string,
  tipo?: string,
  search?: string,
) {
  return useQuery({
    queryKey: ["treasuryTransactionsSummary", startDate, endDate, accountId, categoryId, tipo, search],
    queryFn: () => fetchTreasuryTransactionsSummary(startDate, endDate, accountId, categoryId, tipo, search),
    staleTime: 5 * 60 * 1000,
  })
}

// --- Categorias de tesoreria ---
export function useTreasuryCategories() {
  return useQuery({
    queryKey: ["treasuryCategories"],
    queryFn: fetchTreasuryCategories,
    // Las categorias cambian muy poco
    staleTime: 30 * 60 * 1000,
  })
}

// --- Desglose de tesoreria por categoria ---
export function useTreasuryByCategory(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["treasuryByCategory", startDate, endDate],
    queryFn: () => fetchTreasuryByCategory(startDate, endDate),
    staleTime: 15 * 60 * 1000,
  })
}

// --- Resumen mensual de tesoreria ---
export function useTreasuryMonthlySummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["treasuryMonthlySummary", startDate, endDate],
    queryFn: () => fetchTreasuryMonthlySummary(startDate, endDate),
    staleTime: 15 * 60 * 1000,
  })
}

// --- Pool Bancario: resumen general ---
export function usePoolBancarioResumen() {
  return useQuery({
    queryKey: ["poolBancarioResumen"],
    queryFn: fetchPoolBancarioResumen,
    staleTime: 30 * 60 * 1000,
  })
}

// --- Pool Bancario: listado de prestamos ---
export function usePoolBancarioPrestamos() {
  return useQuery({
    queryKey: ["poolBancarioPrestamos"],
    queryFn: fetchPoolBancarioPrestamos,
    staleTime: 30 * 60 * 1000,
  })
}

// --- Pool Bancario: proximos vencimientos ---
export function usePoolBancarioVencimientos(limit = 10) {
  return useQuery({
    queryKey: ["poolBancarioVencimientos", limit],
    queryFn: () => fetchPoolBancarioVencimientos(limit),
    staleTime: 30 * 60 * 1000,
  })
}

// --- Pool Bancario: desglose por banco ---
export function usePoolBancarioPorBanco() {
  return useQuery({
    queryKey: ["poolBancarioPorBanco"],
    queryFn: fetchPoolBancarioPorBanco,
    staleTime: 30 * 60 * 1000,
  })
}

// --- Pool Bancario: calendario de pagos ---
export function usePoolBancarioCalendario(meses = 12) {
  return useQuery({
    queryKey: ["poolBancarioCalendario", meses],
    queryFn: () => fetchPoolBancarioCalendario(meses),
    staleTime: 30 * 60 * 1000,
  })
}
