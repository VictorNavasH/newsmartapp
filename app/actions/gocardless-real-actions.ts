"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const gocardlessSecretId = process.env.GOCARDLESS_SECRET_ID
const gocardlessSecretKey = process.env.GOCARDLESS_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

if (!gocardlessSecretId || !gocardlessSecretKey) {
  throw new Error("Missing GoCardless environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const GOCARDLESS_API_BASE = "https://bankaccountdata.gocardless.com/api/v2"

// Obtener token de acceso
async function getAccessToken(): Promise<string> {
  const response = await fetch(`${GOCARDLESS_API_BASE}/token/new/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      secret_id: gocardlessSecretId,
      secret_key: gocardlessSecretKey,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GoCardless API Error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.access
}

// Validar credenciales
export async function validateCredentials(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await getAccessToken()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Obtener instituciones españolas
export async function getSpanishInstitutions(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; logo: string }>
  error?: string
}> {
  try {
    const token = await getAccessToken()

    const response = await fetch(`${GOCARDLESS_API_BASE}/institutions/?country=ES`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching institutions: ${response.status}`)
    }

    const institutions = await response.json()

    // Mapear a formato simple
    const mapped = institutions.map((inst: any) => ({
      id: inst.id,
      name: inst.name,
      logo: inst.logo || "🏦",
    }))

    return { success: true, data: mapped }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Crear acuerdo para un banco
export async function createBankAgreement(institutionId: string): Promise<{
  success: boolean
  authUrl?: string
  error?: string
}> {
  try {
    const token = await getAccessToken()

    // 1. Crear End User Agreement
    const agreementResponse = await fetch(`${GOCARDLESS_API_BASE}/agreements/enduser/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ["balances", "details", "transactions"],
      }),
    })

    if (!agreementResponse.ok) {
      const error = await agreementResponse.text()
      throw new Error(`Agreement creation failed: ${agreementResponse.status} - ${error}`)
    }

    const agreement = await agreementResponse.json()

    // 2. Crear Requisition
    const requisitionResponse = await fetch(`${GOCARDLESS_API_BASE}/requisitions/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        redirect: `${process.env.VERCEL_URL || "http://localhost:3000"}/configuracion?tab=conexiones&subtab=bancos&status=success`,
        institution_id: institutionId,
        agreement: agreement.id,
        reference: `req_${Date.now()}`,
        user_language: "ES",
      }),
    })

    if (!requisitionResponse.ok) {
      const error = await requisitionResponse.text()
      throw new Error(`Requisition creation failed: ${requisitionResponse.status} - ${error}`)
    }

    const requisition = await requisitionResponse.json()

    // 3. Guardar en Supabase
    await supabase.from("gocardless_callbacks").upsert({
      institution_id: institutionId,
      agreement_id: agreement.id,
      requisition_id: requisition.id,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    return {
      success: true,
      authUrl: requisition.link,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Sincronizar cuentas después de autorización
export async function syncAccountsFromRequisition(requisitionId: string): Promise<{
  success: boolean
  accounts?: number
  error?: string
}> {
  try {
    const token = await getAccessToken()

    // Obtener requisition
    const reqResponse = await fetch(`${GOCARDLESS_API_BASE}/requisitions/${requisitionId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!reqResponse.ok) {
      throw new Error(`Error fetching requisition: ${reqResponse.status}`)
    }

    const requisition = await reqResponse.json()

    if (requisition.status !== "LN") {
      return { success: false, error: "Requisition not yet linked" }
    }

    let syncedAccounts = 0

    // Procesar cada cuenta
    for (const accountId of requisition.accounts) {
      // Obtener detalles de la cuenta
      const detailsResponse = await fetch(`${GOCARDLESS_API_BASE}/accounts/${accountId}/details/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (!detailsResponse.ok) continue

      const details = await detailsResponse.json()

      // Obtener balance
      const balanceResponse = await fetch(`${GOCARDLESS_API_BASE}/accounts/${accountId}/balances/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      let balance = 0
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        const closingBooked = balanceData.balances?.find((b: any) => b.balanceType === "closingBooked")
        balance = closingBooked ? Number.parseFloat(closingBooked.balanceAmount.amount) : 0
      }

      // Guardar en Supabase
      await supabase.from("bank_accounts").upsert({
        id: accountId,
        bank_name: requisition.institution_id,
        account_name: details.account?.name || details.account?.product || "Cuenta Principal",
        iban: details.account?.iban || "",
        balance: balance,
        currency: details.account?.currency || "EUR",
        status: "active",
        last_sync: new Date().toISOString(),
      })

      syncedAccounts++
    }

    // Actualizar estado del callback
    await supabase.from("gocardless_callbacks").update({ status: "completed" }).eq("requisition_id", requisitionId)

    return { success: true, accounts: syncedAccounts }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Sincronizar transacciones de una cuenta
export async function syncTransactionsForAccount(accountId: string): Promise<{
  success: boolean
  transactions?: number
  error?: string
}> {
  try {
    const token = await getAccessToken()

    const response = await fetch(`${GOCARDLESS_API_BASE}/accounts/${accountId}/transactions/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching transactions: ${response.status}`)
    }

    const data = await response.json()
    let syncedTransactions = 0

    for (const transaction of data.transactions?.booked || []) {
      await supabase.from("bank_transactions").upsert({
        id: transaction.transactionId || `${accountId}_${Date.now()}_${Math.random()}`,
        account_id: accountId,
        amount: Number.parseFloat(transaction.transactionAmount?.amount || "0"),
        currency: transaction.transactionAmount?.currency || "EUR",
        description: transaction.remittanceInformationUnstructured || transaction.additionalInformation || "",
        date: transaction.bookingDate || transaction.valueDate,
        type: Number.parseFloat(transaction.transactionAmount?.amount || "0") >= 0 ? "credit" : "debit",
        merchant: transaction.creditorName || transaction.debtorName || null,
      })

      syncedTransactions++
    }

    return { success: true, transactions: syncedTransactions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
