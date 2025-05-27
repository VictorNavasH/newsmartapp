"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

export type PeriodType = "dias" | "semanas" | "meses" | "años"

interface PeriodSelectorProps {
  selectedPeriod: PeriodType
  onPeriodChange: (period: PeriodType) => void
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const periods: { value: PeriodType; label: string }[] = [
    { value: "dias", label: "Días" },
    { value: "semanas", label: "Semanas" },
    { value: "meses", label: "Meses" },
    { value: "años", label: "Años" },
  ]

  const selectedLabel = periods.find((p) => p.value === selectedPeriod)?.label || "Meses"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-nua-primary focus:border-transparent"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => {
                onPeriodChange(period.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                selectedPeriod === period.value ? "bg-nua-primary text-white" : "text-gray-700"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
