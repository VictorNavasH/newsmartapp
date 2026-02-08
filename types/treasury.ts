// --- TREASURY MODELS ---

export interface TreasuryKPIs {
  saldo_total: number
  ingresos_periodo: number
  gastos_periodo: number
  ingresos_anterior: number
  gastos_anterior: number
  transacciones_sin_categorizar: number
  num_cuentas: number
}

export interface TreasuryAccount {
  id: string
  bank_name: string
  account_name: string
  iban: string
  balance: number
  currency: string
  last_sync: string | null
  is_active: boolean
  bank_logo: string | null
}

export interface TreasuryTransaction {
  id: string
  account_id: string
  account_name: string
  bank_name: string
  bank_logo: string | null
  booking_date: string
  value_date: string
  amount: number
  currency: string
  description: string
  category_id: string | null
  category_name: string | null
  category_type: string | null
  subcategory_id: string | null
  subcategory_name: string | null
  counterparty_name: string | null
  reference: string | null
  categorization_method?: "manual" | "rule" | "ai" | "imported" | null
}

export interface TreasuryTransactionsSummary {
  total_ingresos: number
  total_gastos: number
  num_transacciones: number
  num_sin_categorizar: number
}

export interface TreasurySubcategory {
  id: string
  name: string
}

export interface TreasuryCategory {
  id: string
  name: string
  type: string
  icon: string | null
  subcategories: TreasurySubcategory[]
}

export interface TreasuryCategoryBreakdown {
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  total_ingresos: number
  total_gastos: number
  num_transacciones: number
  porcentaje_gastos: number
}

export interface TreasuryMonthlySummary {
  mes: string // "2026-01"
  mes_label: string // "Ene"
  ingresos: number
  gastos: number
  balance: number
  num_transacciones: number
}
