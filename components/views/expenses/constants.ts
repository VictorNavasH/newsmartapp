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
  partial: "#17c3b2",
  pending: BRAND_COLORS.warning,
  overdue: BRAND_COLORS.error,
}

export const CATEGORY_COLORS = [
  BRAND_COLORS.primary,
  BRAND_COLORS.accent,
  "#49eada",
  BRAND_COLORS.lunch,
  BRAND_COLORS.error,
  "#8b5cf6",
  "#ec4899",
  "#f97316",
]
