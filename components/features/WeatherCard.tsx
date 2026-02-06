"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { TremorCard } from "../ui/TremorCard"
import { fetchWeatherForecast, getWeatherIconName } from "../../lib/weather"
import type { WeatherDay } from "../../types"
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, Moon, ThermometerSun } from "lucide-react"

export const WeatherCard: React.FC = () => {
  const [forecast, setForecast] = useState<WeatherDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await fetchWeatherForecast()
      setForecast(data.slice(0, 7))
      setLoading(false)
    }
    load()
  }, [])

  // Helper to get descriptive text
  const getWeatherLabel = (code: number) => {
    const name = getWeatherIconName(code)
    switch (name) {
      case "sun":
        return "Soleado"
      case "cloud":
        return "Nublado"
      case "rain":
        return "Lluvia"
      case "storm":
        return "Tormenta"
      case "snow":
        return "Nieve"
      default:
        return "Soleado"
    }
  }

  const getIcon = (code: number, isNight = false, colorClass: string) => {
    const name = getWeatherIconName(code)
    const size = 28

    // We override color to match the card theme if needed, or keep semantic
    // For consistency with Reservations card, we might want to use the passed colorClass
    // or keep semantic colors. Let's use the semantic colors but slightly muted to blend well.

    switch (name) {
      case "sun":
        return isNight ? (
          <Moon size={size} className="text-[#364f6b]" />
        ) : (
          <Sun size={size} className="text-amber-500" />
        )
      case "cloud":
        return <Cloud size={size} className="text-slate-500" />
      case "rain":
        return <CloudRain size={size} className="text-[#02b1c4]" />
      case "storm":
        return <CloudLightning size={size} className="text-[#364f6b]" />
      case "snow":
        return <Snowflake size={size} className="text-[#02b1c4]" />
      default:
        return isNight ? (
          <Moon size={size} className="text-[#364f6b]" />
        ) : (
          <Sun size={size} className="text-amber-500" />
        )
    }
  }

  if (loading) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl"></div>

  return (
    <TremorCard className="h-full flex flex-col">
      {/* Header aligned with WeekReservationsCard */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ThermometerSun className="w-5 h-5 text-[#02b1c4]" />
          <div>
            <h3 className="font-bold text-[#364f6b]">Previsión 7 Días</h3>
            <p className="text-xs text-slate-400 capitalize">(Comida / Cena)</p>
          </div>
        </div>
        <span className="text-[10px] text-slate-300 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
          AEMET
        </span>
      </div>

      {/* Grid: siempre 7 columnas, se adapta si hay menos datos */}
      <div className="flex-1 grid grid-cols-7 gap-1.5">
        {forecast.map((day, idx) => {
          // Comparar fecha real en timezone España para marcar "Hoy"
          const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" })
          const isToday = day.date === todayStr
          // Crear date con hora 12:00 para evitar desfase UTC al parsear YYYY-MM-DD
          const dateObj = new Date(day.date + "T12:00:00")
          // Consistent date formatting
          const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "").toUpperCase()
          const dayNum = dateObj.getDate()

          return (
            <div
              key={idx}
              className={`relative flex flex-col gap-1.5 rounded-xl p-1.5 border transition-all ${
                isToday ? "bg-white border-[#02b1c4] shadow-md ring-1 ring-[#02b1c4]" : "bg-white border-slate-200"
              }`}
            >
              {isToday && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#02b1c4] text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm uppercase tracking-wide z-10 whitespace-nowrap">
                  Hoy
                </div>
              )}

              {/* Date Header - Compact spacing */}
              <div className="text-center pt-1 pb-0.5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                  {dayName}
                </span>
                <span className="block text-xl font-black text-[#364f6b] leading-none">{dayNum}</span>
              </div>

              {/* Body - Colored blocks matching Reservations but optimized spacing */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                {/* Lunch / Day Max Temp - VERTICAL LAYOUT */}
                <div className="flex flex-col items-center justify-center py-2 px-1 rounded-md bg-[#ffcb77]/20 w-full h-full">
                  <div className="mb-1">{getIcon(day.lunchCode, false, "text-[#ffcb77]")}</div>
                  <span className="font-bold text-[#364f6b] text-base leading-none">{Math.round(day.maxTemp)}°</span>
                </div>

                {/* Dinner / Night Min Temp - VERTICAL LAYOUT */}
                <div className="flex flex-col items-center justify-center py-2 px-1 rounded-md bg-[#227c9d]/15 w-full h-full">
                  <div className="mb-1">{getIcon(day.dinnerCode, true, "text-[#227c9d]")}</div>
                  <span className="font-bold text-[#364f6b] text-base leading-none">{Math.round(day.minTemp)}°</span>
                </div>
              </div>

              {/* Footer - Weather Summary - Fixed height for alignment */}
              <div className="mt-1 border-t border-slate-100">
                <div className="h-[24px] flex items-center justify-center px-0.5 pt-1">
                  <span className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tight leading-tight line-clamp-2">
                    {getWeatherLabel(day.lunchCode)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </TremorCard>
  )
}
