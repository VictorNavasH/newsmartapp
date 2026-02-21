export const PAGE_SIZE = 50

export type TransactionTypeFilter = "all" | "credit" | "debit"

export const TYPE_LABELS: Record<TransactionTypeFilter, string> = {
  all: "Todos",
  credit: "Ingresos",
  debit: "Gastos",
}

export const BANK_COLORS: Record<string, string> = {
  CaixaBank: "#32CBFF",
  BBVA: "#004481",
  Santander: "#EC0000",
  Sabadell: "#00A6DE",
}

export const getBankColor = (bankName: string, fallbackIndex = 0): string => {
  const key = Object.keys(BANK_COLORS).find((k) =>
    bankName?.toLowerCase().includes(k.toLowerCase()),
  )
  if (key) return BANK_COLORS[key]
  const fallbackColors = ["#227c9d", "#17c3b2", "#ffcb77", "#fe6d73"]
  return fallbackColors[fallbackIndex % fallbackColors.length]
}

export const formatIBAN = (iban: string | null): string => {
  if (!iban) return ""
  return `****${iban.slice(-4)}`
}

export const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return "Nunca"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Ahora"
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}
