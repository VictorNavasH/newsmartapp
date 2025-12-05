import { supabase } from "./supabase"
import type {
  TreasuryKPIs,
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryTransactionsSummary,
  TreasuryCategory,
  TreasuryCategoryBreakdown,
} from "@/types"

// Helper para manejar errores de queries
const handleQueryError = (error: any, functionName: string): boolean => {
  if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
    console.warn(`[v0] ${functionName}: Vista/RPC no existe todavia`)
    return true
  }
  console.error(`[v0] Error in ${functionName}:`, error)
  return false
}

export const fetchTreasuryKPIs = async (startDate?: string, endDate?: string): Promise<TreasuryKPIs | null> => {
  try {
    const { data, error } = await supabase.rpc("get_treasury_kpis", {
      p_fecha_inicio: startDate || null,
      p_fecha_fin: endDate || null,
    })

    if (error) {
      handleQueryError(error, "fetchTreasuryKPIs")
      return null
    }

    // La RPC devuelve un array con un solo elemento
    return data?.[0] || null
  } catch (err) {
    console.error("[v0] Error fetching treasury KPIs:", err)
    return null
  }
}

export const fetchTreasuryAccounts = async (): Promise<TreasuryAccount[]> => {
  try {
    const { data, error } = await supabase.rpc("get_treasury_accounts")

    if (error) {
      handleQueryError(error, "fetchTreasuryAccounts")
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error fetching treasury accounts:", err)
    return []
  }
}

export const fetchTreasuryTransactions = async (
  startDate?: string,
  endDate?: string,
  accountId?: string,
  categoryId?: string,
  tipo?: string,
  search?: string,
  limit = 100,
  offset = 0,
): Promise<TreasuryTransaction[]> => {
  try {
    const { data, error } = await supabase.rpc("get_treasury_transactions", {
      p_fecha_inicio: startDate || null,
      p_fecha_fin: endDate || null,
      p_account_id: accountId || null,
      p_category_id: categoryId || null,
      p_tipo: tipo || null,
      p_search: search || null,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      handleQueryError(error, "fetchTreasuryTransactions")
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error fetching treasury transactions:", err)
    return []
  }
}

export const fetchTreasuryTransactionsSummary = async (
  startDate?: string,
  endDate?: string,
  accountId?: string,
  categoryId?: string,
  tipo?: string,
  search?: string,
): Promise<TreasuryTransactionsSummary | null> => {
  try {
    const { data, error } = await supabase.rpc("get_treasury_transactions_summary", {
      p_fecha_inicio: startDate || null,
      p_fecha_fin: endDate || null,
      p_account_id: accountId || null,
      p_category_id: categoryId || null,
      p_tipo: tipo || null,
      p_search: search || null,
    })

    if (error) {
      handleQueryError(error, "fetchTreasuryTransactionsSummary")
      return null
    }

    return data?.[0] || null
  } catch (err) {
    console.error("[v0] Error fetching treasury transactions summary:", err)
    return null
  }
}

export const fetchTreasuryCategories = async (): Promise<TreasuryCategory[]> => {
  try {
    const { data, error } = await supabase.rpc("get_treasury_categories")

    if (error) {
      handleQueryError(error, "fetchTreasuryCategories")
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Error fetching treasury categories:", err)
    return []
  }
}

export const updateTransactionCategory = async (
  transactionId: string,
  categoryId: string,
  subcategoryId?: string,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc("update_transaction_category", {
      p_transaction_id: transactionId,
      p_category_id: categoryId,
      p_subcategory_id: subcategoryId || null,
    })

    if (error) {
      console.error("[v0] Error updating transaction category:", error)
      return false
    }

    return data === true
  } catch (err) {
    console.error("[v0] Error in updateTransactionCategory:", err)
    return false
  }
}

export const fetchTreasuryByCategory = async (
  startDate?: string,
  endDate?: string,
): Promise<TreasuryCategoryBreakdown[]> => {
  try {
    console.log("[v0] fetchTreasuryByCategory - params:", { startDate, endDate })

    const { data, error } = await supabase.rpc("get_treasury_by_category", {
      p_fecha_inicio: startDate || null,
      p_fecha_fin: endDate || null,
    })

    if (error) {
      handleQueryError(error, "fetchTreasuryByCategory")
      return []
    }

    console.log("[v0] fetchTreasuryByCategory - raw data:", JSON.stringify(data))
    console.log("[v0] fetchTreasuryByCategory - count:", data?.length || 0)

    return data || []
  } catch (err) {
    console.error("[v0] Error fetching treasury by category:", err)
    return []
  }
}
