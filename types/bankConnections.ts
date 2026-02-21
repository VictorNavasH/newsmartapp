// --- BANK CONNECTIONS (GoCardless Open Banking) ---

export interface BankAccount {
  id: string
  gocardless_id: string
  name: string
  iban: string | null
  balance: number
  currency: string
  status: string
  last_sync: string | null
  institution: {
    name: string
    logo: string | null
  }
}

export interface BankTransaction {
  id: string
  amount: number
  currency: string
  description: string
  date: string
  type: "credit" | "debit"
  account_name: string
  institution_name: string
  institution_logo: string | null
  creditor_name: string | null
  debtor_name: string | null
  balance_after: number
  account_id: string
}

export interface BankConsolidatedBalance {
  totalBalance: number
  accountCount: number
  bankCount: number
  accounts: BankAccount[]
}

export interface BankConsentInfo {
  daysUntilRenewal: number
  nextRenewalBank: string | null
  institutionId: string | null
}

export interface BankTransactionFilters {
  page: number
  limit: number
  search: string
  accountId: string | null
  startDate: string | null
  endDate: string | null
  type: "all" | "credit" | "debit"
}

export interface BankTransactionsResult {
  transactions: BankTransaction[]
  totalCount: number
  periodStats: {
    totalIncome: number
    totalExpenses: number
    netBalance: number
    transactionCount: number
  }
}

export interface BankSyncResult {
  success: boolean
  message: string
  synced?: {
    details: boolean
    balances: boolean
    transactions: number
  }
}

// --- CONNECT / RENEW FLOW ---

export interface BankInstitution {
  id: string
  gocardless_id: string
  name: string
  bic: string
  countries: string[]
  logo_url: string | null
  is_active: boolean
}

export type BankConnectStep =
  | "idle"
  | "selecting"
  | "creating"
  | "redirecting"
  | "processing"
  | "fetching"
  | "syncing"
  | "success"
  | "error"

export interface BankConnectedAccount {
  id: string
  name: string
  iban: string
  balance: number
  currency: string
}

export interface BankConnectState {
  step: BankConnectStep
  institutions: BankInstitution[]
  selectedInstitution: BankInstitution | null
  reference: string | null
  authLink: string | null
  error: string | null
  connectedAccounts: BankConnectedAccount[]
}

// --- SYNC STATUS ---

export interface SyncStatus {
  lastSyncAt: string | null
  rateLimits: {
    transactions: { remaining: number; limit: number }
    balances: { remaining: number; limit: number }
  }
  consentDaysRemaining: number | null
  consentInstitutionId: string | null
}

export interface BankCallbackParams {
  reference: string
  error?: string
}

export interface BankRequisitionCreateResult {
  success: boolean
  requisition_id?: string
  link?: string
  reference?: string
  institution?: {
    id: string
    gocardless_id: string
    name: string
  }
  error?: string
}

export interface BankRequisitionStatus {
  id: string
  status: "CR" | "GC" | "LN" | "RJ" | "EX" | string
  reference: string
  accounts?: string[]
  link?: string
}

export interface BankInitialSyncResult {
  success: boolean
  accounts_processed: number
  transactions_imported: number
  detailed_results: {
    accountId: string
    accountName: string
    success: boolean
    transactionsFound: number
    transactionsSaved: number
    error: string | null
  }[]
}
