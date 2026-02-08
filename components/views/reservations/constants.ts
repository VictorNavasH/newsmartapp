import { BRAND_COLORS } from "@/constants"

export type PeriodKey = "hoy" | "ayer" | "semana" | "mes" | "trimestre" | "custom"
export type YearlyMetric = "comensales" | "reservas"
export type YearlyTurno = "total" | "comida" | "cena"

export const YEAR_COLORS: Record<number, string> = {
  2021: "#94a3b8",
  2022: BRAND_COLORS.lunch,
  2023: BRAND_COLORS.error,
  2024: BRAND_COLORS.accent,
  2025: BRAND_COLORS.primary,
  2026: "#edadff",
  2027: "#f59e0b",
}

export const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export const activeTabStyle = `data-[state=active]:bg-[${BRAND_COLORS.primary}] data-[state=active]:text-white`
