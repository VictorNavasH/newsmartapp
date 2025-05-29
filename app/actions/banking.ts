"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const gocardlessSecretId = process.env.GOCARDLESS_SECRET_ID!
const gocardlessSecretKey = process.env.GOCARDLESS_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Check if banking tables exist
export async function checkBankingTables() {
  try {
    const tables = ["institutions", "accounts", "transactions", "requisitions"]
    const results = {}

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("id").limit(1)
        results[table] = !error
      } catch (err) {
        results[table] = false
      }
    }

    const allExist = Object.values(results).every((exists) => exists)
    return { success: true, tables: results, allExist }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// Actualizar la función getAccessToken para manejar mejor los errores
async function getAccessToken() {
  try {
    console.log("Getting GoCardless access token...")

    // Verificar que las credenciales existan
    if (!gocardlessSecretId || !gocardlessSecretKey) {
      throw new Error("Missing GoCardless credentials. Please check your environment variables.")
    }

    const response = await fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret_id: gocardlessSecretId,
        secret_key: gocardlessSecretKey,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("GoCardless token error:", response.status, errorText)
      throw new Error(`Failed to get access token: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    if (!data.access) {
      throw new Error("Invalid token response from GoCardless")
    }

    console.log("GoCardless token obtained successfully")
    return data.access
  } catch (error) {
    console.error("Error getting access token:", error)
    throw error
  }
}

// Actualizar la función syncInstitutions para filtrar bancos españoles
export async function syncInstitutions() {
  try {
    console.log("Starting institutions sync...")

    // First check if table exists
    const tableCheck = await checkBankingTables()
    if (!tableCheck.success || !tableCheck.tables.institutions) {
      return {
        success: false,
        error: "Institutions table does not exist. Please create tables first using the SQL script.",
      }
    }

    const token = await getAccessToken()

    console.log("Fetching institutions from GoCardless...")
    const response = await fetch("https://bankaccountdata.gocardless.com/api/v2/institutions/?country=ES", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("GoCardless institutions error:", response.status, errorText)
      throw new Error(`Failed to fetch institutions: ${response.status} - ${errorText}`)
    }

    const institutions = await response.json()
    console.log(`Fetched ${institutions.length} institutions from GoCardless`)

    // Filtrar solo bancos españoles principales
    const spanishBanks = institutions.filter(
      (inst) =>
        inst.countries?.includes("ES") ||
        ["CaixaBank", "BBVA", "Santander", "Sabadell", "Bankinter"].some((bank) =>
          inst.name.toLowerCase().includes(bank.toLowerCase()),
        ),
    )
    console.log(`Found ${spanishBanks.length} Spanish banks`)

    let successCount = 0
    let errorCount = 0

    // Store institutions in Supabase
    for (const institution of institutions) {
      try {
        const institutionData = {
          id: institution.id,
          name: institution.name,
          bic: institution.bic || null,
          logo: institution.logo || null,
          countries: institution.countries || [],
          transaction_total_days: institution.transaction_total_days || 90,
          supported_features: institution.supported_features || [],
          supported_payments: institution.supported_payments || [],
        }

        console.log(`Inserting institution: ${institution.name} (${institution.id})`)

        const { error } = await supabase.from("institutions").upsert(institutionData, {
          onConflict: "id",
        })

        if (error) {
          console.error(`Error inserting institution ${institution.name}:`, error)
          errorCount++
        } else {
          successCount++
        }
      } catch (institutionError) {
        console.error(`Error processing institution ${institution.name}:`, institutionError)
        errorCount++
      }
    }

    console.log(`Sync completed: ${successCount} success, ${errorCount} errors`)

    if (successCount === 0 && errorCount > 0) {
      throw new Error(`Failed to insert any institutions. ${errorCount} errors occurred.`)
    }

    return { success: true, count: successCount, errors: errorCount }
  } catch (error) {
    console.error("Error syncing institutions:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Get institutions from Supabase
export async function getInstitutions() {
  try {
    console.log("Getting institutions from Supabase...")

    // Check if table exists first
    const tableCheck = await checkBankingTables()
    if (!tableCheck.success || !tableCheck.tables.institutions) {
      console.log("Institutions table does not exist")
      return { success: true, data: [], needsSetup: true }
    }

    const { data, error } = await supabase.from("institutions").select("*").order("name")

    if (error) {
      console.error("Error getting institutions:", error)
      throw error
    }

    console.log(`Found ${data?.length || 0} institutions in Supabase`)
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error getting institutions:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Actualizar la función createBankConnection para especificar 90 días de histórico
export async function createBankConnection(institutionId: string) {
  try {
    console.log(`Creating bank connection for institution: ${institutionId}`)
    const token = await getAccessToken()

    // Get the correct redirect URL
    const redirectUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/banking/callback`
      : "https://nua-smart-dashboard.vercel.app/api/banking/callback"

    console.log("Using redirect URL:", redirectUrl)

    // Create end user agreement
    console.log("Creating end user agreement...")
    const agreementResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90, // Explícitamente solicitamos 90 días de histórico
        access_valid_for_days: 90,
        access_scope: ["balances", "details", "transactions"],
      }),
    })

    if (!agreementResponse.ok) {
      const errorText = await agreementResponse.text()
      console.error("Agreement creation error:", agreementResponse.status, errorText)
      throw new Error(`Failed to create agreement: ${agreementResponse.status} - ${errorText}`)
    }

    const agreement = await agreementResponse.json()
    console.log("Agreement created:", agreement.id)

    // Create requisition
    console.log("Creating requisition...")
    const requisitionResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/requisitions/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        agreement: agreement.id,
        reference: `req_${Date.now()}`,
        user_language: "ES",
      }),
    })

    if (!requisitionResponse.ok) {
      const errorText = await requisitionResponse.text()
      console.error("Requisition creation error:", requisitionResponse.status, errorText)
      throw new Error(`Failed to create requisition: ${requisitionResponse.status} - ${errorText}`)
    }

    const requisition = await requisitionResponse.json()
    console.log("Requisition created:", requisition.id)

    return { success: true, authUrl: requisition.link }
  } catch (error) {
    console.error("Error creating bank connection:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Get accounts from Supabase
export async function getAccounts(institutionId?: string) {
  try {
    console.log("Getting accounts from Supabase...")

    // Check if table exists first
    const tableCheck = await checkBankingTables()
    if (!tableCheck.success || !tableCheck.tables.accounts) {
      console.log("Accounts table does not exist")
      return { success: true, data: [] }
    }

    let query = supabase.from("accounts").select("*")

    if (institutionId) {
      query = query.eq("institution_id", institutionId)
    }

    const { data, error } = await query.order("name")

    if (error) {
      console.error("Error getting accounts:", error)
      throw error
    }

    console.log(`Found ${data?.length || 0} accounts in Supabase`)
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error getting accounts:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Get transactions from Supabase
export async function getTransactions(accountId?: string, limit = 50) {
  try {
    console.log("Getting transactions from Supabase...")

    // Check if table exists first
    const tableCheck = await checkBankingTables()
    if (!tableCheck.success || !tableCheck.tables.transactions) {
      console.log("Transactions table does not exist")
      return { success: true, data: [] }
    }

    let query = supabase.from("transactions").select("*")

    if (accountId) {
      query = query.eq("account_id", accountId)
    }

    const { data, error } = await query.order("date", { ascending: false }).limit(limit)

    if (error) {
      console.error("Error getting transactions:", error)
      throw error
    }

    console.log(`Found ${data?.length || 0} transactions in Supabase`)
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error getting transactions:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Get SQL script for manual table creation
export function getBankingTablesSQL() {
  return `-- Banking Tables for GoCardless Integration
-- Run this SQL in your Supabase SQL Editor

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bic TEXT,
  logo TEXT,
  countries TEXT[],
  transaction_total_days INTEGER DEFAULT 90,
  supported_features TEXT[],
  supported_payments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  name TEXT NOT NULL,
  iban TEXT,
  currency TEXT DEFAULT 'EUR',
  balance DECIMAL(15,2) DEFAULT 0,
  account_type TEXT,
  status TEXT DEFAULT 'active',
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  date DATE,
  creditor_name TEXT,
  debtor_name TEXT,
  merchant TEXT,
  category TEXT,
  type TEXT CHECK (type IN ('credit', 'debit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requisitions table
CREATE TABLE IF NOT EXISTS requisitions (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  agreement_id TEXT,
  status TEXT,
  link TEXT,
  reference TEXT,
  accounts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_requisitions_institution ON requisitions(institution_id);

-- Insert success message
SELECT 'Banking tables created successfully!' as message;`
}
