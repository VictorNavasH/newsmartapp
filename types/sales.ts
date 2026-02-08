// --- Domain Models ---

import type { ExpenseStats } from './expenses'

export type ShiftType = "LUNCH" | "DINNER"

export interface PaymentMethods {
  card: number
  cash: number
  digital: number // Apps, Apple Pay specifically tracked if needed
}

export interface SalesItem {
  id: string
  name: string
  category: string
  quantity: number
  revenue: number
}

export interface CategorySales {
  name: string
  quantity: number
  revenue: number
}

export interface ModifierStats {
  with_options: number // Count of items sold with modifiers
  without_options: number
  total_items: number // Sub-set of items that actually HAVE options
}

export interface SalesBreakdown {
  categories: CategorySales[]
  top_products: SalesItem[]
  // In a real DB we query "Bottom 10", here we just store the full list or a subset
  all_products: SalesItem[]
  modifiers: ModifierStats
}

export interface TableSales {
  id: string
  name: string
  revenue: number
}

export interface ShiftMetrics {
  reservations: number
  pax: number
  tables: number
  occupancy_rate: number // Percentage 0-100

  // Averages - Operational
  avg_pax_per_res: number
  avg_pax_per_table: number

  tables_used: number // mesas_ocupadas
  table_rotation: number // rotacion_mesas
  avg_pax_per_table_used: number // media_comensales_por_mesa

  // Financials
  revenue: number
  tips: number
  tips_count: number // Number of times a tip was left
  transactions: number // Number of tickets/sales
  avg_ticket_transaction: number // Revenue / Transactions

  // VeriFactu Realtime Status
  verifactu_metrics: {
    success: number
    error: number
    pending: number
  }

  // Expenses
  expenses: ExpenseStats

  // Averages - Financial
  avg_ticket_res: number
  avg_ticket_pax: number
  avg_ticket_table: number

  payment_methods: PaymentMethods

  // Product Sales Data
  sales_data: SalesBreakdown

  // Table Breakdown
  tables_breakdown: TableSales[]
}

export interface DailyCompleteMetrics {
  date: string
  // Aggregated totals
  total: ShiftMetrics
  // Shift breakdowns
  lunch: ShiftMetrics
  dinner: ShiftMetrics
  capacity?: {
    plazas_turno: number // 66
    plazas_dia: number // 132
    mesas_turno: number // 19
    mesas_dia: number // 38
  }
}
