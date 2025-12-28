"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { CheckCircle2, AlertTriangle, Target, Info, TrendingUp, TrendingDown } from "lucide-react"
import { fetchBenchmarks } from "@/lib/dataService"
import type { BenchmarkResumen } from "@/types"
import { formatCurrency } from "@/lib/utils"

const BRAND_COLORS = {
  primary: "#02b1c4",
  secondary: "#227c9d",
  success: "#17c3b2",
  warning: "#ffcb77",
  danger: "#fe6d73",
  dark: "#364f6b",
}

interface BenchmarksTabProps {
  fechaInicio: string
  fechaFin: string
}

const getStatusColor = (porcentaje: number, min: number | null, max: number | null) => {
  if (min === null || max === null) return BRAND_COLORS.dark
  if (porcentaje <= max) return BRAND_COLORS.success
  if (porcentaje > max && porcentaje <= max + 2) return BRAND_COLORS.warning
  return BRAND_COLORS.danger
}

const getStatusBg = (porcentaje: number, min: number | null, max: number | null) => {
  if (min === null || max === null) return "bg-slate-50"
  if (porcentaje <= max) return "bg-[#17c3b2]/10"
  if (porcentaje > max && porcentaje <= max + 2) return "bg-[#ffcb77]/10"
  return "bg-[#fe6d73]/10"
}

const getStatusIcon = (porcentaje: number, min: number | null, max: number | null) => {
  if (min === null || max === null) return <Target className="h-4 w-4 text-slate-400" />
  if (porcentaje <= max) return <CheckCircle2 className="h-4 w-4 text-[#17c3b2]" />
  if (porcentaje > max && porcentaje <= max + 2) return <AlertTriangle className="h-4 w-4 text-[#ffcb77]" />
  return <AlertTriangle className="h-4 w-4 text-[#fe6d73]" />
}

export function BenchmarksTab({ fechaInicio, fechaFin }: BenchmarksTabProps) {
  const [data, setData] = useState<BenchmarkResumen | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const result = await fetchBenchmarks(fechaInicio, fechaFin)
      setData(result)
      setLoading(false)
    }
    loadData()
  }, [fechaInicio, fechaFin])

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!data || data.benchmarks.length === 0) {
    return (
      <TremorCard>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Target className="h-12 w-12 mb-3 text-slate-300" />
          <p className="text-center">No hay datos de benchmarks para el período seleccionado.</p>
        </div>
      </TremorCard>
    )
  }

  const margenOperativoPositivo = data.totales.margen_operativo >= 0
  const margenNetoPositivo = data.totales.margen_neto >= 0

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Margen Operativo */}
        <TremorCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {margenOperativoPositivo ? (
              <TrendingUp className="w-4 h-4" style={{ color: BRAND_COLORS.success }} />
            ) : (
              <TrendingDown className="w-4 h-4" style={{ color: BRAND_COLORS.danger }} />
            )}
            <span className="text-sm font-medium text-slate-600">Margen Operativo</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Margen Operativo</strong> = Ingresos - Gastos operativos. Mide la rentabilidad antes de
                    gastos financieros.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: margenOperativoPositivo ? BRAND_COLORS.success : BRAND_COLORS.danger }}
              >
                {margenOperativoPositivo ? "+" : ""}
                {data.totales.margen_operativo.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(data.totales.margen_operativo_euros)}</p>
            </div>
            <div
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: margenOperativoPositivo ? `${BRAND_COLORS.success}20` : `${BRAND_COLORS.danger}20`,
                color: margenOperativoPositivo ? BRAND_COLORS.success : BRAND_COLORS.danger,
              }}
            >
              {margenOperativoPositivo ? "Rentable" : "Déficit"}
            </div>
          </div>
        </TremorCard>

        {/* Margen Neto */}
        <TremorCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {margenNetoPositivo ? (
              <TrendingUp className="w-4 h-4" style={{ color: BRAND_COLORS.success }} />
            ) : (
              <TrendingDown className="w-4 h-4" style={{ color: BRAND_COLORS.danger }} />
            )}
            <span className="text-sm font-medium text-slate-600">Margen Neto</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Margen Neto</strong> = Ingresos - Todos los gastos. Es el beneficio real después de todos
                    los costes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: margenNetoPositivo ? BRAND_COLORS.success : BRAND_COLORS.danger }}
              >
                {margenNetoPositivo ? "+" : ""}
                {data.totales.margen_neto.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(data.totales.margen_neto_euros)}</p>
            </div>
            <div
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: margenNetoPositivo ? `${BRAND_COLORS.success}20` : `${BRAND_COLORS.danger}20`,
                color: margenNetoPositivo ? BRAND_COLORS.success : BRAND_COLORS.danger,
              }}
            >
              {margenNetoPositivo ? "Beneficio" : "Pérdidas"}
            </div>
          </div>
        </TremorCard>
      </div>

      <TremorCard>
        <div className="flex items-center justify-between mb-4 px-1">
          <TremorTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
            Comparativa con el Sector
          </TremorTitle>
          <span className="text-xs text-slate-500">
            Ventas: <span className="font-semibold text-[#364f6b]">{formatCurrency(data.totales.total_ventas)}</span>
          </span>
        </div>

        {/* Header de la tabla */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 rounded-t-lg text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-5">Categoría</div>
          <div className="col-span-2 text-right">Mi %</div>
          <div className="col-span-3 text-center">Rango Sector</div>
          <div className="col-span-2 text-right">Importe</div>
        </div>

        {/* Filas de benchmarks */}
        <div className="divide-y divide-slate-100">
          {data.benchmarks.map((benchmark) => (
            <div
              key={benchmark.etiqueta}
              className={`grid grid-cols-12 gap-2 px-3 py-3 items-center transition-colors hover:bg-slate-50/50 ${getStatusBg(benchmark.porcentaje, benchmark.min_sector, benchmark.max_sector)}`}
            >
              {/* Categoría */}
              <div className="col-span-5 flex items-center gap-2">
                {getStatusIcon(benchmark.porcentaje, benchmark.min_sector, benchmark.max_sector)}
                <span className="font-medium text-sm text-[#364f6b]">{benchmark.etiqueta}</span>
              </div>

              {/* Mi porcentaje */}
              <div className="col-span-2 text-right">
                <span
                  className="text-sm font-bold"
                  style={{ color: getStatusColor(benchmark.porcentaje, benchmark.min_sector, benchmark.max_sector) }}
                >
                  {benchmark.porcentaje.toFixed(1)}%
                </span>
              </div>

              {/* Rango del sector */}
              <div className="col-span-3 text-center">
                {benchmark.min_sector !== null && benchmark.max_sector !== null ? (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {benchmark.min_sector}% - {benchmark.max_sector}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">--</span>
                )}
              </div>

              {/* Gasto */}
              <div className="col-span-2 text-right">
                <span className="text-xs font-medium text-slate-600">{formatCurrency(benchmark.gasto)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="grid grid-cols-12 gap-2 px-3 py-3 bg-[#364f6b] rounded-b-lg text-white mt-1">
          <div className="col-span-5 font-semibold text-sm">Total Gastos</div>
          <div className="col-span-2 text-right">
            <span className="text-sm font-bold">
              {((data.totales.total_gastos / data.totales.total_ventas) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="col-span-3"></div>
          <div className="col-span-2 text-right font-semibold text-sm">{formatCurrency(data.totales.total_gastos)}</div>
        </div>
      </TremorCard>
    </div>
  )
}
