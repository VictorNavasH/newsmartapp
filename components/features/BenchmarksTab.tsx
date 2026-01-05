"use client"

import { useState, useEffect, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import {
  CheckCircle2,
  AlertTriangle,
  Target,
  Info,
  Lightbulb,
  DollarSign,
  Receipt,
  PiggyBank,
  BarChart3,
} from "lucide-react"
import { fetchBenchmarks } from "@/lib/dataService"
import type { BenchmarkResumen } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"

const BRAND_COLORS = {
  primary: "#02b1c4",
  secondary: "#227c9d",
  success: "#17c3b2",
  warning: "#ffcb77",
  danger: "#fe6d73",
  dark: "#364f6b",
}

// Colores para el donut chart
const DONUT_COLORS = [
  "#02b1c4", // primary
  "#227c9d", // secondary
  "#17c3b2", // success
  "#ffcb77", // warning
  "#fe6d73", // danger
  "#364f6b", // dark
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#10b981", // emerald
  "#6366f1", // indigo
]

interface BenchmarksTabProps {
  fechaInicio: string
  fechaFin: string
}

// Helpers para estado según desviación del sector
const getStatusColor = (porcentaje: number, min: number | null, max: number | null) => {
  if (min === null || max === null) return BRAND_COLORS.dark
  if (porcentaje <= max) return BRAND_COLORS.success
  if (porcentaje > max && porcentaje <= max + 5) return BRAND_COLORS.warning
  return BRAND_COLORS.danger
}

const getStatusBg = (porcentaje: number, min: number | null, max: number | null) => {
  if (min === null || max === null) return "bg-slate-50"
  if (porcentaje <= max) return "bg-[#17c3b2]/10"
  if (porcentaje > max && porcentaje <= max + 5) return "bg-[#ffcb77]/10"
  return "bg-[#fe6d73]/10"
}

const getStatusIcon = (porcentaje: number, min: number | null, max: number | null) => {
  if (min === null || max === null) return <Target className="h-4 w-4 text-slate-400" />
  if (porcentaje <= max) return <CheckCircle2 className="h-4 w-4 text-[#17c3b2]" />
  if (porcentaje > max && porcentaje <= max + 5) return <AlertTriangle className="h-4 w-4 text-[#ffcb77]" />
  return <AlertTriangle className="h-4 w-4 text-[#fe6d73]" />
}

// Helper para prioridad de insights
const getInsightPriority = (porcentaje: number, max: number | null): "alta" | "media" | "baja" => {
  if (max === null) return "baja"
  if (porcentaje > max + 5) return "alta"
  if (porcentaje > max) return "media"
  return "baja"
}

// Helper para color del margen neto
const getMargenNetoColor = (margen: number) => {
  if (margen >= 15) return BRAND_COLORS.success
  if (margen >= 5) return BRAND_COLORS.warning
  return BRAND_COLORS.danger
}

// Custom tooltip para el donut
const CustomDonutTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { euros: number; porcentaje: number } }>
}) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
        <p className="text-sm font-medium text-slate-800">{data.name}</p>
        <p className="text-xs text-slate-600">{formatCurrency(data.payload.euros)}</p>
        <p className="text-xs font-semibold" style={{ color: BRAND_COLORS.primary }}>
          {data.payload.porcentaje.toFixed(1)}% de ventas
        </p>
      </div>
    )
  }
  return null
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

  // Datos para el donut chart (gastos + margen = 100%)
  const donutData = useMemo(() => {
    if (!data || data.totales.total_ventas === 0) return []

    const ventas = data.totales.total_ventas
    const items: Array<{ name: string; value: number; euros: number; porcentaje: number; color: string }> = []

    // Agrupar categorías pequeñas (<3%) en "Otros"
    let otrosEuros = 0
    let otrosPorcentaje = 0

    data.benchmarks.forEach((b, idx) => {
      if (b.porcentaje < 3) {
        otrosEuros += b.gasto
        otrosPorcentaje += b.porcentaje
      } else {
        items.push({
          name: b.etiqueta,
          value: b.porcentaje,
          euros: b.gasto,
          porcentaje: b.porcentaje,
          color: DONUT_COLORS[idx % DONUT_COLORS.length],
        })
      }
    })

    // Añadir "Otros" si existe
    if (otrosPorcentaje > 0) {
      items.push({
        name: "Otros gastos",
        value: otrosPorcentaje,
        euros: otrosEuros,
        porcentaje: otrosPorcentaje,
        color: "#94a3b8",
      })
    }

    // Añadir margen neto
    if (data.totales.margen_neto > 0) {
      items.push({
        name: "Margen Neto",
        value: data.totales.margen_neto,
        euros: data.totales.margen_neto_euros,
        porcentaje: data.totales.margen_neto,
        color: BRAND_COLORS.success,
      })
    }

    return items
  }, [data])

  // Datos para barras horizontales (ordenados de mayor a menor)
  const barData = useMemo(() => {
    if (!data) return []
    return [...data.benchmarks].sort((a, b) => b.porcentaje_gastos - a.porcentaje_gastos)
  }, [data])

  // Generar insights automáticos
  const insights = useMemo(() => {
    if (!data || data.benchmarks.length === 0) return []

    const result: Array<{ texto: string; prioridad: "alta" | "media" | "baja" }> = []

    // Analizar cada benchmark
    data.benchmarks.forEach((b) => {
      if (b.max_sector !== null) {
        const desviacion = b.porcentaje - b.max_sector
        if (desviacion > 5) {
          result.push({
            texto: `${b.etiqueta} está ${desviacion.toFixed(1)} puntos por encima del máximo recomendado`,
            prioridad: "alta",
          })
        } else if (desviacion > 0) {
          result.push({
            texto: `${b.etiqueta} ligeramente elevado (+${desviacion.toFixed(1)} puntos)`,
            prioridad: "media",
          })
        }
      }
    })

    // Insight sobre margen neto
    const margen = data.totales.margen_neto
    if (margen >= 15) {
      result.push({
        texto: `Margen neto excelente (${margen.toFixed(1)}%), muy por encima del objetivo`,
        prioridad: "baja",
      })
    } else if (margen >= 5) {
      result.push({
        texto: `Margen neto aceptable (${margen.toFixed(1)}%), hay margen de mejora`,
        prioridad: "media",
      })
    } else if (margen > 0) {
      result.push({
        texto: `Margen neto bajo (${margen.toFixed(1)}%), requiere atención urgente`,
        prioridad: "alta",
      })
    } else {
      result.push({
        texto: `Operación con pérdidas (${margen.toFixed(1)}%), situación crítica`,
        prioridad: "alta",
      })
    }

    // Ordenar por prioridad
    const prioridadOrder = { alta: 0, media: 1, baja: 2 }
    return result.sort((a, b) => prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad]).slice(0, 5)
  }, [data])

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  // Estado vacío elegante
  if (!data || data.benchmarks.length === 0 || data.totales.total_ventas === 0) {
    return (
      <TremorCard>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-lg font-medium text-slate-500 mb-1">Sin datos disponibles</p>
          <p className="text-sm text-center max-w-md">
            No hay datos de benchmarks para el período seleccionado. Selecciona un período con actividad registrada.
          </p>
        </div>
      </TremorCard>
    )
  }

  const { totales } = data
  const porcentajeGastos = totales.total_ventas > 0 ? (totales.total_gastos / totales.total_ventas) * 100 : 0

  return (
    <div className="grid gap-4">
      {/* 3 Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ventas */}
        <TremorCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
            >
              <DollarSign className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
            </div>
            <span className="text-sm font-medium text-slate-600">Ventas</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totales.total_ventas)}</p>
          <p className="text-xs text-slate-500 mt-1">Facturación del período</p>
        </TremorCard>

        {/* Gastos */}
        <TremorCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_COLORS.danger}20` }}
            >
              <Receipt className="w-4 h-4" style={{ color: BRAND_COLORS.danger }} />
            </div>
            <span className="text-sm font-medium text-slate-600">Gastos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totales.total_gastos)}</p>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-semibold" style={{ color: BRAND_COLORS.danger }}>
              {porcentajeGastos.toFixed(1)}%
            </span>{" "}
            de las ventas
          </p>
        </TremorCard>

        {/* Margen Neto */}
        <TremorCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${getMargenNetoColor(totales.margen_neto)}20` }}
            >
              <PiggyBank className="w-4 h-4" style={{ color: getMargenNetoColor(totales.margen_neto) }} />
            </div>
            <span className="text-sm font-medium text-slate-600">Margen Neto</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Beneficio real después de todos los costes. Verde &gt;15%, Amarillo 5-15%, Rojo &lt;5%
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold" style={{ color: getMargenNetoColor(totales.margen_neto) }}>
            {formatCurrency(totales.margen_neto_euros)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-semibold" style={{ color: getMargenNetoColor(totales.margen_neto) }}>
              {totales.margen_neto.toFixed(1)}%
            </span>{" "}
            de las ventas
          </p>
        </TremorCard>
      </div>

      {/* Donut + Barras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut: ¿Cómo se reparte cada euro? */}
        <TremorCard className="p-4">
          <TremorTitle className="flex items-center gap-2 text-sm mb-4">
            <Target className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
            ¿Cómo se reparte cada euro que facturas?
          </TremorTitle>
          <div className="flex items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {donutData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate flex-1">{item.name}</span>
                  <span className="font-semibold text-slate-800">{item.porcentaje.toFixed(0)}¢</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center italic">
            De cada euro facturado, {(100 - totales.margen_neto).toFixed(0)}¢ son costes y{" "}
            {totales.margen_neto.toFixed(0)}¢ es beneficio
          </p>
        </TremorCard>

        {/* Barras: ¿En qué gastas? */}
        <TremorCard className="p-4">
          <TremorTitle className="flex items-center gap-2 text-sm mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: BRAND_COLORS.secondary }} />
            ¿En qué gastas?
          </TremorTitle>
          <div className="space-y-3">
            {barData.slice(0, 7).map((item, idx) => {
              const maxPct = Math.max(...barData.map((b) => b.porcentaje_gastos), 1)
              const widthPct = (item.porcentaje_gastos / maxPct) * 100
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate">{item.etiqueta}</span>
                    <span className="font-semibold text-slate-800 ml-2">{item.porcentaje_gastos.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {barData.length > 7 && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              +{barData.length - 7} categorías más (ver tabla detallada)
            </p>
          )}
        </TremorCard>
      </div>

      {/* Tabla Comparativa con el Sector */}
      <TremorCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <TremorTitle className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
            Comparativa con el Sector
          </TremorTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Comparamos tus costes (% sobre ventas) con los rangos típicos del sector restauración. Verde = dentro
                  del rango, Amarillo = ligeramente elevado, Rojo = muy por encima.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Header de la tabla */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 rounded-t-lg text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Categoría</div>
          <div className="col-span-2 text-right">Mi %</div>
          <div className="col-span-3 text-center">Rango Sector</div>
          <div className="col-span-3 text-right">Importe</div>
        </div>

        {/* Filas de benchmarks */}
        <div className="divide-y divide-slate-100">
          {data.benchmarks.map((benchmark) => (
            <div
              key={benchmark.etiqueta}
              className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center transition-colors hover:bg-slate-50/50 ${getStatusBg(benchmark.porcentaje, benchmark.min_sector, benchmark.max_sector)}`}
            >
              <div className="col-span-4 flex items-center gap-2">
                {getStatusIcon(benchmark.porcentaje, benchmark.min_sector, benchmark.max_sector)}
                <span className="font-medium text-sm text-[#364f6b] truncate">{benchmark.etiqueta}</span>
              </div>
              <div className="col-span-2 text-right">
                <span
                  className="text-sm font-bold"
                  style={{ color: getStatusColor(benchmark.porcentaje, benchmark.min_sector, benchmark.max_sector) }}
                >
                  {benchmark.porcentaje.toFixed(1)}%
                </span>
              </div>
              <div className="col-span-3 text-center">
                {benchmark.min_sector !== null && benchmark.max_sector !== null ? (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {benchmark.min_sector}% - {benchmark.max_sector}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">--</span>
                )}
              </div>
              <div className="col-span-3 text-right">
                <span className="text-xs font-medium text-slate-600">{formatCurrency(benchmark.gasto)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-[#364f6b] rounded-b-lg text-white mt-1">
          <div className="col-span-4 font-semibold text-sm">Total Gastos</div>
          <div className="col-span-2 text-right">
            <span className="text-sm font-bold">{porcentajeGastos.toFixed(1)}%</span>
          </div>
          <div className="col-span-3"></div>
          <div className="col-span-3 text-right font-semibold text-sm">{formatCurrency(totales.total_gastos)}</div>
        </div>
      </TremorCard>

      {/* Insights Automáticos */}
      {insights.length > 0 && (
        <TremorCard className="p-4">
          <TremorTitle className="flex items-center gap-2 text-sm mb-3">
            <Lightbulb className="w-4 h-4" style={{ color: BRAND_COLORS.warning }} />
            Insights
          </TremorTitle>
          <div className="space-y-2">
            {insights.map((insight, idx) => {
              const color =
                insight.prioridad === "alta"
                  ? BRAND_COLORS.danger
                  : insight.prioridad === "media"
                    ? BRAND_COLORS.warning
                    : BRAND_COLORS.success
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg text-sm"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-slate-700">{insight.texto}</span>
                </div>
              )
            })}
          </div>
        </TremorCard>
      )}
    </div>
  )
}
