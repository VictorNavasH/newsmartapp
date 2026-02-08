"use client"

import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import {
  Calendar,
  ArrowRight,
  Trophy,
  Info,
} from "lucide-react"
import { BRAND_COLORS } from "@/constants"
import { formatNumber } from "@/lib/utils"

interface CompareRange {
  startDay: number
  startMonth: number
  endDay: number
  endMonth: number
}

interface ComparisonResult {
  labelA: string
  labelB: string
  valueA: number
  valueB: number
  daysA: number
  daysB: number
  avgA: number
  avgB: number
  variation: number
  avgVariation: number
  winner: string
}

interface ReservationsComparatorSectionProps {
  compareMetric: "comensales" | "reservas"
  setCompareMetric: (v: "comensales" | "reservas") => void
  compareTurno: "total" | "comida" | "cena"
  setCompareTurno: (v: "total" | "comida" | "cena") => void
  compareRange: CompareRange
  setCompareRange: (fn: (prev: CompareRange) => CompareRange) => void
  compareYearA: number
  setCompareYearA: (v: number) => void
  compareYearB: number
  setCompareYearB: (v: number) => void
  availableYearsForCompare: number[]
  comparisonResult: ComparisonResult | null
  loadingComparison: boolean
  setShouldLoadComparison: (v: boolean) => void
}

export function ReservationsComparatorSection({
  compareMetric,
  setCompareMetric,
  compareTurno,
  setCompareTurno,
  compareRange,
  setCompareRange,
  compareYearA,
  setCompareYearA,
  compareYearB,
  setCompareYearB,
  availableYearsForCompare,
  comparisonResult,
  loadingComparison,
  setShouldLoadComparison,
}: ReservationsComparatorSectionProps) {
  return (
    <TremorCard className="mt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <TremorTitle>Comparador de Periodos</TremorTitle>
          <p className="text-sm text-slate-500 mt-1">Compara el mismo rango de fechas entre diferentes anos</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Metrica:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setCompareMetric("comensales")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  compareMetric === "comensales" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                style={{ backgroundColor: compareMetric === "comensales" ? BRAND_COLORS.primary : "transparent" }}
              >
                Comensales
              </button>
              <button
                onClick={() => setCompareMetric("reservas")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  compareMetric === "reservas" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                style={{ backgroundColor: compareMetric === "reservas" ? BRAND_COLORS.primary : "transparent" }}
              >
                Reservas
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Turno:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {["total", "comida", "cena"].map((t) => (
                <button
                  key={t}
                  onClick={() => setCompareTurno(t as "total" | "comida" | "cena")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    compareTurno === t ? "text-white" : "text-slate-600 hover:text-slate-800"
                  }`}
                  style={{ backgroundColor: compareTurno === t ? BRAND_COLORS.primary : "transparent" }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selectores de rango y anos */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* Selector de rango - Desde */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Desde:</span>
            <select
              value={compareRange.startDay}
              onChange={(e) => setCompareRange((prev) => ({ ...prev, startDay: Number(e.target.value) }))}
              className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={compareRange.startMonth}
              onChange={(e) => setCompareRange((prev) => ({ ...prev, startMonth: Number(e.target.value) }))}
              className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
            >
              {[
                "Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre",
              ].map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 hidden md:block" />

          {/* Selector de rango - Hasta */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-200">
            <span className="text-sm text-slate-600">Hasta:</span>
            <select
              value={compareRange.endDay}
              onChange={(e) => setCompareRange((prev) => ({ ...prev, endDay: Number(e.target.value) }))}
              className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={compareRange.endMonth}
              onChange={(e) => setCompareRange((prev) => ({ ...prev, endMonth: Number(e.target.value) }))}
              className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
            >
              {[
                "Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre",
              ].map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShouldLoadComparison(true)}
            disabled={loadingComparison}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            {loadingComparison ? "Cargando..." : "Comparar"}
          </button>
        </div>

        {/* Selectores de ano */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }} />
            <span className="text-sm font-medium text-slate-600">Ano A:</span>
            <select
              value={compareYearA}
              onChange={(e) => setCompareYearA(Number(e.target.value))}
              className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02b1c4]/20"
              style={{ color: BRAND_COLORS.primary }}
            >
              {availableYearsForCompare.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <span className="text-lg font-bold text-slate-300">VS</span>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-sm font-medium text-slate-600">Ano B:</span>
            <select
              value={compareYearB}
              onChange={(e) => setCompareYearB(Number(e.target.value))}
              className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-600"
            >
              {availableYearsForCompare.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resultados visuales */}
      {loadingComparison ? (
        <div className="h-32 flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-6 w-6 border-b-2"
            style={{ borderColor: BRAND_COLORS.primary }}
          />
        </div>
      ) : comparisonResult ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta Ano A */}
          <div
            className="relative rounded-xl p-4 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${BRAND_COLORS.primary}15 0%, ${BRAND_COLORS.primary}05 100%)`,
              border: `1px solid ${BRAND_COLORS.primary}30`,
            }}
          >
            {comparisonResult.winner === "A" && (
              <div className="absolute top-2 right-2">
                <Trophy className="w-4 h-4" style={{ color: BRAND_COLORS.warning }} />
              </div>
            )}
            <div className="text-xs font-medium text-slate-500 mb-1">{comparisonResult.labelA}</div>
            <div className="text-2xl font-bold mb-2" style={{ color: BRAND_COLORS.primary }}>
              {formatNumber(comparisonResult.valueA)}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dias</span>
                <span className="font-medium text-slate-700">{comparisonResult.daysA}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Media/dia</span>
                <span className="font-medium" style={{ color: BRAND_COLORS.primary }}>
                  {comparisonResult.avgA.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Variacion central */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="text-xs text-slate-500 mb-1">Variacion</div>
            <div
              className="text-3xl font-bold mb-2"
              style={{
                color:
                  comparisonResult.variation > 0
                    ? BRAND_COLORS.success
                    : comparisonResult.variation < 0
                      ? BRAND_COLORS.error
                      : "#64748b",
              }}
            >
              {comparisonResult.variation > 0 ? "+" : ""}
              {comparisonResult.variation.toFixed(1)}%
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.abs(comparisonResult.variation))}%`,
                  backgroundColor: comparisonResult.variation > 0 ? BRAND_COLORS.success : BRAND_COLORS.error,
                  marginLeft: comparisonResult.variation < 0 ? "auto" : 0,
                }}
              />
            </div>

            <div className="text-center">
              <div className="text-[10px] text-slate-400">Media diaria</div>
              <div
                className="text-sm font-semibold"
                style={{
                  color:
                    comparisonResult.avgVariation > 0
                      ? BRAND_COLORS.success
                      : comparisonResult.avgVariation < 0
                        ? BRAND_COLORS.error
                        : "#64748b",
                }}
              >
                {comparisonResult.avgVariation > 0 ? "+" : ""}
                {comparisonResult.avgVariation.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Tarjeta Ano B */}
          <div
            className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50"
            style={{ border: "1px solid #e2e8f0" }}
          >
            {comparisonResult.winner === "B" && (
              <div className="absolute top-2 right-2">
                <Trophy className="w-4 h-4" style={{ color: BRAND_COLORS.warning }} />
              </div>
            )}
            <div className="text-xs font-medium text-slate-500 mb-1">{comparisonResult.labelB}</div>
            <div className="text-2xl font-bold text-slate-700 mb-2">
              {formatNumber(comparisonResult.valueB)}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dias</span>
                <span className="font-medium text-slate-700">{comparisonResult.daysB}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Media/dia</span>
                <span className="font-medium text-slate-600">{comparisonResult.avgB.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-slate-400">
          <p>Selecciona los periodos a comparar</p>
        </div>
      )}

      {/* Nota informativa */}
      {comparisonResult && comparisonResult.daysA !== comparisonResult.daysB && (
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Los periodos tienen diferente numero de dias operativos ({comparisonResult.daysA} vs{" "}
            {comparisonResult.daysB}). La <strong>media diaria</strong> ofrece una comparacion mas precisa.
          </p>
        </div>
      )}
    </TremorCard>
  )
}
