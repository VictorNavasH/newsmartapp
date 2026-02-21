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
