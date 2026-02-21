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

// Helper para parsear balances (pueden ser JSON o número directo)
const parseBalance = (raw: unknown): number => {
  if (raw === null || raw === undefined) return 0
  if (typeof raw === "object" && raw !== null) {
    return parseFloat((raw as { amount?: string }).amount || "0")
  }
  return parseFloat(String(raw))
}

// Helper para parsear amounts de transacciones (JSON o string)
const parseAmount = (raw: unknown): number => {
  if (typeof raw === "object" && raw !== null) {
    return parseFloat((raw as { amount?: string }).amount || "0")
  }
  return parseFloat(String(raw || "0"))
}

// Helper para extraer currency de amount JSON
const parseCurrency = (raw: unknown, fallback = "EUR"): string => {
  if (typeof raw === "object" && raw !== null) {
    return (raw as { currency?: string }).currency || fallback
  }
  return fallback
}

export const fetchBankAccounts = async (): Promise<BankAccount[]> => {
  try {
    const { data, error } = await supabase
      .from("gocardless_accounts")
      .select(`
        id,
        gocardless_id,
        name,
        display_name,
        iban,
        current_balance,
        currency,
        status,
        last_sync_at,
        institution_id,
        gocardless_institutions(name, logo_url)
      `)
      .in("status", ["ACTIVE", "READY"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[BankConnections] Error fetching accounts:", error)
      return []
    }

    return (data || []).map((acc: any) => ({
      id: acc.id,
      gocardless_id: acc.gocardless_id,
      name: acc.display_name || acc.name || `Cuenta ${acc.gocardless_id?.substring(0, 8)}`,
      iban: acc.iban,
      balance: parseBalance(acc.current_balance),
      currency: acc.currency || "EUR",
      status: acc.status,
      last_sync: acc.last_sync_at,
      institution: {
        name: acc.gocardless_institutions?.name || "Banco desconocido",
        logo: acc.gocardless_institutions?.logo_url || null,
      },
    }))
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

    let query = supabase
      .from("gocardless_transactions")
      .select(
        `
        *,
        gocardless_accounts!inner(
          id,
          display_name,
          institution_id,
          gocardless_institutions!inner(name, logo_url)
        )
      `,
        { count: "exact" }
      )
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

    // Transformar datos
    let transformed: BankTransaction[] = (transactions || []).map((tx: any) => {
      const amount = parseAmount(tx.amount)
      const balanceAfter = parseBalance(tx.balance_after_transaction)

      return {
        id: tx.id,
        amount,
        currency: parseCurrency(tx.amount, tx.currency || "EUR"),
        description: tx.remittance_information_unstructured || tx.creditor_name || "Transaccion",
        date: tx.booking_date,
        type: amount >= 0 ? ("credit" as const) : ("debit" as const),
        account_name: tx.gocardless_accounts?.display_name || "Cuenta",
        institution_name: tx.gocardless_accounts?.gocardless_institutions?.name || "Banco",
        institution_logo: tx.gocardless_accounts?.gocardless_institutions?.logo_url || null,
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
    const { data: requisitions, error } = await supabase
      .from("gocardless_requisitions")
      .select("id, expires_at, created_at, status, institution_id, gocardless_institutions(name)")
      .eq("status", "LN")
      .order("created_at", { ascending: false })

    if (error || !requisitions || requisitions.length === 0) {
      return { daysUntilRenewal: 90, nextRenewalBank: null, institutionId: null }
    }

    let earliestRenewal: { date: Date; institutionName: string; institutionId: string | null } | null = null

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
          institutionName: (req as any).gocardless_institutions?.name || null,
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
  const baseUrl = process.env.NEXT_PUBLIC_GOCARDLESS_APP_URL
  if (!baseUrl) {
    return {
      success: false,
      message: "URL de la app GoCardless no configurada. Configura NEXT_PUBLIC_GOCARDLESS_APP_URL.",
    }
  }

  try {
    const response = await fetch(`${baseUrl}/api/accounts/${accountId}/full-sync`, {
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
      message: "Error de conexion al sincronizar. Verifica que la app GoCardless esta activa.",
    }
  }
}

export const getGoCardlessAppUrl = (): string | null => {
  return process.env.NEXT_PUBLIC_GOCARDLESS_APP_URL || null
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
      `${baseUrl}/api/institutions?country=${encodeURIComponent(country)}`
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
    const response = await fetch(`${baseUrl}/api/requisitions/create`, {
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
      `${baseUrl}/api/requisitions/status/${encodeURIComponent(reference)}`
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
      `${baseUrl}/api/requisitions/accounts/${encodeURIComponent(reference)}`
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
    const response = await fetch(`${baseUrl}/api/sync/initial`, {
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
