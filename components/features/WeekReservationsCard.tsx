"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { TremorCard } from "../ui/TremorCard"
import { fetchWeekReservations } from "../../lib/dataService"
import type { WeekReservationDay } from "../../types"
import { CalendarDays, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react"

export const WeekReservationsCard: React.FC = () => {
  const [days, setDays] = useState<WeekReservationDay[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchWeekReservations(weekOffset)
      setDays(data)
      setLoading(false)
    }
    load()
  }, [weekOffset])

  const totalWeekReservations = days.reduce((acc, curr) => acc + curr.reservations, 0)
  const avgWeekOccupancy = days.length > 0 ? days.reduce((acc, curr) => acc + curr.occupancyTotal, 0) / days.length : 0

  // Calculate range label for header
  const startLabel =
    days.length > 0 ? new Date(days[0].date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""
  const endLabel =
    days.length > 0
      ? new Date(days[days.length - 1].date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
      : ""

  if (loading) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl"></div>

  return (
    <TremorCard className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#02b1c4]" />
          <div>
            <h3 className="font-bold text-[#364f6b]">Reservas Semana</h3>
            <p className="text-xs text-slate-400 capitalize">
              {startLabel} - {endLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Controls */}
          <div className="flex bg-slate-100 rounded-md p-0.5 mr-2">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 hover:bg-white rounded-md text-[#364f6b] transition-all shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="px-2 flex items-center justify-center text-xs font-medium text-slate-500 min-w-[50px]">
              {weekOffset === 0
                ? "Actual"
                : weekOffset === 1
                  ? "+1 Sem"
                  : weekOffset === -1
                    ? "-1 Sem"
                    : `${weekOffset > 0 ? "+" : ""}${weekOffset}`}
            </div>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 hover:bg-white rounded-md text-[#364f6b] transition-all shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-[#17c3b2]/10 px-3 py-1 rounded-lg text-center">
            <span className="text-[10px] text-[#17c3b2] font-bold block">Ocupación</span>
            <span className="text-lg font-bold text-[#17c3b2] leading-tight">{avgWeekOccupancy.toFixed(0)}%</span>
          </div>

          <div className="bg-[#02b1c4]/10 px-3 py-1 rounded-lg text-center">
            <span className="text-[10px] text-[#02b1c4] font-bold block">Comensales</span>
            <span className="text-lg font-bold text-[#02b1c4] leading-tight">{totalWeekReservations}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateObj = new Date(day.date)
          const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "").toUpperCase()
          const dayNum = dateObj.getDate()

          // Is Today
          const isToday = day.isToday

          return (
            <div
              key={day.date}
              className={`relative flex flex-col gap-2 rounded-xl p-3 border transition-all ${
                isToday ? "bg-white border-[#02b1c4] shadow-md ring-1 ring-[#02b1c4]" : "bg-white border-slate-200"
              }`}
            >
              {isToday && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#02b1c4] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm uppercase tracking-wide z-10">
                  Hoy
                </div>
              )}

              {/* Date Header */}
              <div className="text-center pb-1">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  {dayName}
                </span>
                <span className={`block text-2xl font-black ${isToday ? "text-[#364f6b]" : "text-[#364f6b]"}`}>
                  {dayNum}
                </span>
              </div>

              <div className="mb-1">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-slate-500 font-medium">Ocupación</span>
                  <span className="font-bold text-[#364f6b]">{day.occupancyTotal.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(day.occupancyTotal, 100)}%`,
                      backgroundColor:
                        day.occupancyTotal >= 90 ? "#227c9d" : day.occupancyTotal >= 70 ? "#ffcb77" : "#17c3b2",
                    }}
                  />
                </div>
              </div>

              {/* Breakdown Body */}
              <div className="space-y-2 flex-1">
                {/* Lunch Row - Updated Color #ffcb77 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#ffcb77]/20">
                  <Sun size={16} className="text-[#ffcb77]" fill="currentColor" fillOpacity={0.4} />
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-slate-700 text-lg leading-tight">{day.reservationsLunch}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{day.occupancyLunch.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Dinner Row - Updated Color #227c9d */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#227c9d]/15">
                  <Moon size={16} className="text-[#227c9d]" fill="currentColor" fillOpacity={0.4} />
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-slate-700 text-lg leading-tight">{day.reservationsDinner}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{day.occupancyDinner.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Total Footer */}
              <div className="mt-2 text-center border-t border-slate-100 pt-2">
                <span className="text-sm font-bold text-[#364f6b]">
                  {day.reservations} <span className="text-slate-400 text-xs font-semibold ml-0.5">Total</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </TremorCard>
  )
}
