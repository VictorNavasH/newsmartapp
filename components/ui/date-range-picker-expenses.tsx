"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BRAND_COLORS } from "@/constants"

interface DateRangePickerExpensesProps {
  from: Date
  to: Date
  onChange: (range: { from: Date; to: Date }) => void
  className?: string
}

type PresetKey = "mes" | "mes_anterior" | "trimestre" | "ano"

const presets: { key: PresetKey; label: string }[] = [
  { key: "mes", label: "Este mes" },
  { key: "mes_anterior", label: "Mes anterior" },
  { key: "trimestre", label: "Trimestre" },
  { key: "ano", label: "Año" },
]

export function DateRangePickerExpenses({ from, to, onChange, className }: DateRangePickerExpensesProps) {
  const [fromOpen, setFromOpen] = React.useState(false)
  const [toOpen, setToOpen] = React.useState(false)
  const [activePreset, setActivePreset] = React.useState<PresetKey | null>("mes")

  const handleFromSelect = (date: Date | undefined) => {
    if (date) {
      const newTo = date > to ? date : to
      onChange({ from: date, to: newTo })
      setFromOpen(false)
      setActivePreset(null)
    }
  }

  const handleToSelect = (date: Date | undefined) => {
    if (date) {
      const newFrom = date < from ? date : from
      onChange({ from: newFrom, to: date })
      setToOpen(false)
      setActivePreset(null)
    }
  }

  const handlePreset = (preset: PresetKey) => {
    const today = new Date()
    let newFrom: Date
    let newTo: Date

    switch (preset) {
      case "mes":
        newFrom = startOfMonth(today)
        newTo = today
        break
      case "mes_anterior":
        const lastMonth = subMonths(today, 1)
        newFrom = startOfMonth(lastMonth)
        newTo = endOfMonth(lastMonth)
        break
      case "trimestre":
        newFrom = subMonths(startOfMonth(today), 2)
        newTo = today
        break
      case "ano":
        newFrom = startOfYear(today)
        newTo = today
        break
      default:
        return
    }

    onChange({ from: newFrom, to: newTo })
    setActivePreset(preset)
  }

  const formatDateDisplay = (date: Date) => {
    return format(date, "dd MMM yyyy", { locale: es })
  }

  const calendarStyles = {
    modifiersStyles: {
      selected: {
        backgroundColor: BRAND_COLORS.primary,
        color: "white",
      },
      today: {
        backgroundColor: "#f1f5f9",
        color: BRAND_COLORS.dark,
        fontWeight: 600,
      },
    },
    styles: {
      caption: { color: BRAND_COLORS.dark },
      head_cell: { color: BRAND_COLORS.accent },
    },
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => handlePreset(preset.key)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activePreset === preset.key ? "text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
            )}
            style={activePreset === preset.key ? { backgroundColor: BRAND_COLORS.primary } : undefined}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {/* Desde */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 font-medium">Desde:</span>
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("justify-start text-left font-normal bg-white border-slate-200 hover:bg-white h-8 px-2")}
                style={{ borderColor: fromOpen ? BRAND_COLORS.primary : undefined }}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" style={{ color: BRAND_COLORS.primary }} />
                <span className="text-slate-700 text-sm">{formatDateDisplay(from)}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={from}
                onSelect={handleFromSelect}
                defaultMonth={from}
                locale={es}
                weekStartsOn={1}
                {...calendarStyles}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Hasta */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 font-medium">Hasta:</span>
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("justify-start text-left font-normal bg-white border-slate-200 hover:bg-white h-8 px-2")}
                style={{ borderColor: toOpen ? BRAND_COLORS.primary : undefined }}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" style={{ color: BRAND_COLORS.primary }} />
                <span className="text-slate-700 text-sm">{formatDateDisplay(to)}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={to}
                onSelect={handleToSelect}
                defaultMonth={to}
                locale={es}
                weekStartsOn={1}
                disabled={(date) => date < from}
                {...calendarStyles}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
