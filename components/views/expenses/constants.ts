import { BRAND_COLORS } from "@/constants"

export type StatusFilter = "all" | "partial" | "pending" | "overdue"
export type ProviderStatusFilter = "all" | "partial" | "pending" | "overdue"
export type ExpenseTab = "categoria" | "proveedor" | "calendario"

export const STATUS_LABELS: Record<string, string> = {
  all: "Todos",
  partial: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
}

export const STATUS_COLORS: Record<string, string> = {
  partial: BRAND_COLORS.success,
  pending: BRAND_COLORS.warning,
  overdue: BRAND_COLORS.error,
}

export const CATEGORY_COLORS = [
  BRAND_COLORS.primary,   // #02b1c4 cyan
  BRAND_COLORS.accent,    // #227c9d teal
  BRAND_COLORS.success,   // #17c3b2 verde
  BRAND_COLORS.lunch,     // #ffcb77 amarillo
  BRAND_COLORS.error,     // #fe6d73 rojo
  "#8b5cf6",              // violet (extended)
  "#ec4899",              // pink (extended)
  "#f59e0b",              // amber (extended)
]
