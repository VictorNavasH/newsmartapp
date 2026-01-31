import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as fnsFormat, isValid } from "date-fns"
import { es } from "date-fns/locale"

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num)
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  const v = value ?? 0
  if (Math.abs(v) >= 1000) {
    return `${(v / 1000).toFixed(0)}k`
  }
  return `${v.toFixed(0)}€`
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatDateFromString(dateStr: string | Date | null | undefined, pattern = "dd/MM/yyyy"): string {
  if (!dateStr) return "-"
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr
    if (!isValid(date)) return String(dateStr)
    return fnsFormat(date, pattern, { locale: es })
  } catch {
    return String(dateStr ?? "")
  }
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
