"use client"

export type PeriodOption = "hoy" | "ayer" | "ultimos7" | "ultimos30" | "semanaActual" | "mesActual"

interface PeriodDropdownProps {
  value: PeriodOption
  onChange: (value: PeriodOption) => void
  className?: string
}

export function PeriodDropdown({ value, onChange, className = "" }: PeriodDropdownProps) {
  const options = [
    { value: "hoy" as const, label: "Hoy" },
    { value: "ayer" as const, label: "Ayer" },
    { value: "ultimos7" as const, label: "Últimos 7 días" },
    { value: "ultimos30" as const, label: "Últimos 30 días" },
    { value: "semanaActual" as const, label: "Semana actual" },
    { value: "mesActual" as const, label: "Mes actual" },
  ]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PeriodOption)}
      className={`w-full text-xs border border-gray-200 rounded px-2 py-1 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
