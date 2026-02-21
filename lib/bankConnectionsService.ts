import { supabase } from "./supabase"
import type {
  BankAccount,
  BankConsolidatedBalance,
  BankConsentInfo,
  BankTransaction,
  BankTransactionFilters,
  BankTransactionsResult,
  BankSyncResult,
  BankInstitution,
  BankRequisitionCreateResult,
  BankRequisitionStatus,
  BankConnectedAccount,
  BankInitialSyncResult,
} from "@/types"

// Helper para parsear un valor que puede ser JSON string, objeto, o número directo
const tryParseJson = (raw: unknown): unknown => {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

// Helper para parsear balances (pueden ser JSON string, objeto JSON, o número directo)
const parseBalance = (raw: unknown): number => {
  if (raw === null || raw === undefined) return 0
  const parsed = tryParseJson(raw)
  if (typeof parsed === "object" && parsed !== null) {
    return parseFloat((parsed as { amount?: string }).amount || "0")
  }
  return parseFloat(String(parsed))
}

// Helper para parsear amounts de transacciones (JSON string, objeto, o string numérico)
const parseAmount = (raw: unknown): number => {
  const parsed = tryParseJson(raw)
  if (typeof parsed === "object" && parsed !== null) {
    return parseFloat((parsed as { amount?: string }).amount || "0")
  }
  return parseFloat(String(parsed || "0"))
}

// Helper para extraer currency de amount JSON (soporta JSON string)
const parseCurrency = (raw: unknown, fallback = "EUR"): string => {
  const parsed = tryParseJson(raw)
  if (typeof parsed === "object" && parsed !== null) {
    return (parsed as { currency?: string }).currency || fallback
  }
  return fallback
}

export const fetchBankAccounts = async (): Promise<BankAccount[]> => {
  try {
    // Query accounts and institutions separately (no FK defined, PostgREST JOINs fail)
    const [accountsResult, institutionsResult] = await Promise.all([
      supabase
        .from("gocardless_accounts")
        .select("id, gocardless_id, name, display_name, iban, current_balance, currency, status, last_sync_at, institution_id")
        .in("status", ["ACTIVE", "READY"])
        .order("created_at", { ascending: false }),
      supabase
        .from("gocardless_institutions")
        .select("id, name, logo_url"),
    ])

    if (accountsResult.error) {
      console.error("[BankConnections] Error fetching accounts:", accountsResult.error)
      return []
    }

    // Build institution lookup map by uuid id
    const institutionMap = new Map<string, { name: string; logo_url: string | null }>()
    for (const inst of institutionsResult.data || []) {
      institutionMap.set(inst.id, { name: inst.name, logo_url: inst.logo_url })
    }

    return (accountsResult.data || []).map((acc: any) => {
      const inst = institutionMap.get(acc.institution_id)
      return {
        id: acc.id,
        gocardless_id: acc.gocardless_id,
        name: acc.display_name || acc.name || `Cuenta ${acc.gocardless_id?.substring(0, 8)}`,
        iban: acc.iban,
        balance: parseBalance(acc.current_balance),
        currency: acc.currency || "EUR",
        status: acc.status,
        last_sync: acc.last_sync_at,
        institution: {
          name: inst?.name || "Banco desconocido",
          logo: inst?.logo_url || null,
        },
      }
    })
  } catch (err) {
    console.error("[BankConnections] Error in fetchBankAccounts:", err)
    return []
  }
}

export const fetchConsolidatedBalance = async (): Promise<BankConsolidatedBalance> => {
  try {
    const accounts = await fetchBankAccounts()

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    const uniqueBanks = new Set(accounts.map((a) => a.institution.name))

    return {
      totalBalance,
      accountCount: accounts.length,
      bankCount: uniqueBanks.size,
      accounts,
    }
  } catch (err) {
    console.error("[BankConnections] Error in fetchConsolidatedBalance:", err)
    return { totalBalance: 0, accountCount: 0, bankCount: 0, accounts: [] }
  }
}

export const fetchBankTransactions = async (
  filters: Partial<BankTransactionFilters> = {}
): Promise<BankTransactionsResult> => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      accountId = null,
      startDate = null,
      endDate = null,
      type = "all",
    } = filters

    const offset = (page - 1) * limit

    // Query transactions sin JOINs implícitos (no hay FKs definidas en Supabase)
    let query = supabase
      .from("gocardless_transactions")
      .select("*", { count: "exact" })
      .order("booking_date", { ascending: false })

    if (search) {
      query = query.or(
        `remittance_information_unstructured.ilike.%${search}%,creditor_name.ilike.%${search}%,debtor_name.ilike.%${search}%`
      )
    }

    if (accountId && accountId !== "all") {
      const { data: accountData } = await supabase
        .from("gocardless_accounts")
        .select("gocardless_id")
        .eq("id", accountId)
        .single()

      if (accountData?.gocardless_id) {
        query = query.eq("account_gocardless_id", accountData.gocardless_id)
      }
    }

    if (startDate) {
      query = query.gte("booking_date", startDate)
    }
    if (endDate) {
      query = query.lte("booking_date", endDate)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: transactions, error, count } = await query

    if (error) {
      console.error("[BankConnections] Error fetching transactions:", error)
      return { transactions: [], totalCount: 0, periodStats: { totalIncome: 0, totalExpenses: 0, netBalance: 0, transactionCount: 0 } }
    }

    // Obtener cuentas e instituciones para resolver nombres (JOIN manual)
    const [accountsResult, institutionsResult] = await Promise.all([
      supabase
        .from("gocardless_accounts")
        .select("id, gocardless_id, display_name, institution_id"),
      supabase
        .from("gocardless_institutions")
        .select("id, name, logo_url"),
    ])

    // Maps para lookup rápido
    const accountByGocardlessId = new Map<string, any>()
    for (const acc of accountsResult.data || []) {
      accountByGocardlessId.set(acc.gocardless_id, acc)
    }
    const institutionById = new Map<string, { name: string; logo_url: string | null }>()
    for (const inst of institutionsResult.data || []) {
      institutionById.set(inst.id, { name: inst.name, logo_url: inst.logo_url })
    }

    // Transformar datos con JOINs manuales
    let transformed: BankTransaction[] = (transactions || []).map((tx: any) => {
      const amount = parseAmount(tx.amount)
      const balanceAfter = parseBalance(tx.balance_after_transaction)
      const account = accountByGocardlessId.get(tx.account_gocardless_id)
      const institution = account ? institutionById.get(account.institution_id) : null

      return {
        id: tx.id,
        amount,
        currency: parseCurrency(tx.amount, tx.currency || "EUR"),
        description: tx.remittance_information_unstructured || tx.creditor_name || "Transaccion",
        date: tx.booking_date,
        type: amount >= 0 ? ("credit" as const) : ("debit" as const),
        account_name: account?.display_name || "Cuenta",
        institution_name: institution?.name || "Banco",
        institution_logo: institution?.logo_url || null,
        creditor_name: tx.creditor_name,
        debtor_name: tx.debtor_name,
        balance_after: balanceAfter,
        account_id: tx.account_id,
      }
    })

    // Filtro por tipo (post-transform porque el tipo se calcula del amount)
    if (type && type !== "all") {
      transformed = transformed.filter((tx) => tx.type === type)
    }

    const totalIncome = transformed
      .filter((tx) => tx.type === "credit")
      .reduce((sum, tx) => sum + tx.amount, 0)
    const totalExpenses = Math.abs(
      transformed
        .filter((tx) => tx.type === "debit")
        .reduce((sum, tx) => sum + tx.amount, 0)
    )

    return {
      transactions: transformed,
      totalCount: count || 0,
      periodStats: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount: transformed.length,
      },
    }
  } catch (err) {
    console.error("[BankConnections] Error in fetchBankTransactions:", err)
    return { transactions: [], totalCount: 0, periodStats: { totalIncome: 0, totalExpenses: 0, netBalance: 0, transactionCount: 0 } }
  }
}

export const fetchConsentStatus = async (): Promise<BankConsentInfo> => {
  try {
    // Queries separadas (no hay FKs definidas para JOINs de PostgREST)
    const [reqResult, instResult] = await Promise.all([
      supabase
        .from("gocardless_requisitions")
        .select("id, expires_at, created_at, status, institution_id")
        .eq("status", "LN")
        .order("created_at", { ascending: false }),
      supabase
        .from("gocardless_institutions")
        .select("id, name"),
    ])

    const requisitions = reqResult.data
    if (reqResult.error || !requisitions || requisitions.length === 0) {
      return { daysUntilRenewal: 90, nextRenewalBank: null, institutionId: null }
    }

    // Map de instituciones para lookup
    const institutionMap = new Map<string, string>()
    for (const inst of instResult.data || []) {
      institutionMap.set(inst.id, inst.name)
    }

    let earliestRenewal: { date: Date; institutionName: string | null; institutionId: string | null } | null = null

    for (const req of requisitions) {
      let renewalDate: Date
      if (req.expires_at) {
        renewalDate = new Date(req.expires_at)
      } else {
        const createdDate = new Date(req.created_at)
        renewalDate = new Date(createdDate.getTime() + 90 * 24 * 60 * 60 * 1000)
      }

      if (!earliestRenewal || renewalDate < earliestRenewal.date) {
        earliestRenewal = {
          date: renewalDate,
          institutionName: institutionMap.get(req.institution_id) || null,
          institutionId: req.institution_id,
        }
      }
    }

    if (!earliestRenewal) {
      return { daysUntilRenewal: 90, nextRenewalBank: null, institutionId: null }
    }

    const now = new Date()
    const timeDiff = earliestRenewal.date.getTime() - now.getTime()
    const daysUntilRenewal = Math.max(0, Math.ceil(timeDiff / (24 * 60 * 60 * 1000)))

    return {
      daysUntilRenewal,
      nextRenewalBank: earliestRenewal.institutionName,
      institutionId: earliestRenewal.institutionId,
    }
  } catch (err) {
    console.error("[BankConnections] Error in fetchConsentStatus:", err)
    return { daysUntilRenewal: 90, nextRenewalBank: null, institutionId: null }
  }
}

export const triggerAccountSync = async (accountId: string): Promise<BankSyncResult> => {
  try {
    const response = await fetch(`/api/gocardless/accounts/${accountId}/full-sync`, {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: errorData.error || `Error al sincronizar (${response.status})`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      message: "Sincronizacion completada",
      synced: data.synced,
    }
  } catch (err) {
    console.error("[BankConnections] Error in triggerAccountSync:", err)
    return {
      success: false,
      message: "Error de conexion al sincronizar.",
    }
  }
}

export const getGoCardlessAppUrl = (): string | null => {
  return "/api/gocardless"
}

// --- CONNECT / RENEW FLOW ---

/**
 * Obtiene la lista de instituciones bancarias disponibles
 */
export const fetchInstitutions = async (
  country: string = "ES"
): Promise<BankInstitution[]> => {
  const baseUrl = getGoCardlessAppUrl()
  if (!baseUrl) return []

  try {
    const response = await fetch(
      `/api/gocardless/institutions?country=${encodeURIComponent(country)}`
    )

    if (!response.ok) {
      console.error("[BankConnections] Error fetching institutions:", response.status)
      return []
    }

    const data = await response.json()
    return (Array.isArray(data) ? data : []).map((inst: any) => ({
      id: inst.id,
      gocardless_id: inst.gocardless_id,
      name: inst.name,
      bic: inst.bic || "",
      countries: inst.countries || [],
      logo_url: inst.logo_url || null,
      is_active: inst.is_active !== false,
    }))
  } catch (err) {
    console.error("[BankConnections] Error in fetchInstitutions:", err)
    return []
  }
}

/**
 * Crea una requisition (solicitud de conexion bancaria)
 */
export const createRequisition = async (
  institutionId: string,
  redirectUrl: string,
  reference: string
): Promise<BankRequisitionCreateResult> => {
  const baseUrl = getGoCardlessAppUrl()
  if (!baseUrl) {
    return { success: false, error: "URL de GoCardless no configurada" }
  }

  try {
    const response = await fetch(`/api/gocardless/requisitions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution_id: institutionId,
        redirect_url: redirectUrl,
        reference,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error al crear requisition (${response.status})`,
      }
    }

    return {
      success: true,
      requisition_id: data.requisition_id,
      link: data.link,
      reference: data.reference,
      institution: data.institution,
    }
  } catch (err) {
    console.error("[BankConnections] Error in createRequisition:", err)
    return {
      success: false,
      error: "Error de conexion. Verifica que la app GoCardless esta activa.",
    }
  }
}

/**
 * Consulta el estado de una requisition por referencia
 */
export const pollRequisitionStatus = async (
  reference: string
): Promise<BankRequisitionStatus | null> => {
  const baseUrl = getGoCardlessAppUrl()
  if (!baseUrl) return null

  try {
    const response = await fetch(
      `/api/gocardless/requisitions/${encodeURIComponent(reference)}/status`
    )

    if (!response.ok) {
      console.error("[BankConnections] Error polling status:", response.status)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error("[BankConnections] Error in pollRequisitionStatus:", err)
    return null
  }
}

/**
 * Obtiene las cuentas vinculadas a una requisition completada
 */
export const fetchRequisitionAccounts = async (
  reference: string
): Promise<BankConnectedAccount[]> => {
  const baseUrl = getGoCardlessAppUrl()
  if (!baseUrl) return []

  try {
    const response = await fetch(
      `/api/gocardless/requisitions/${encodeURIComponent(reference)}/accounts`
    )

    if (!response.ok) {
      console.error("[BankConnections] Error fetching accounts:", response.status)
      return []
    }

    const data = await response.json()
    return (data.accounts || []).map((acc: any) => ({
      id: acc.id,
      name: acc.name || "Cuenta",
      iban: acc.iban || "",
      balance: typeof acc.balance === "number" ? acc.balance : parseFloat(acc.balance || "0"),
      currency: acc.currency || "EUR",
    }))
  } catch (err) {
    console.error("[BankConnections] Error in fetchRequisitionAccounts:", err)
    return []
  }
}

/**
 * Lanza la sincronizacion inicial de cuentas recien conectadas
 */
export const triggerInitialSync = async (
  accounts: BankConnectedAccount[]
): Promise<BankInitialSyncResult | null> => {
  const baseUrl = getGoCardlessAppUrl()
  if (!baseUrl) return null

  try {
    const response = await fetch(`/api/gocardless/sync/initial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accounts: accounts.map((acc) => ({
          id: acc.id,
          name: acc.name,
          currency: acc.currency,
        })),
      }),
    })

    if (!response.ok) {
      console.error("[BankConnections] Error in initial sync:", response.status)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error("[BankConnections] Error in triggerInitialSync:", err)
    return null
  }
}
