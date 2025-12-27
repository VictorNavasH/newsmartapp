"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  fetchOperativaItems,
  fetchOperativaKPIs,
  fetchOperativaProductos,
  fetchOperativaCliente,
  fetchOperativaCategorias,
  fetchOperativaPorHora,
} from "@/lib/operativaService"
import { getBusinessDate } from "@/lib/dataService"
import type {
  DateRange,
  OperativaItem,
  OperativaKPI,
  OperativaProducto,
  OperativaCliente,
  OperativaPorHora,
  ComparisonResult,
} from "@/types"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Clock, ChefHat, Users, AlertTriangle, Utensils } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { CHART_CONFIG, BRAND_COLORS } from "@/constants"
import { Badge } from "@/components/ui/badge"

type PeriodKey = "hoy" | "ayer" | "semana" | "mes" | "trimestre" | "custom"
type TipoFilter = "todos" | "comida" | "bebida"

const activeTabStyle = `data-[state=active]:bg-[${BRAND_COLORS.primary}] data-[state=active]:text-white`

// Umbrales de tiempos (en minutos)
const THRESHOLDS = {
  cocina: { good: 15, warning: 25 },
  sala: { good: 8, warning: 15 },
}

const getTimeColor = (minutes: number, type: "cocina" | "sala"): string => {
  const threshold = THRESHOLDS[type]
  if (minutes <= threshold.good) return BRAND_COLORS.success
  if (minutes <= threshold.warning) return BRAND_COLORS.warning
  return BRAND_COLORS.error
}

const OperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PeriodKey>("ayer")
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: yesterday, to: yesterday }
  })

  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("todos")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas")
  const [categorias, setCategorias] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<OperativaItem[]>([])
  const [kpis, setKpis] = useState<OperativaKPI[]>([])
  const [productos, setProductos] = useState<OperativaProducto[]>([])
  const [clientes, setClientes] = useState<OperativaCliente[]>([])
  const [porHora, setPorHora] = useState<OperativaPorHora[]>([])

  // Previous period for comparison
  const [previousKpis, setPreviousKpis] = useState<OperativaKPI[]>([])

  const setPeriod = (period: PeriodKey) => {
    setActiveTab(period)
    const today = period === "hoy" ? getBusinessDate() : new Date()
    today.setHours(0, 0, 0, 0)
    const from = new Date(today)
    const to = new Date(today)

    switch (period) {
      case "hoy":
        // getBusinessDate() already applied above for "hoy" only
        break
      case "ayer":
        from.setDate(today.getDate() - 1)
        to.setDate(today.getDate() - 1)
        break
      case "semana":
        from.setDate(today.getDate() - 7)
        break
      case "mes":
        from.setDate(today.getDate() - 30)
        break
      case "trimestre":
        from.setDate(today.getDate() - 90)
        break
      default:
        return
    }

    setDateRange({ from, to })
  }

  const handleDateChange = (range: DateRange) => {
    setDateRange(range)
    setActiveTab("custom")
  }

  // Calculate previous period for comparison
  const getPreviousPeriod = (from: Date, to: Date): { from: Date; to: Date } => {
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const prevTo = new Date(from)
    prevTo.setDate(prevTo.getDate() - 1)
    const prevFrom = new Date(prevTo)
    prevFrom.setDate(prevFrom.getDate() - daysDiff + 1)
    return { from: prevFrom, to: prevTo }
  }

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const tipo = tipoFilter === "todos" ? undefined : tipoFilter
        const categoria = categoriaFilter === "todas" ? undefined : categoriaFilter

        const kpiTipo = tipo === "postre" ? undefined : (tipo as "comida" | "bebida" | undefined)

        const [itemsData, kpisData, productosData, clientesData, categoriasData, porHoraData] = await Promise.all([
          fetchOperativaItems(dateRange.from, dateRange.to, tipo, categoria),
          fetchOperativaKPIs(dateRange.from, dateRange.to, kpiTipo, categoria),
          fetchOperativaProductos(dateRange.from, dateRange.to, kpiTipo, categoria),
          fetchOperativaCliente(dateRange.from, dateRange.to),
          fetchOperativaCategorias(dateRange.from, dateRange.to),
          fetchOperativaPorHora(dateRange.from, dateRange.to),
        ])

        setItems(itemsData)
        setKpis(kpisData)
        setProductos(productosData)
        setClientes(clientesData)
        setCategorias(categoriasData)
        setPorHora(porHoraData)

        // Fetch previous period for comparison
        const prevPeriod = getPreviousPeriod(dateRange.from, dateRange.to)
        const prevKpis = await fetchOperativaKPIs(prevPeriod.from, prevPeriod.to, kpiTipo, categoria)
        setPreviousKpis(prevKpis)
      } catch (error) {
        console.error("[v0] Error loading operativa data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dateRange, tipoFilter, categoriaFilter])

  // Calculate aggregated KPIs
  const aggregatedKPIs = useMemo(() => {
    if (kpis.length === 0) {
      return {
        items_servidos: 0,
        items_comida: 0,
        items_bebida: 0,
        tiempo_medio_cocina: 0,
        tiempo_medio_sala: 0,
        alertas_30min: 0,
        alertas_45min: 0,
      }
    }

    const totals = kpis.reduce(
      (acc, day) => ({
        items_servidos: acc.items_servidos + (day.items_servidos || 0),
        items_comida: acc.items_comida + (day.items_comida || 0),
        items_bebida: acc.items_bebida + (day.items_bebida || 0),
        tiempo_cocina_sum: acc.tiempo_cocina_sum + (day.tiempo_medio_cocina || 0) * (day.items_comida || 0),
        tiempo_sala_sum: acc.tiempo_sala_sum + (day.tiempo_medio_sala || 0) * (day.items_bebida || 0),
        alertas_30min: acc.alertas_30min + (day.alertas_30min || 0),
        alertas_45min: acc.alertas_45min + (day.alertas_45min || 0),
      }),
      {
        items_servidos: 0,
        items_comida: 0,
        items_bebida: 0,
        tiempo_cocina_sum: 0,
        tiempo_sala_sum: 0,
        alertas_30min: 0,
        alertas_45min: 0,
      },
    )

    return {
      items_servidos: totals.items_servidos,
      items_comida: totals.items_comida,
      items_bebida: totals.items_bebida,
      tiempo_medio_cocina: totals.items_comida > 0 ? totals.tiempo_cocina_sum / totals.items_comida : 0,
      tiempo_medio_sala: totals.items_bebida > 0 ? totals.tiempo_sala_sum / totals.items_bebida : 0,
      alertas_30min: totals.alertas_30min,
      alertas_45min: totals.alertas_45min,
    }
  }, [kpis])

  // Previous period aggregated for comparison
  const previousAggregated = useMemo(() => {
    if (previousKpis.length === 0) return null

    const totals = previousKpis.reduce(
      (acc, day) => ({
        items_servidos: acc.items_servidos + (day.items_servidos || 0),
        items_comida: acc.items_comida + (day.items_comida || 0),
        items_bebida: acc.items_bebida + (day.items_bebida || 0),
        tiempo_cocina_sum: acc.tiempo_cocina_sum + (day.tiempo_medio_cocina || 0) * (day.items_comida || 0),
        tiempo_sala_sum: acc.tiempo_sala_sum + (day.tiempo_medio_sala || 0) * (day.items_bebida || 0),
      }),
      { items_servidos: 0, items_comida: 0, items_bebida: 0, tiempo_cocina_sum: 0, tiempo_sala_sum: 0 },
    )

    return {
      tiempo_medio_cocina: totals.items_comida > 0 ? totals.tiempo_cocina_sum / totals.items_comida : 0,
      tiempo_medio_sala: totals.items_bebida > 0 ? totals.tiempo_sala_sum / totals.items_bebida : 0,
      items_servidos: totals.items_servidos,
    }
  }, [previousKpis])

  const createComparisonResult = (current: number, previous: number | null): ComparisonResult => {
    if (!previous || previous === 0) {
      return { value: current, delta: 0, trend: "neutral" }
    }
    const delta = Math.round(((current - previous) / previous) * 100)
    return {
      value: current,
      delta: Math.abs(delta),
      trend: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
    }
  }

  const createTimeComparisonResult = (current: number, previous: number | null): ComparisonResult => {
    if (!previous || previous === 0) {
      return { value: current, delta: 0, trend: "neutral" }
    }
    const delta = Math.round(((current - previous) / previous) * 100)
    // For time, down is good (green), up is bad (red)
    return {
      value: current,
      delta: Math.abs(delta),
      trend: delta < 0 ? "up" : delta > 0 ? "down" : "neutral", // Inverted for display
    }
  }

  // Chart data for evolution
  const evolutionChartData = useMemo(() => {
    return kpis.map((day) => ({
      fecha: day.fecha,
      cocina: day.tiempo_medio_cocina || 0,
      sala: day.tiempo_medio_sala || 0,
    }))
  }, [kpis])

  // Distribution by hour
  const hourDistribution = useMemo(() => {
    const hourMap = new Map<number, { count: number; totalTime: number }>()
    items.forEach((item) => {
      if (!hourMap.has(item.hora)) {
        hourMap.set(item.hora, { count: 0, totalTime: 0 })
      }
      const entry = hourMap.get(item.hora)!
      entry.count++
      entry.totalTime += item.minutos_operativo || 0
    })

    return Array.from(hourMap.entries())
      .map(([hora, data]) => ({
        hora: `${hora}:00`,
        horaNum: hora,
        items: data.count,
        tiempoMedio: data.count > 0 ? data.totalTime / data.count : 0,
      }))
      .sort((a, b) => a.horaNum - b.horaNum)
  }, [items])

  // Top 10 productos por tiempo
  const topProductos = useMemo(() => {
    return productos.slice(0, 10)
  }, [productos])

  // Alertas/Outliers
  const alertItems = useMemo(() => {
    return items
      .filter((item) => item.minutos_operativo > 30)
      .sort((a, b) => b.minutos_operativo - a.minutos_operativo)
      .slice(0, 20)
  }, [items])

  // Experiencia cliente promedio
  const avgClienteExperience = useMemo(() => {
    if (clientes.length === 0) return 0
    return clientes.reduce((acc, c) => acc + c.minutos_experiencia_cliente, 0) / clientes.length
  }, [clientes])

  const getRangeLabel = () => {
    const from = dateRange.from.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
    const to = dateRange.to.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
    return from === to ? from : `${from} - ${to}`
  }

  // For time KPIs, lower is better so we invert the trend display
  // const tiempoCocinaDelta = calculateDelta(
  //   aggregatedKPIs.tiempo_medio_cocina,
  //   previousAggregated?.tiempo_medio_cocina ?? null,
  // )
  // const tiempoSalaDelta = calculateDelta(
  //   aggregatedKPIs.tiempo_medio_sala,
  //   previousAggregated?.tiempo_medio_sala ?? null,
  // )
  // const itemsDelta = calculateDelta(aggregatedKPIs.items_servidos, previousAggregated?.items_servidos ?? null)

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={Clock}
        title="Operativa"
        subtitle={`Análisis de tiempos de servicio: ${getRangeLabel()}`}
        actions={
          <>
            <Tabs value={activeTab} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <TabsList className="bg-white border border-slate-200 shadow-sm">
                <TabsTrigger value="ayer" className={activeTabStyle}>
                  Ayer
                </TabsTrigger>
                <TabsTrigger value="semana" className={activeTabStyle}>
                  Semana
                </TabsTrigger>
                <TabsTrigger value="mes" className={activeTabStyle}>
                  Mes
                </TabsTrigger>
                <TabsTrigger value="trimestre" className={activeTabStyle}>
                  Trimestre
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />
          </>
        }
      />

      <PageContent>
        {/* Filtros adicionales */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Tipo:</span>
            <Tabs value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
              <TabsList className="bg-white border border-slate-200 shadow-sm h-9">
                <TabsTrigger value="todos" className={`${activeTabStyle} text-sm px-3 py-1`}>
                  Todos
                </TabsTrigger>
                <TabsTrigger value="comida" className={`${activeTabStyle} text-sm px-3 py-1`}>
                  Comida
                </TabsTrigger>
                <TabsTrigger value="bebida" className={`${activeTabStyle} text-sm px-3 py-1`}>
                  Bebidas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Categoría:</span>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricGroupCard
            title="Tiempo Cocina"
            icon={<ChefHat className="w-5 h-5" />}
            loading={loading}
            suffix=" min"
            decimals={1}
            total={createTimeComparisonResult(
              aggregatedKPIs.tiempo_medio_cocina,
              previousAggregated?.tiempo_medio_cocina ?? null,
            )}
            secondaryMetric={{
              label: "confirmed → ready",
              value: "",
            }}
          />

          <MetricGroupCard
            title="Tiempo Sala"
            icon={<Utensils className="w-5 h-5" />}
            loading={loading}
            suffix=" min"
            decimals={1}
            total={createTimeComparisonResult(
              aggregatedKPIs.tiempo_medio_sala,
              previousAggregated?.tiempo_medio_sala ?? null,
            )}
            secondaryMetric={{
              label: "ready → delivered",
              value: "",
            }}
          />

          <MetricGroupCard
            title="Items Servidos"
            icon={<Users className="w-5 h-5" />}
            loading={loading}
            total={createComparisonResult(aggregatedKPIs.items_servidos, previousAggregated?.items_servidos ?? null)}
            secondaryMetric={{
              label: `${aggregatedKPIs.items_comida} com · ${aggregatedKPIs.items_bebida} beb`,
              value: "",
            }}
          />

          <MetricGroupCard
            title="Alertas >30min"
            icon={<AlertTriangle className="w-5 h-5" />}
            loading={loading}
            total={{
              value: aggregatedKPIs.alertas_30min,
              delta: 0,
              trend: "neutral",
            }}
            secondaryMetric={
              aggregatedKPIs.alertas_45min > 0
                ? {
                    label: `${aggregatedKPIs.alertas_45min} críticos >45min`,
                    value: "",
                  }
                : undefined
            }
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolución Tiempos */}
          <TremorCard>
            <div className="flex items-center justify-between mb-4">
              <TremorTitle>Evolución Tiempos</TremorTitle>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }} />
                  <span>Cocina</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.accent }} />
                  <span>Sala</span>
                </div>
              </div>
            </div>
            {evolutionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionChartData}>
                  <CartesianGrid {...CHART_CONFIG.grid} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={(v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    {...CHART_CONFIG.axis}
                  />
                  <YAxis {...CHART_CONFIG.axis} unit=" min" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-2">
                            {new Date(label).toLocaleDateString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-xs mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-slate-500 font-medium w-12">{entry.name}</span>
                              <span className="font-bold text-slate-700">{entry.value?.toFixed(1)} min</span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cocina"
                    name="Cocina"
                    stroke={BRAND_COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: BRAND_COLORS.primary, r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sala"
                    name="Sala"
                    stroke={BRAND_COLORS.accent}
                    strokeWidth={2}
                    dot={{ fill: BRAND_COLORS.accent, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                <p>Sin datos para el periodo seleccionado</p>
              </div>
            )}
          </TremorCard>

          {/* Distribución por Hora */}
          <TremorCard>
            <TremorTitle>Distribución por Hora</TremorTitle>
            {hourDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourDistribution} layout="vertical">
                  <CartesianGrid {...CHART_CONFIG.grid} />
                  <XAxis type="number" {...CHART_CONFIG.axis} unit=" min" />
                  <YAxis type="category" dataKey="hora" {...CHART_CONFIG.axis} width={50} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-2">{data.hora}</p>
                          <div className="text-xs space-y-1">
                            <p>
                              <span className="text-slate-500">Items:</span>{" "}
                              <span className="font-bold">{data.items}</span>
                            </p>
                            <p>
                              <span className="text-slate-500">Tiempo medio:</span>{" "}
                              <span className="font-bold">{data.tiempoMedio.toFixed(1)} min</span>
                            </p>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="tiempoMedio" name="Tiempo Medio" fill={BRAND_COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                <p>Sin datos para el periodo seleccionado</p>
              </div>
            )}
          </TremorCard>
        </div>

        {/* Ranking Productos */}
        <TremorCard>
          <div className="flex items-center justify-between mb-4">
            <TremorTitle>Ranking Productos por Tiempo</TremorTitle>
            <span className="text-xs text-slate-500">{productos.length} productos</span>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded" />
              ))}
            </div>
          ) : topProductos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-3 font-semibold text-slate-600">Producto</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Categoría</th>
                    <th className="text-right p-3 font-semibold text-slate-600">Pedidos</th>
                    <th className="text-right p-3 font-semibold text-slate-600">T. Medio</th>
                    <th className="text-right p-3 font-semibold text-slate-600">Mediana</th>
                    <th className="text-right p-3 font-semibold text-slate-600">Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.map((prod, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{prod.producto}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: BRAND_COLORS.primary, // Changed from dynamic to fixed primary color
                            color: BRAND_COLORS.primary, // Changed from dynamic to fixed primary color
                          }}
                        >
                          {prod.categoria}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-slate-600">{prod.total_pedidos}</td>
                      <td
                        className="p-3 text-right font-bold"
                        style={{ color: getTimeColor(prod.tiempo_medio, "cocina") }}
                      >
                        {prod.tiempo_medio.toFixed(1)} min
                      </td>
                      <td className="p-3 text-right text-slate-600">{prod.mediana.toFixed(1)} min</td>
                      <td
                        className="p-3 text-right"
                        style={{ color: prod.tiempo_max > 45 ? BRAND_COLORS.error : "inherit" }}
                      >
                        {prod.tiempo_max.toFixed(1)} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">Sin datos de productos</div>
          )}
        </TremorCard>

        {/* Alertas / Outliers */}
        {alertItems.length > 0 && (
          <TremorCard>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" style={{ color: BRAND_COLORS.error }} />
              <TremorTitle>Items con Retraso ({">"}30 min)</TremorTitle>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-3 font-semibold text-slate-600">Fecha</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Hora</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Mesa</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Producto</th>
                    <th className="text-right p-3 font-semibold text-slate-600">Tiempo</th>
                    <th className="text-center p-3 font-semibold text-slate-600">Severidad</th>
                  </tr>
                </thead>
                <tbody>
                  {alertItems.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-slate-600">
                        {new Date(item.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="p-3 text-slate-600">{item.hora}:00</td>
                      <td className="p-3 font-medium text-slate-700">{item.mesa}</td>
                      <td className="p-3 text-slate-600">{item.producto}</td>
                      <td className="p-3 text-right font-bold" style={{ color: BRAND_COLORS.error }}>
                        {item.minutos_operativo.toFixed(0)} min
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          style={{
                            backgroundColor:
                              item.minutos_operativo > 60
                                ? BRAND_COLORS.error
                                : item.minutos_operativo > 45
                                  ? "#f97316"
                                  : BRAND_COLORS.warning,
                            color: "white",
                          }}
                        >
                          {item.minutos_operativo > 60 ? "Crítico" : item.minutos_operativo > 45 ? "Alto" : "Medio"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TremorCard>
        )}

        {/* Experiencia Cliente */}
        <TremorCard>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
            <TremorTitle>Experiencia Cliente</TremorTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Tiempo Medio Experiencia</p>
              <p className="text-3xl font-bold" style={{ color: BRAND_COLORS.primary }}>
                {avgClienteExperience.toFixed(0)} min
              </p>
              <p className="text-xs text-slate-400 mt-1">Desde primer pedido hasta última entrega</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Total Clientes Analizados</p>
              <p className="text-3xl font-bold" style={{ color: BRAND_COLORS.dark }}>
                {clientes.length}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Experiencia más larga</p>
              <p
                className="text-3xl font-bold"
                style={{
                  color: clientes[0]?.minutos_experiencia_cliente > 90 ? BRAND_COLORS.error : BRAND_COLORS.warning,
                }}
              >
                {clientes[0]?.minutos_experiencia_cliente?.toFixed(0) || 0} min
              </p>
              <p className="text-xs text-slate-400 mt-1">{clientes[0]?.mesa || "-"}</p>
            </div>
          </div>
        </TremorCard>
      </PageContent>
    </div>
  )
}

export default OperationsPage
