"use client"

import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { TremorCard } from "@/components/ui/TremorCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatCurrency } from "@/lib/utils"
import type { Expense } from "@/types"
import {
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"

interface ExpensesCalendarioTabProps {
  calendarMonth: Date
  setCalendarMonth: (d: Date) => void
  calendarDays: Date[]
  calendarKPIs: { total: number; pagado: number; pendiente: number; vencido: number }
  loadingCalendar: boolean
  selectedDay: Date | null
  setSelectedDay: (d: Date | null) => void
  selectedDayExpenses: Expense[]
  getExpensesForDay: (day: Date) => Expense[]
  getDayStatus: (dayExpenses: Expense[]) => "partial" | "pending" | "overdue" | null
}

export function ExpensesCalendarioTab({
  calendarMonth,
  setCalendarMonth,
  calendarDays,
  calendarKPIs,
  loadingCalendar,
  selectedDay,
  setSelectedDay,
  selectedDayExpenses,
  getExpensesForDay,
  getDayStatus,
}: ExpensesCalendarioTabProps) {
  return (
    <div className="space-y-6">
      {/* KPIs del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TremorCard>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#02b1c4]" />
            <span className="text-xs font-medium text-slate-500">Total Mes</span>
          </div>
          <p className="text-2xl font-bold text-[#364f6b]">{formatCurrency(calendarKPIs.total)}</p>
        </TremorCard>
        <TremorCard>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[#17c3b2]" />
            <span className="text-xs font-medium text-slate-500">Pagado</span>
          </div>
          <p className="text-2xl font-bold text-[#17c3b2]">{formatCurrency(calendarKPIs.pagado)}</p>
        </TremorCard>
        <TremorCard>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#ffcb77]" />
            <span className="text-xs font-medium text-slate-500">Pendiente</span>
          </div>
          <p className="text-2xl font-bold text-[#ffcb77]">{formatCurrency(calendarKPIs.pendiente)}</p>
        </TremorCard>
        <TremorCard>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-[#fe6d73]" />
            <span className="text-xs font-medium text-slate-500">Vencido</span>
          </div>
          <p className="text-2xl font-bold text-[#fe6d73]">{formatCurrency(calendarKPIs.vencido)}</p>
        </TremorCard>
      </div>

      {/* Calendario */}
      <TremorCard>
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
            className="hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <h2 className="text-xl font-bold text-[#364f6b] capitalize">
            {format(calendarMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
            className="hover:bg-slate-100"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </Button>
        </div>

        {/* Dias de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
            <div key={day} className="text-center text-xs font-bold text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        {loadingCalendar ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02b1c4]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dayExpenses = getExpensesForDay(day)
              const dayStatus = getDayStatus(dayExpenses)
              const isCurrentMonth = isSameMonth(day, calendarMonth)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const dayIsToday = isToday(day)
              const totalDay = dayExpenses.reduce((sum, e) => sum + e.total_amount, 0)

              return (
                <button
                  key={idx}
                  onClick={() => dayExpenses.length > 0 && setSelectedDay(day)}
                  disabled={dayExpenses.length === 0}
                  className={`
                    relative min-h-[80px] p-2 rounded-lg border transition-all
                    ${!isCurrentMonth ? "bg-slate-50 text-slate-300" : "bg-white"}
                    ${isSelected ? "ring-2 ring-[#02b1c4] border-[#02b1c4]" : "border-slate-100"}
                    ${dayExpenses.length > 0 ? "cursor-pointer hover:border-[#02b1c4]/50 hover:shadow-sm" : "cursor-default"}
                    ${dayIsToday ? "bg-[#02b1c4]/5" : ""}
                  `}
                >
                  <span
                    className={`
                      text-sm font-medium
                      ${!isCurrentMonth ? "text-slate-300" : "text-slate-700"}
                      ${dayIsToday ? "text-[#02b1c4] font-bold" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </span>

                  {dayExpenses.length > 0 && isCurrentMonth && (
                    <div className="mt-1 space-y-1">
                      <div
                        className={`
                          inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white
                          ${dayStatus === "overdue" ? "bg-[#fe6d73]" : ""}
                          ${dayStatus === "pending" ? "bg-[#ffcb77]" : ""}
                          ${dayStatus === "partial" ? "bg-[#17c3b2]" : ""}
                        `}
                      >
                        {dayExpenses.length}
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 truncate">
                        {formatCurrency(totalDay)}
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#17c3b2]"></div>
            <span className="text-xs text-slate-600">Pagado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffcb77]"></div>
            <span className="text-xs text-slate-600">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#fe6d73]"></div>
            <span className="text-xs text-slate-600">Vencido</span>
          </div>
        </div>
      </TremorCard>

      {/* Sheet de detalle del dia */}
      <Sheet open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <SheetContent className="w-[400px] sm:w-[450px] p-0 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <SheetTitle className="text-lg font-bold text-[#364f6b]">
              Pagos del {selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: es }) : ""}
            </SheetTitle>
          </SheetHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Resumen del dia */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#17c3b2]/10 border border-[#17c3b2]/20 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pagado</p>
                <p className="text-sm font-bold text-[#17c3b2]">
                  {formatCurrency(
                    selectedDayExpenses
                      .filter((e) => e.status === "partial")
                      .reduce((sum, e) => sum + e.total_amount, 0),
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffcb77]/10 border border-[#ffcb77]/20 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pendiente</p>
                <p className="text-sm font-bold text-[#ffcb77]">
                  {formatCurrency(
                    selectedDayExpenses
                      .filter((e) => e.status === "pending")
                      .reduce((sum, e) => sum + e.total_amount, 0),
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#fe6d73]/10 border border-[#fe6d73]/20 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Vencido</p>
                <p className="text-sm font-bold text-[#fe6d73]">
                  {formatCurrency(
                    selectedDayExpenses
                      .filter((e) => e.status === "overdue")
                      .reduce((sum, e) => sum + e.total_amount, 0),
                  )}
                </p>
              </div>
            </div>

            {/* Lista de pagos */}
            <div className="space-y-3">
              {selectedDayExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`
                    p-4 rounded-xl border bg-white
                    ${expense.status === "overdue" ? "border-l-4 border-l-[#fe6d73]" : ""}
                    ${expense.status === "pending" ? "border-l-4 border-l-[#ffcb77]" : ""}
                    ${expense.status === "partial" ? "border-l-4 border-l-[#17c3b2]" : ""}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-[#364f6b]">{expense.proveedor}</p>
                      <p className="text-xs text-slate-500">{expense.document_number}</p>
                    </div>
                    <Badge
                      className={`
                        ${expense.status === "partial" ? "bg-[#17c3b2]/15 text-[#17c3b2]" : ""}
                        ${expense.status === "pending" ? "bg-[#ffcb77]/15 text-[#ffcb77]" : ""}
                        ${expense.status === "overdue" ? "bg-[#fe6d73]/15 text-[#fe6d73]" : ""}
                      `}
                    >
                      {expense.status === "partial" && "Pagado"}
                      {expense.status === "pending" && "Pendiente"}
                      {expense.status === "overdue" && "Vencido"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{expense.categoria_nombre}</span>
                    <span className="text-lg font-bold text-[#364f6b]">{formatCurrency(expense.total_amount)}</span>
                  </div>
                </div>
              ))}

              {selectedDayExpenses.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay pagos para este dia</p>
                </div>
              )}
            </div>

            {/* Total del dia */}
            {selectedDayExpenses.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Total del dia</span>
                  <span className="text-xl font-bold text-[#364f6b]">
                    {formatCurrency(selectedDayExpenses.reduce((sum, e) => sum + e.total_amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
