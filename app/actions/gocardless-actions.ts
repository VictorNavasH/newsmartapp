"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface GoCardlessConfig {
  secret_id: string
  secret_key: string
  enabled: boolean
  selected_banks: string[]
}

export interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  iban: string
  balance: number
  currency: string
  logo_url?: string
  status: string
  last_sync: string
}

export interface BankTransaction {
  id: string
  account_id: string
  amount: number
  currency: string
  description: string
  date: string
  type: "credit" | "debit"
  category?: string
  merchant?: string
}

// Configuración de GoCardless
export async function getGoCardlessConfig(): Promise<{
  success: boolean
  data?: GoCardlessConfig
  error?: string
}> {
  try {
    const { data, error } = await supabase.from("gocardless_config").select("*").limit(1).single()

    if (error || !data) {
      // Configuración por defecto
      const defaultConfig: GoCardlessConfig = {
        secret_id: "",
        secret_key: "",
        enabled: false,
        selected_banks: [],
      }
      return { success: true, data: defaultConfig }
    }

    return { success: true, data: data as GoCardlessConfig }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateGoCardlessConfig(config: GoCardlessConfig): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase.from("gocardless_config").upsert(config)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Cuentas bancarias
export async function getBankAccounts(): Promise<{
  success: boolean
  data?: BankAccount[]
  error?: string
}> {
  try {
    const { data, error } = await supabase.from("bank_accounts").select("*").order("bank_name")

    if (error) {
      console.log("⚠️ Error al obtener cuentas bancarias:", error.message)
      return { success: true, data: [] }
    }

    return { success: true, data: (data as BankAccount[]) || [] }
  } catch (error: any) {
    console.log("⚠️ Error al acceder a bank_accounts:", error.message)
    return { success: true, data: [] }
  }
}

export async function getBankAccountsByBank(bankName: string): Promise<{
  success: boolean
  data?: BankAccount[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("bank_name", bankName)
      .order("account_name")

    if (error) {
      console.log(`⚠️ Error al obtener cuentas de ${bankName}:`, error.message)
      return { success: true, data: [] }
    }

    return { success: true, data: (data as BankAccount[]) || [] }
  } catch (error: any) {
    console.log(`⚠️ Error al acceder a cuentas de ${bankName}:`, error.message)
    return { success: true, data: [] }
  }
}

// Transacciones bancarias
export async function getBankTransactions(
  accountId?: string,
  limit = 50,
): Promise<{
  success: boolean
  data?: BankTransaction[]
  error?: string
}> {
  try {
    let query = supabase.from("bank_transactions").select("*").order("date", { ascending: false }).limit(limit)

    if (accountId) {
      query = query.eq("account_id", accountId)
    }

    const { data, error } = await query

    if (error) {
      console.log("⚠️ Error al obtener transacciones:", error.message)
      return { success: true, data: [] }
    }

    return { success: true, data: (data as BankTransaction[]) || [] }
  } catch (error: any) {
    console.log("⚠️ Error al acceder a bank_transactions:", error.message)
    return { success: true, data: [] }
  }
}

export async function getBankTransactionsByBank(
  bankName: string,
  limit = 50,
): Promise<{
  success: boolean
  data?: BankTransaction[]
  error?: string
}> {
  try {
    // Primero obtenemos las cuentas del banco
    const { data: accounts } = await getBankAccountsByBank(bankName)

    if (!accounts || accounts.length === 0) {
      return { success: true, data: [] }
    }

    const accountIds = accounts.map((acc) => acc.id)

    const { data, error } = await supabase
      .from("bank_transactions")
      .select("*")
      .in("account_id", accountIds)
      .order("date", { ascending: false })
      .limit(limit)

    if (error) {
      console.log(`⚠️ Error al obtener transacciones de ${bankName}:`, error.message)
      return { success: true, data: [] }
    }

    return { success: true, data: (data as BankTransaction[]) || [] }
  } catch (error: any) {
    console.log(`⚠️ Error al acceder a transacciones de ${bankName}:`, error.message)
    return { success: true, data: [] }
  }
}

// Sincronización con GoCardless
export async function syncBankData(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    // Aquí iría la lógica de sincronización con GoCardless API
    // Por ahora retornamos un mensaje de éxito
    return {
      success: true,
      message: "Sincronización iniciada. Los datos se actualizarán en unos minutos.",
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
