"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BRAND_COLORS } from "@/constants"

interface DateRangePickerProps {
  from: Date
  to: Date
  onChange: (range: { from: Date; to: Date }) => void
  className?: string
}

export function DateRangePicker({ from, to, onChange, className }: DateRangePickerProps) {
  const [openFrom, setOpenFrom] = React.useState(false)
  const [openTo, setOpenTo] = React.useState(false)

  const isSameOrAfter = (date1: Date, date2: Date) => {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
    return d1.getTime() >= d2.getTime()
  }

  const isSameOrBefore = (date1: Date, date2: Date) => {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
    return d1.getTime() <= d2.getTime()
  }

  const handleFromChange = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
      // Si la fecha desde es mayor que hasta, ajustar hasta
      const newTo = isSameOrAfter(normalizedDate, to) ? normalizedDate : to
      onChange({ from: normalizedDate, to: newTo })
      setOpenFrom(false)
    }
  }

  const handleToChange = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
      // Si la fecha hasta es menor que desde, ajustar desde
      const newFrom = isSameOrBefore(normalizedDate, from) ? normalizedDate : from
      onChange({ from: newFrom, to: normalizedDate })
      setOpenTo(false)
    }
  }

  const formatDateDisplay = (date: Date) => {
    return format(date, "dd MMM yyyy", { locale: es })
  }

  const calendarStyles = {
    selected: {
      backgroundColor: BRAND_COLORS.primary,
      color: "white",
    },
    today: {
      backgroundColor: "#f1f5f9",
      color: BRAND_COLORS.dark,
      fontWeight: 600,
    },
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Desde */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-medium">Desde</span>
        <Popover open={openFrom} onOpenChange={setOpenFrom}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal bg-white border-slate-200 hover:bg-white transition-colors h-9 px-3",
              )}
              style={{ borderColor: openFrom ? BRAND_COLORS.primary : undefined }}
            >
              <CalendarIcon className="mr-2 h-4 w-4" style={{ color: BRAND_COLORS.primary }} />
              <span className="text-slate-700 text-sm">{formatDateDisplay(from)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={from}
              onSelect={handleFromChange}
              defaultMonth={from}
              locale={es}
              weekStartsOn={1}
              disabled={(date) => isSameOrAfter(date, to) && date.getDate() !== to.getDate()}
              modifiersStyles={calendarStyles}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Hasta */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-medium">Hasta</span>
        <Popover open={openTo} onOpenChange={setOpenTo}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal bg-white border-slate-200 hover:bg-white transition-colors h-9 px-3",
              )}
              style={{ borderColor: openTo ? BRAND_COLORS.primary : undefined }}
            >
              <CalendarIcon className="mr-2 h-4 w-4" style={{ color: BRAND_COLORS.primary }} />
              <span className="text-slate-700 text-sm">{formatDateDisplay(to)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={to}
              onSelect={handleToChange}
              defaultMonth={to}
              locale={es}
              weekStartsOn={1}
              disabled={(date) => isSameOrBefore(date, from) && date.getDate() !== from.getDate()}
              modifiersStyles={calendarStyles}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
