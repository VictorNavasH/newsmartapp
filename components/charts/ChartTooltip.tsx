import { formatCurrency, formatNumber } from "@/lib/utils"

interface ChartTooltipItem {
  label: string
  value: string
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color?: string
    dataKey?: string
  }>
  label?: string
  formatter?: "currency" | "number" | ((value: number) => string)
  decimals?: number
  title?: string
  items?: ChartTooltipItem[]
}

export function ChartTooltip({ active, payload, label, formatter = "number", decimals = 0, title, items }: ChartTooltipProps) {
  // If items are provided directly, render them
  if (items) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        {title && <p className="mb-2 text-sm font-semibold text-slate-900">{title}</p>}
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || "#02b1c4" }} />
              <span className="text-slate-600">{item.label}:</span>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!active || !payload || !payload.length) return null

  const formatValue = (value: number): string => {
    if (typeof formatter === "function") {
      return formatter(value)
    }
    if (formatter === "currency") {
      return formatCurrency(value)
    }
    return formatNumber(value, decimals)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      {label && <p className="mb-2 text-sm font-semibold text-slate-900">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || "#02b1c4" }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-semibold text-slate-900">{formatValue(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
