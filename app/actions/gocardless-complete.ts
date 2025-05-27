"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const gocardlessSecretId = process.env.GOCARDLESS_SECRET_ID
const gocardlessSecretKey = process.env.GOCARDLESS_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey || !gocardlessSecretId || !gocardlessSecretKey) {
  throw new Error("Missing environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const GOCARDLESS_API_BASE = "https://bankaccountdata.gocardless.com/api/v2"

// Obtener token y guardarlo en Supabase
async function getAndStoreAccessToken(): Promise<string> {
  // Verificar si tenemos token válido en Supabase
  const { data: existingToken } = await supabase
    .from("gocardless_tokens")
    .select("*")
    .eq("active", true)
    .gte("expires_at", new Date().toISOString())
    .single()

  if (existingToken) {
    return existingToken.access_token
  }

  // Obtener nuevo token
  const response = await fetch(`${GOCARDLESS_API_BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret_id: gocardlessSecretId,
      secret_key: gocardlessSecretKey,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token error: ${response.status}`)
  }

  const tokenData = await response.json()

  // Guardar token en Supabase
  await supabase.from("gocardless_tokens").update({ active: false }).eq("active", true)

  await supabase.from("gocardless_tokens").insert({
    access_token: tokenData.access,
    refresh_token: tokenData.refresh,
    expires_at: new Date(Date.now() + tokenData.access_expires * 1000).toISOString(),
    active: true,
    created_at: new Date().toISOString(),
  })

  return tokenData.access
}

// Sincronizar instituciones y guardar en Supabase
export async function syncInstitutionsToSupabase(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const token = await getAndStoreAccessToken()

    const response = await fetch(`${GOCARDLESS_API_BASE}/institutions/?country=ES`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error(`Institutions error: ${response.status}`)
    }

    const institutions = await response.json()

    // Guardar cada institución en Supabase
    for (const inst of institutions) {
      await supabase.from("gocardless_institutions").upsert({
        id: inst.id,
        name: inst.name,
        bic: inst.bic,
        transaction_total_days: inst.transaction_total_days,
        countries: inst.countries,
        logo: inst.logo,
        supported_payments: inst.supported_payments,
        supported_features: inst.supported_features,
        identification_codes: inst.identification_codes,
        last_sync: new Date().toISOString(),
      })
    }

    console.log(`✅ Sincronizadas ${institutions.length} instituciones`)
    return { success: true, count: institutions.length }
  } catch (error: any) {
    console.error("❌ Error sincronizando instituciones:", error)
    return { success: false, error: error.message }
  }
}

// Crear acuerdo y guardar TODO en Supabase
export async function createBankConnection(institutionId: string): Promise<{
  success: boolean
  authUrl?: string
  agreementId?: string
  error?: string
}> {
  try {
    const token = await getAndStoreAccessToken()

    // 1. Crear End User Agreement
    const agreementResponse = await fetch(`${GOCARDLESS_API_BASE}/agreements/enduser/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ["balances", "details", "transactions"],
      }),
    })

    if (!agreementResponse.ok) {
      throw new Error(`Agreement error: ${agreementResponse.status}`)
    }

    const agreement = await agreementResponse.json()

    // 2. Guardar acuerdo en Supabase
    await supabase.from("gocardless_agreements").insert({
      id: agreement.id,
      institution_id: institutionId,
      max_historical_days: agreement.max_historical_days,
      access_valid_for_days: agreement.access_valid_for_days,
      access_scope: agreement.access_scope,
      accepted: agreement.accepted,
      status: "created",
      created_at: new Date().toISOString(),
    })

    // 3. Crear Requisition
    const requisitionResponse = await fetch(`${GOCARDLESS_API_BASE}/requisitions/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        redirect: `${process.env.VERCEL_URL || "http://localhost:3000"}/api/gocardless/callback`,
        institution_id: institutionId,
        agreement: agreement.id,
        reference: `req_${Date.now()}`,
        user_language: "ES",
      }),
    })

    if (!requisitionResponse.ok) {
      throw new Error(`Requisition error: ${requisitionResponse.status}`)
    }

    const requisition = await requisitionResponse.json()

    // 4. Guardar requisition en Supabase
    await supabase.from("gocardless_requisitions").insert({
      id: requisition.id,
      institution_id: institutionId,
      agreement_id: agreement.id,
      reference: requisition.reference,
      status: requisition.status,
      link: requisition.link,
      accounts: requisition.accounts || [],
      user_language: requisition.user_language,
      created_at: new Date().toISOString(),
    })

    console.log(`✅ Conexión creada para ${institutionId}`)
    return {
      success: true,
      authUrl: requisition.link,
      agreementId: agreement.id,
    }
  } catch (error: any) {
    console.error(`❌ Error creando conexión para ${institutionId}:`, error)
    return { success: false, error: error.message }
  }
}

// Procesar callback y sincronizar cuentas
export async function processCallback(requisitionId: string): Promise<{
  success: boolean
  accounts?: number
  error?: string
}> {
  try {
    const token = await getAndStoreAccessToken()

    // 1. Obtener requisition actualizada
    const reqResponse = await fetch(`${GOCARDLESS_API_BASE}/requisitions/${requisitionId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!reqResponse.ok) {
      throw new Error(`Requisition fetch error: ${reqResponse.status}`)
    }

    const requisition = await reqResponse.json()

    // 2. Actualizar requisition en Supabase
    await supabase
      .from("gocardless_requisitions")
      .update({
        status: requisition.status,
        accounts: requisition.accounts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)

    if (requisition.status !== "LN") {
      return { success: false, error: "Requisition not linked yet" }
    }

    let syncedAccounts = 0

    // 3. Procesar cada cuenta
    for (const accountId of requisition.accounts) {
      // Obtener detalles
      const detailsResponse = await fetch(`${GOCARDLESS_API_BASE}/accounts/${accountId}/details/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!detailsResponse.ok) continue

      const details = await detailsResponse.json()

      // Obtener balances
      const balanceResponse = await fetch(`${GOCARDLESS_API_BASE}/accounts/${accountId}/balances/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      let balance = 0
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        const closingBooked = balanceData.balances?.find((b: any) => b.balanceType === "closingBooked")
        balance = closingBooked ? Number.parseFloat(closingBooked.balanceAmount.amount) : 0
      }

      // Guardar cuenta en Supabase
      await supabase.from("bank_accounts").upsert({
        id: accountId,
        institution_id: requisition.institution_id,
        requisition_id: requisitionId,
        account_name: details.account?.name || details.account?.product || "Cuenta Principal",
        iban: details.account?.iban || "",
        bic: details.account?.bic || "",
        currency: details.account?.currency || "EUR",
        account_type: details.account?.cashAccountType || "CACC",
        balance: balance,
        status: "active",
        details: details.account,
        created_at: new Date().toISOString(),
        last_sync: new Date().toISOString(),
      })

      // Sincronizar transacciones
      await syncTransactionsForAccount(accountId, token)
      syncedAccounts++
    }

    console.log(`✅ Sincronizadas ${syncedAccounts} cuentas`)
    return { success: true, accounts: syncedAccounts }
  } catch (error: any) {
    console.error("❌ Error procesando callback:", error)
    return { success: false, error: error.message }
  }
}

// Sincronizar transacciones y guardar en Supabase
async function syncTransactionsForAccount(accountId: string, token: string): Promise<void> {
  try {
    const response = await fetch(`${GOCARDLESS_API_BASE}/accounts/${accountId}/transactions/`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) return

    const data = await response.json()

    for (const transaction of data.transactions?.booked || []) {
      await supabase.from("bank_transactions").upsert({
        id: transaction.transactionId || `${accountId}_${Date.now()}_${Math.random()}`,
        account_id: accountId,
        amount: Number.parseFloat(transaction.transactionAmount?.amount || "0"),
        currency: transaction.transactionAmount?.currency || "EUR",
        description: transaction.remittanceInformationUnstructured || transaction.additionalInformation || "",
        date: transaction.bookingDate || transaction.valueDate,
        value_date: transaction.valueDate,
        booking_date: transaction.bookingDate,
        type: Number.parseFloat(transaction.transactionAmount?.amount || "0") >= 0 ? "credit" : "debit",
        creditor_name: transaction.creditorName,
        debtor_name: transaction.debtorName,
        creditor_account: transaction.creditorAccount,
        debtor_account: transaction.debtorAccount,
        bank_transaction_code: transaction.bankTransactionCode,
        proprietary_bank_transaction_code: transaction.proprietaryBankTransactionCode,
        raw_data: transaction,
        created_at: new Date().toISOString(),
      })
    }

    console.log(`✅ Transacciones sincronizadas para cuenta ${accountId}`)
  } catch (error) {
    console.error(`❌ Error sincronizando transacciones para ${accountId}:`, error)
  }
}

// Obtener instituciones desde Supabase
export async function getInstitutionsFromSupabase(): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const { data, error } = await supabase.from("gocardless_institutions").select("*").order("name")

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Obtener cuentas por banco desde Supabase
export async function getBankAccountsFromSupabase(institutionId?: string): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    let query = supabase.from("bank_accounts").select("*")

    if (institutionId) {
      query = query.eq("institution_id", institutionId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Obtener transacciones desde Supabase
export async function getBankTransactionsFromSupabase(
  accountId?: string,
  limit = 100,
): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    let query = supabase.from("bank_transactions").select("*")

    if (accountId) {
      query = query.eq("account_id", accountId)
    }

    const { data, error } = await query.order("date", { ascending: false }).limit(limit)

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
