"use client"

import { BRAND_COLORS } from "@/constants"

type Period = "week" | "month" | "quarter" | "year" | "hoy" | "ayer" | "semana" | "mes" | "trimestre"

interface PeriodSwitcherProps {
  value: string
  onChange: (period: string) => void
  periods: Period[]
}

const PERIOD_LABELS: Record<Period, string> = {
  week: "Semana",
  month: "Mes",
  quarter: "Trimestre",
  year: "Año",
  hoy: "Hoy",
  ayer: "Ayer",
  semana: "Semana",
  mes: "Mes",
  trimestre: "Trimestre",
}

export function PeriodSwitcher({ value, onChange, periods }: PeriodSwitcherProps) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
      {periods.map((period) => {
        const isActive = value === period
        return (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              isActive
                ? `bg-[${BRAND_COLORS.primary}] text-white shadow-sm`
                : `text-[${BRAND_COLORS.dark}] hover:bg-slate-200`
            }`}
          >
            {PERIOD_LABELS[period]}
          </button>
        )
      })}
    </div>
  )
}
