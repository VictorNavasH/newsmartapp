"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function insertTestData(): Promise<{
  success: boolean
  results?: any
  error?: string
}> {
  try {
    console.log("🧪 Iniciando inserción de datos de prueba...")

    // 1. Insertar token de prueba
    const tokenResult = await supabase.from("gocardless_tokens").insert({
      access_token: "test_token_12345",
      refresh_token: "test_refresh_12345",
      expires_at: new Date(Date.now() + 86400000).toISOString(), // 24h
      active: true,
      created_at: new Date().toISOString(),
    })

    console.log("✅ Token insertado:", tokenResult.error ? "ERROR" : "OK")

    // 2. Insertar instituciones de prueba
    const institutions = [
      {
        id: "BBVA_BBVAESMM",
        name: "BBVA España",
        bic: "BBVAESMM",
        transaction_total_days: 90,
        countries: ["ES"],
        logo: "https://cdn.gocardless.com/ais/BBVA_BBVAESMM.png",
        supported_payments: {},
        supported_features: ["account_selection", "business_accounts"],
        identification_codes: [],
        last_sync: new Date().toISOString(),
      },
      {
        id: "CAIXESBB_CAIXESBB",
        name: "CaixaBank",
        bic: "CAIXESBB",
        transaction_total_days: 90,
        countries: ["ES"],
        logo: "https://cdn.gocardless.com/ais/CAIXESBB_CAIXESBB.png",
        supported_payments: {},
        supported_features: ["account_selection", "business_accounts"],
        identification_codes: [],
        last_sync: new Date().toISOString(),
      },
      {
        id: "BSABESBB_BSABESBB",
        name: "Banco Sabadell",
        bic: "BSABESBB",
        transaction_total_days: 90,
        countries: ["ES"],
        logo: "https://cdn.gocardless.com/ais/BSABESBB_BSABESBB.png",
        supported_payments: {},
        supported_features: ["account_selection"],
        identification_codes: [],
        last_sync: new Date().toISOString(),
      },
    ]

    const institutionsResult = await supabase.from("gocardless_institutions").insert(institutions)
    console.log("✅ Instituciones insertadas:", institutionsResult.error ? "ERROR" : "OK")

    // 3. Insertar acuerdo de prueba
    const agreementResult = await supabase.from("gocardless_agreements").insert({
      id: "test_agreement_12345",
      institution_id: "BBVA_BBVAESMM",
      max_historical_days: 90,
      access_valid_for_days: 90,
      access_scope: ["balances", "details", "transactions"],
      accepted: true,
      status: "accepted",
      created_at: new Date().toISOString(),
    })

    console.log("✅ Acuerdo insertado:", agreementResult.error ? "ERROR" : "OK")

    // 4. Insertar requisition de prueba
    const requisitionResult = await supabase.from("gocardless_requisitions").insert({
      id: "test_requisition_12345",
      institution_id: "BBVA_BBVAESMM",
      agreement_id: "test_agreement_12345",
      reference: "req_test_12345",
      status: "LN",
      link: "https://gocardless.com/link/test",
      accounts: ["test_account_12345", "test_account_67890"],
      user_language: "ES",
      created_at: new Date().toISOString(),
    })

    console.log("✅ Requisition insertada:", requisitionResult.error ? "ERROR" : "OK")

    // 5. Insertar cuentas de prueba
    const accounts = [
      {
        id: "test_account_12345",
        institution_id: "BBVA_BBVAESMM",
        requisition_id: "test_requisition_12345",
        account_name: "Cuenta Corriente BBVA",
        iban: "ES9121000418450200051332",
        bic: "BBVAESMM",
        currency: "EUR",
        account_type: "CACC",
        balance: 15420.5,
        status: "active",
        details: {
          name: "Cuenta Corriente BBVA",
          product: "Cuenta Online",
          cashAccountType: "CACC",
        },
        created_at: new Date().toISOString(),
        last_sync: new Date().toISOString(),
      },
      {
        id: "test_account_67890",
        institution_id: "BBVA_BBVAESMM",
        requisition_id: "test_requisition_12345",
        account_name: "Cuenta Ahorro BBVA",
        iban: "ES9121000418450200051333",
        bic: "BBVAESMM",
        currency: "EUR",
        account_type: "SVGS",
        balance: 8750.25,
        status: "active",
        details: {
          name: "Cuenta Ahorro BBVA",
          product: "Cuenta Ahorro",
          cashAccountType: "SVGS",
        },
        created_at: new Date().toISOString(),
        last_sync: new Date().toISOString(),
      },
    ]

    const accountsResult = await supabase.from("bank_accounts").insert(accounts)
    console.log("✅ Cuentas insertadas:", accountsResult.error ? "ERROR" : "OK")

    // 6. Insertar transacciones de prueba
    const transactions = [
      {
        id: "txn_001",
        account_id: "test_account_12345",
        amount: -45.6,
        currency: "EUR",
        description: "Compra en Mercadona",
        date: "2024-01-15",
        value_date: "2024-01-15",
        booking_date: "2024-01-15",
        type: "debit",
        creditor_name: "MERCADONA S.A.",
        debtor_name: null,
        creditor_account: null,
        debtor_account: null,
        bank_transaction_code: "PMNT",
        proprietary_bank_transaction_code: "CARD_PAYMENT",
        raw_data: {},
        created_at: new Date().toISOString(),
      },
      {
        id: "txn_002",
        account_id: "test_account_12345",
        amount: 2500.0,
        currency: "EUR",
        description: "Nómina enero",
        date: "2024-01-01",
        value_date: "2024-01-01",
        booking_date: "2024-01-01",
        type: "credit",
        creditor_name: null,
        debtor_name: "EMPRESA EJEMPLO S.L.",
        creditor_account: null,
        debtor_account: null,
        bank_transaction_code: "RCDT",
        proprietary_bank_transaction_code: "SALARY",
        raw_data: {},
        created_at: new Date().toISOString(),
      },
      {
        id: "txn_003",
        account_id: "test_account_12345",
        amount: -850.0,
        currency: "EUR",
        description: "Alquiler enero",
        date: "2024-01-05",
        value_date: "2024-01-05",
        booking_date: "2024-01-05",
        type: "debit",
        creditor_name: "INMOBILIARIA EJEMPLO",
        debtor_name: null,
        creditor_account: null,
        debtor_account: null,
        bank_transaction_code: "PMNT",
        proprietary_bank_transaction_code: "TRANSFER",
        raw_data: {},
        created_at: new Date().toISOString(),
      },
    ]

    const transactionsResult = await supabase.from("bank_transactions").insert(transactions)
    console.log("✅ Transacciones insertadas:", transactionsResult.error ? "ERROR" : "OK")

    // 7. Verificar datos insertados
    const verification = await Promise.all([
      supabase.from("gocardless_tokens").select("count", { count: "exact" }),
      supabase.from("gocardless_institutions").select("count", { count: "exact" }),
      supabase.from("gocardless_agreements").select("count", { count: "exact" }),
      supabase.from("gocardless_requisitions").select("count", { count: "exact" }),
      supabase.from("bank_accounts").select("count", { count: "exact" }),
      supabase.from("bank_transactions").select("count", { count: "exact" }),
    ])

    const results = {
      tokens: verification[0].count,
      institutions: verification[1].count,
      agreements: verification[2].count,
      requisitions: verification[3].count,
      accounts: verification[4].count,
      transactions: verification[5].count,
    }

    console.log("📊 Datos en Supabase:", results)

    return {
      success: true,
      results: results,
    }
  } catch (error: any) {
    console.error("❌ Error insertando datos de prueba:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function clearTestData(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log("🧹 Limpiando datos de prueba...")

    await Promise.all([
      supabase.from("bank_transactions").delete().like("id", "txn_%"),
      supabase.from("bank_accounts").delete().like("id", "test_account_%"),
      supabase.from("gocardless_requisitions").delete().like("id", "test_requisition_%"),
      supabase.from("gocardless_agreements").delete().like("id", "test_agreement_%"),
      supabase
        .from("gocardless_institutions")
        .delete()
        .in("id", ["BBVA_BBVAESMM", "CAIXESBB_CAIXESBB", "BSABESBB_BSABESBB"]),
      supabase.from("gocardless_tokens").delete().eq("access_token", "test_token_12345"),
    ])

    console.log("✅ Datos de prueba eliminados")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error limpiando datos:", error)
    return { success: false, error: error.message }
  }
}
