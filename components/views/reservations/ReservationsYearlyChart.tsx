"use client"

import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { CHART_CONFIG, BRAND_COLORS } from "@/constants"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { formatNumber } from "@/lib/utils"
import type { YearlyTrendInsight } from "@/types"
import { YEAR_COLORS, type YearlyMetric, type YearlyTurno } from "./constants"

interface ReservationsYearlyChartProps {
  yearlyMetric: YearlyMetric
  setYearlyMetric: (v: YearlyMetric) => void
  yearlyTurno: YearlyTurno
  setYearlyTurno: (v: YearlyTurno) => void
  yearlyChartData: Record<string, any>[]
  yearlyTrendInsight: YearlyTrendInsight | null
  loadingYearly: boolean
  availableYears: number[]
}

export function ReservationsYearlyChart({
  yearlyMetric,
  setYearlyMetric,
  yearlyTurno,
  setYearlyTurno,
  yearlyChartData,
  yearlyTrendInsight,
  loadingYearly,
  availableYears,
}: ReservationsYearlyChartProps) {
  return (
    <TremorCard>
      <div className="flex items-center justify-between mb-6">
        <TremorTitle>Comparativa Anual</TremorTitle>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Metrica:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setYearlyMetric("comensales")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  yearlyMetric === "comensales" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                style={{ backgroundColor: yearlyMetric === "comensales" ? BRAND_COLORS.primary : "transparent" }}
              >
                Comensales
              </button>
              <button
                onClick={() => setYearlyMetric("reservas")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  yearlyMetric === "reservas" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                style={{ backgroundColor: yearlyMetric === "reservas" ? BRAND_COLORS.primary : "transparent" }}
              >
                Reservas
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Turno:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setYearlyTurno("total")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  yearlyTurno === "total" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                style={{ backgroundColor: yearlyTurno === "total" ? BRAND_COLORS.primary : "transparent" }}
              >
                Total
              </button>
              <button
                onClick={() => setYearlyTurno("comida")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  yearlyTurno === "comida" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                style={{ backgroundColor: yearlyTurno === "comida" ? BRAND_COLORS.primary : "transparent" }}
              >
                Comida
              </button>
              <button
                onClick={() => setYearlyTurno("cena")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  yearlyTurno === "cena" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                style={{ backgroundColor: yearlyTurno === "cena" ? BRAND_COLORS.primary : "transparent" }}
              >
                Cena
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trend insight */}
      {yearlyTrendInsight && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            {yearlyTrendInsight.trend === "up" ? (
              <TrendingUp className="w-5 h-5" style={{ color: BRAND_COLORS.success }} />
            ) : yearlyTrendInsight.trend === "down" ? (
              <TrendingDown className="w-5 h-5" style={{ color: BRAND_COLORS.error }} />
            ) : (
              <Minus className="w-5 h-5 text-slate-400" />
            )}
            <span className="font-semibold text-slate-700">
              Tendencia {yearlyTrendInsight.currentYear} vs {yearlyTrendInsight.previousYear}
            </span>
            <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
              mismo periodo: {yearlyTrendInsight.dayOfYear} dias
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Variacion mismo periodo */}
            <div>
              <div className="text-xs text-slate-500 mb-1">Variacion Mismo Periodo</div>
              <div
                className="text-lg font-bold"
                style={{
                  color:
                    yearlyTrendInsight.percentageChange > 0
                      ? BRAND_COLORS.success
                      : yearlyTrendInsight.percentageChange < 0
                        ? BRAND_COLORS.error
                        : "#64748b",
                }}
              >
                {yearlyTrendInsight.percentageChange > 0 ? "+" : ""}
                {yearlyTrendInsight.percentageChange.toFixed(1)}% vs {yearlyTrendInsight.previousYear}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {yearlyTrendInsight.currentYear}: {formatNumber(yearlyTrendInsight.currentYearTotal)} |{" "}
                {yearlyTrendInsight.previousYear}: {formatNumber(yearlyTrendInsight.previousYearTotal)}
              </div>
            </div>

            {/* Mejor mes del ano anterior */}
            <div>
              <div className="text-xs text-slate-500 mb-1">Mejor Mes ({yearlyTrendInsight.previousYear})</div>
              <div className="text-lg font-bold" style={{ color: BRAND_COLORS.success }}>
                {yearlyTrendInsight.bestMonth.mes}
              </div>
              <div className="text-xs text-slate-400">
                {formatNumber(yearlyTrendInsight.bestMonth.valor)} {yearlyMetric}
              </div>
            </div>

            {/* Media diaria comparativa */}
            <div>
              <div className="text-xs text-slate-500 mb-1">Media Diaria {yearlyTrendInsight.currentYear}</div>
              <div
                className="text-lg font-bold"
                style={{
                  color:
                    (yearlyTrendInsight.currentDailyAvg ?? 0) >= (yearlyTrendInsight.previousDailyAvg ?? 0)
                      ? BRAND_COLORS.success
                      : BRAND_COLORS.error,
                }}
              >
                {formatNumber(yearlyTrendInsight.currentDailyAvg ?? 0)} {yearlyMetric}/dia
              </div>
              <div className="text-xs text-slate-400">
                vs {formatNumber(yearlyTrendInsight.previousDailyAvg ?? 0)}/dia en{" "}
                {yearlyTrendInsight.previousYear}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grafico anual */}
      {loadingYearly ? (
        <div className="flex items-center justify-center h-64">
          <p>Cargando datos historicos anuales...</p>
        </div>
      ) : yearlyChartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={yearlyChartData}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="mes" {...CHART_CONFIG.axis} />
              <YAxis {...CHART_CONFIG.axis} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  const currentYear = new Date().getFullYear()
                  const currentMonth = new Date().getMonth()
                  const monthIndex = [
                    "ene",
                    "feb",
                    "mar",
                    "abr",
                    "may",
                    "jun",
                    "jul",
                    "ago",
                    "sep",
                    "oct",
                    "nov",
                    "dic",
                  ].indexOf(label?.toLowerCase())
                  const isCurrentOrFutureMonth = monthIndex >= currentMonth

                  return (
                    <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl min-w-[200px]">
                      <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                        {label}
                      </p>
                      {payload
                        .filter((entry: any) => entry.value !== null)
                        .map((entry: any, index: number) => {
                          const year = (entry.dataKey || "").replace("año_", "")
                          const ocupacion = entry.payload[`ocup_${year}`]
                          const diasOp = entry.payload[`dias_${year}`]

                          return (
                            <div key={index} className="flex items-center gap-2 text-xs mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-slate-500 font-medium w-12">{entry.name}</span>
                              <span className="font-bold text-slate-700">
                                {entry.value != null ? formatNumber(entry.value) : "-"} {yearlyMetric}
                              </span>
                              {diasOp != null && (
                                <span className="text-slate-400 text-[10px]">
                                  ({String(diasOp)} dias{ocupacion ? ` · ${String(ocupacion)}%` : ""})
                                </span>
                              )}
                            </div>
                          )
                        })}
                      {(() => {
                        const currentYearEntry = payload.find((e: any) => e.dataKey === `año_${currentYear}`)
                        const prevYearEntry = payload.find((e: any) => e.dataKey === `año_${currentYear - 1}`)
                        if (currentYearEntry?.value && prevYearEntry?.value && !isCurrentOrFutureMonth) {
                          const diff = (
                            ((Number(currentYearEntry.value) - Number(prevYearEntry.value)) / Number(prevYearEntry.value)) *
                            100
                          ).toFixed(1)
                          const isPositive = Number.parseFloat(diff) >= 0
                          return (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">vs {currentYear - 1}:</span>
                                <span className={`font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                                  {isPositive ? "+" : ""}
                                  {diff}%
                                </span>
                              </div>
                            </div>
                          )
                        }
                        if (isCurrentOrFutureMonth && monthIndex === currentMonth) {
                          const currentYearDias = payload.find((e: any) => e.dataKey === `año_${currentYear}`)
                            ?.payload?.[`dias_${currentYear}`]
                          const prevYearDias = payload.find((e: any) => e.dataKey === `año_${currentYear - 1}`)
                            ?.payload?.[`dias_${currentYear - 1}`]
                          if (currentYearDias && prevYearDias && currentYearDias < prevYearDias) {
                            return (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <p className="text-[10px] text-amber-600">
                                  Mes en curso: {currentYearDias} dias vs {prevYearDias} dias
                                </p>
                              </div>
                            )
                          }
                        }
                        return null
                      })()}
                    </div>
                  )
                }}
              />
              {availableYears.map((year) => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={`año_${year}`}
                  name={year.toString()}
                  stroke={YEAR_COLORS[year] || "#64748b"}
                  strokeWidth={year === new Date().getFullYear() ? 3 : 2}
                  dot={{ fill: YEAR_COLORS[year] || "#64748b", r: year === new Date().getFullYear() ? 5 : 3 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-center gap-6 mt-4">
            {availableYears.map((year) => (
              <div key={year} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: YEAR_COLORS[year] || "#64748b" }} />
                <span
                  className={`text-sm ${year === new Date().getFullYear() ? "font-bold text-slate-700" : "text-slate-500"}`}
                >
                  {year}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[400px] flex items-center justify-center text-slate-400">
          <p>No hay datos historicos disponibles</p>
        </div>
      )}
    </TremorCard>
  )
}
