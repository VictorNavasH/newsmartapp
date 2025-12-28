"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useComparison } from "@/hooks/useComparison"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchReservationsFromDB, getBusinessDate, fetchYearlyComparison } from "@/lib/dataService"
import type { DailyCompleteMetrics, DateRange, YearlyComparisonData, YearlyTrendInsight } from "@/types"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, LineChart } from "recharts"
import {
  CalendarCheck,
  Users,
  PieChart,
  Grid3x3,
  RotateCw,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { CHART_CONFIG, CARD_TOOLTIPS, BRAND_COLORS } from "@/constants"
import { ResponsiveContainer } from "recharts"
import { formatDateLong, formatDateShort } from "@/lib/utils"

type PeriodKey = "hoy" | "ayer" | "semana" | "mes" | "trimestre" | "custom"
type YearlyMetric = "comensales" | "reservas"
type YearlyTurno = "total" | "comida" | "cena"

const YEAR_COLORS: Record<number, string> = {
  2021: "#94a3b8",
  2022: BRAND_COLORS.lunch,
  2023: BRAND_COLORS.error,
  2024: BRAND_COLORS.accent,
  2025: BRAND_COLORS.primary,
  2026: "#8b5cf6",
  2027: "#f59e0b",
}

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const activeTabStyle = `data-[state=active]:bg-[${BRAND_COLORS.primary}] data-[state=active]:text-white`

const ReservationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PeriodKey>("ayer")
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: yesterday, to: yesterday }
  })

  const [historyData, setHistoryData] = useState<DailyCompleteMetrics[]>([])

  const [yearlyData, setYearlyData] = useState<YearlyComparisonData[]>([])
  const [yearlyMetric, setYearlyMetric] = useState<YearlyMetric>("comensales")
  const [yearlyTurno, setYearlyTurno] = useState<YearlyTurno>("total")
  const [loadingYearly, setLoadingYearly] = useState(true)

  const { current, previous, loading, calculateDelta } = useComparison(dateRange)

  useEffect(() => {
    if (current) {
      console.log("[v0] ReservationsPage - current data:", {
        total: current.total,
        lunch: current.lunch,
        dinner: current.dinner,
        dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
      })
    }
    if (previous) {
      console.log("[v0] ReservationsPage - previous data:", {
        total: previous.total,
        lunch: previous.lunch,
        dinner: previous.dinner,
      })
    }
  }, [current, previous, dateRange])

  const setPeriod = (period: PeriodKey) => {
    const businessToday = getBusinessDate()
    businessToday.setHours(12, 0, 0, 0)
    const from = new Date(businessToday)
    const to = new Date(businessToday)

    console.log(
      "[v0] ReservationsPage setPeriod called with:",
      period,
      "today:",
      businessToday.toISOString().split("T")[0],
    )

    switch (period) {
      case "hoy":
        // businessToday ya está configurado
        break
      case "ayer":
        from.setDate(businessToday.getDate() - 1)
        to.setDate(businessToday.getDate() - 1)
        break
      case "semana":
        const day = businessToday.getDay() || 7
        if (day !== 1) from.setDate(businessToday.getDate() - (day - 1))
        to.setDate(businessToday.getDate() - 1)
        break
      case "mes":
        from.setDate(1)
        to.setDate(businessToday.getDate() - 1)
        break
      case "trimestre":
        const currentQuarter = Math.floor(businessToday.getMonth() / 3)
        from.setMonth(currentQuarter * 3, 1)
        to.setDate(businessToday.getDate() - 1)
        break
      default:
        return
    }

    setActiveTab(period)
    setDateRange({ from, to })
  }

  const handleDateChange = (newRange: DateRange) => {
    const normalizedFrom = new Date(newRange.from)
    normalizedFrom.setHours(12, 0, 0, 0)
    const normalizedTo = new Date(newRange.to)
    normalizedTo.setHours(12, 0, 0, 0)

    setActiveTab("custom")
    setDateRange({ from: normalizedFrom, to: normalizedTo })
  }

  useEffect(() => {
    const loadHistory = async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const data = await fetchReservationsFromDB(thirtyDaysAgo, today)
      setHistoryData(data)
    }
    loadHistory()
  }, [])

  useEffect(() => {
    const loadYearlyData = async () => {
      setLoadingYearly(true)
      const data = await fetchYearlyComparison()
      setYearlyData(data)
      setLoadingYearly(false)
    }
    loadYearlyData()
  }, [])

  const getMetricDelta = (
    getter: (m: DailyCompleteMetrics) => number,
    curr: DailyCompleteMetrics | null,
    prev: DailyCompleteMetrics | null,
  ) => {
    const c = curr ? getter(curr) : 0
    const p = prev ? getter(prev) : 0
    return calculateDelta(c, p)
  }

  const getPeriodLabel = () => {
    if (activeTab === "hoy" && dateRange.from.toDateString() === getBusinessDate().toDateString()) return "Hoy"
    if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return formatDateLong(dateRange.from)
    }
    return `${formatDateShort(dateRange.from)} - ${formatDateShort(dateRange.to)}`
  }

  const capacity = current?.capacity || {
    plazas_turno: 66,
    plazas_dia: 132,
    mesas_turno: 19,
    mesas_dia: 38,
  }

  const insightData = useMemo(() => {
    const getTrend = () => {
      if (!current || !previous) return "neutral"
      const currPax = current.total.pax
      const prevPax = previous.total.pax
      if (prevPax === 0) return "neutral"
      const d = ((currPax - prevPax) / prevPax) * 100
      return d > 0 ? "up" : d < 0 ? "down" : "neutral"
    }

    return {
      reservations: current?.total.reservations,
      occupancy: current?.total.occupancy_rate,
      pax_lunch: current?.lunch.pax,
      pax_dinner: current?.dinner.pax,
      trend: getTrend(),
    }
  }, [current, previous])

  const yearlyChartData = useMemo(() => {
    if (!yearlyData.length) return []

    const CAPACIDAD_TURNO = 66
    const CAPACIDAD_DIA = 132

    const chartData = MONTH_NAMES.map((mesNombre, index) => {
      const mes = index + 1
      const point: Record<string, any> = { mes: mesNombre }

      for (const yearData of yearlyData) {
        const monthData = yearData.meses.find((m) => m.mes === mes)

        let value = 0
        let ocupacionPct = 0
        let diasOp = 0

        if (monthData) {
          diasOp = monthData.dias_operativos || 0

          if (yearlyMetric === "comensales") {
            if (yearlyTurno === "total") {
              value = monthData.total_comensales
              ocupacionPct = diasOp > 0 ? (value / (CAPACIDAD_DIA * diasOp)) * 100 : 0
            } else if (yearlyTurno === "comida") {
              value = monthData.comensales_comida
              ocupacionPct = diasOp > 0 ? (value / (CAPACIDAD_TURNO * diasOp)) * 100 : 0
            } else {
              value = monthData.comensales_cena
              ocupacionPct = diasOp > 0 ? (value / (CAPACIDAD_TURNO * diasOp)) * 100 : 0
            }
          } else {
            if (yearlyTurno === "total") value = monthData.total_reservas
            else if (yearlyTurno === "comida") value = monthData.reservas_comida
            else value = monthData.reservas_cena
          }
        }

        point[`año_${yearData.año}`] = value || null
        point[`ocup_${yearData.año}`] = ocupacionPct > 0 ? ocupacionPct.toFixed(1) : null
        point[`dias_${yearData.año}`] = diasOp > 0 ? diasOp : null
      }

      return point
    })

    return chartData
  }, [yearlyData, yearlyMetric, yearlyTurno])

  const yearlyTrendInsight = useMemo((): YearlyTrendInsight | null => {
    if (yearlyData.length < 2) return null

    const currentYear = new Date().getFullYear()
    const currentYearData = yearlyData.find((y) => y.año === currentYear)
    const previousYearData = yearlyData.find((y) => y.año === currentYear - 1)

    if (!currentYearData || !previousYearData) return null

    const getValue = (data: YearlyComparisonData) => {
      if (yearlyMetric === "comensales") {
        if (yearlyTurno === "total") return data.totals.comensales
        if (yearlyTurno === "comida") return data.totals.comensales_comida
        return data.totals.comensales_cena
      } else {
        return data.totals.reservas
      }
    }

    const currentTotal = getValue(currentYearData)
    const previousTotal = getValue(previousYearData)
    const percentageChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

    const currentYearMeses = currentYearData.meses.filter((m) => {
      if (yearlyMetric === "comensales") {
        return yearlyTurno === "total"
          ? m.total_comensales > 0
          : yearlyTurno === "comida"
            ? m.comensales_comida > 0
            : m.comensales_cena > 0
      }
      return m.total_reservas > 0
    })

    const getMonthValue = (m: (typeof currentYearMeses)[0]) => {
      if (yearlyMetric === "comensales") {
        if (yearlyTurno === "total") return m.total_comensales
        if (yearlyTurno === "comida") return m.comensales_comida
        return m.comensales_cena
      }
      return m.total_reservas
    }

    const sortedMeses = [...currentYearMeses].sort((a, b) => getMonthValue(b) - getMonthValue(a))
    const bestMonth = sortedMeses[0]
    const worstMonth = sortedMeses[sortedMeses.length - 1]

    return {
      currentYear,
      previousYear: currentYear - 1,
      currentYearTotal: currentTotal,
      previousYearTotal: previousTotal,
      percentageChange,
      trend: percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral",
      bestMonth: bestMonth ? { mes: bestMonth.mes_nombre, valor: getMonthValue(bestMonth) } : { mes: "-", valor: 0 },
      worstMonth: worstMonth
        ? { mes: worstMonth.mes_nombre, valor: getMonthValue(worstMonth) }
        : { mes: "-", valor: 0 },
    }
  }, [yearlyData, yearlyMetric, yearlyTurno])

  const availableYears = useMemo(() => yearlyData.map((y) => y.año), [yearlyData])

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={CalendarCheck}
        title="Reservas & Ocupación"
        subtitle={`Visión unificada de demanda y eficiencia: ${getPeriodLabel()}`}
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
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Por Turno</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.plazas_turno} plazas</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.mesas_turno} mesas</span>
                  </div>
                </div>
              </div>

              <div className="h-12 w-px bg-slate-200" />

              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Por Día</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.plazas_dia} plazas</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.mesas_dia} mesas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 italic">100% ocupación = {capacity.plazas_dia} comensales/día</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricGroupCard
            title="Reservas Totales"
            icon={<CalendarCheck className="w-5 h-5" />}
            loading={loading}
            total={getMetricDelta((d) => d.total.reservations, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.reservations, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.reservations, current, previous)}
            secondaryMetric={{
              label: "Pax/Res",
              value: current?.total.avg_pax_per_res.toFixed(1) || "0",
            }}
            tooltip={CARD_TOOLTIPS.reservations}
          />

          <MetricGroupCard
            title="Total Comensales"
            icon={<Users className="w-5 h-5" />}
            loading={loading}
            total={getMetricDelta((d) => d.total.pax, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.pax, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.pax, current, previous)}
            tooltip={CARD_TOOLTIPS.pax}
          />

          <MetricGroupCard
            title="Ocupación"
            icon={<PieChart className="w-5 h-5" />}
            loading={loading}
            suffix="%"
            decimals={1}
            total={getMetricDelta((d) => d.total.occupancy_rate, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.occupancy_rate, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.occupancy_rate, current, previous)}
            tooltip={CARD_TOOLTIPS.occupancy}
          />

          <MetricGroupCard
            title="Mesas Utilizadas"
            icon={<Grid3x3 className="w-5 h-5" />}
            loading={loading}
            total={getMetricDelta((d) => d.total.tables_used, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.tables_used, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.tables_used, current, previous)}
            secondaryMetric={{
              label: `de ${capacity.mesas_dia}`,
              value: "",
            }}
            tooltip={CARD_TOOLTIPS.tables}
          />

          <MetricGroupCard
            title="Rotación de Mesas"
            icon={<RotateCw className="w-5 h-5" />}
            loading={loading}
            suffix="x"
            decimals={1}
            total={getMetricDelta((d) => d.total.table_rotation, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.table_rotation, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.table_rotation, current, previous)}
            tooltip={CARD_TOOLTIPS.rotation}
          />

          <MetricGroupCard
            title="Media Pax por Mesa"
            icon={<UserCheck className="w-5 h-5" />}
            loading={loading}
            decimals={1}
            total={getMetricDelta((d) => d.total.avg_pax_per_table_used, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.avg_pax_per_table_used, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.avg_pax_per_table_used, current, previous)}
            tooltip={CARD_TOOLTIPS.paxPerTable}
          />
        </div>

        <TremorCard>
          <div className="flex items-center justify-between">
            <TremorTitle>Evolución de Reservas y Ocupación (Últimos 30 días)</TremorTitle>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }} />
                <span>Reservas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.accent }} />
                <span>Comensales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.lunch }} />
                <span>Ocupación</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={historyData}>
                  <CartesianGrid {...CHART_CONFIG.grid} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    {...CHART_CONFIG.axis}
                  />
                  <YAxis yAxisId="left" {...CHART_CONFIG.axis} />
                  <YAxis yAxisId="right" orientation="right" {...CHART_CONFIG.axis} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                            {new Date(label).toLocaleDateString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                          {payload.map((entry: any, index: number) => {
                            const isOccupancy = entry.name === "Ocupación"
                            return (
                              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 font-medium w-20">{entry.name}</span>
                                <span className="font-bold text-slate-700">
                                  {entry.value}
                                  {isOccupancy ? "%" : ""}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="total.reservations"
                    name="Reservas"
                    fill={BRAND_COLORS.primary}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="total.pax"
                    name="Comensales"
                    fill={BRAND_COLORS.accent}
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total.occupancy_rate"
                    name="Ocupación"
                    stroke={BRAND_COLORS.lunch}
                    strokeWidth={3}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-slate-400">Cargando datos...</div>
            )}
          </div>
        </TremorCard>

        <TremorCard>
          <div className="flex items-center justify-between mb-6">
            <TremorTitle>Comparativa Anual</TremorTitle>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Métrica:</span>
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
                <span className="text-xs text-slate-400">(mismas fechas hasta ayer)</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Variación</div>
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
                    {yearlyTrendInsight.currentYear}: {yearlyTrendInsight.currentYearTotal.toLocaleString("es-ES")}{" "}
                    {yearlyMetric} | {yearlyTrendInsight.previousYear}:{" "}
                    {yearlyTrendInsight.previousYearTotal.toLocaleString("es-ES")} {yearlyMetric}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Mejor Mes ({yearlyTrendInsight.currentYear})</div>
                  <div className="text-lg font-bold" style={{ color: BRAND_COLORS.success }}>
                    {yearlyTrendInsight.bestMonth.mes}
                  </div>
                  <div className="text-xs text-slate-400">
                    {yearlyTrendInsight.bestMonth.valor.toLocaleString("es-ES")} {yearlyMetric}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Peor Mes ({yearlyTrendInsight.currentYear})</div>
                  <div className="text-lg font-bold" style={{ color: BRAND_COLORS.error }}>
                    {yearlyTrendInsight.worstMonth.mes}
                  </div>
                  <div className="text-xs text-slate-400">
                    {yearlyTrendInsight.worstMonth.valor.toLocaleString("es-ES")} {yearlyMetric}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingYearly ? (
            <div className="flex items-center justify-center h-64">
              <p>Cargando datos históricos anuales...</p>
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
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                            {label}
                          </p>
                          {payload
                            .filter((entry: any) => entry.value !== null)
                            .map((entry: any, index: number) => {
                              const year = entry.dataKey.replace("año_", "")
                              const ocupacion = entry.payload[`ocup_${year}`]
                              const diasOp = entry.payload[`dias_${year}`]
                              return (
                                <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-slate-500 font-medium w-12">{entry.name}</span>
                                  <span className="font-bold text-slate-700">
                                    {entry.value?.toLocaleString("es-ES")} {yearlyMetric}
                                  </span>
                                  {yearlyMetric === "comensales" && ocupacion && diasOp && (
                                    <span className="text-slate-400 text-[10px]">
                                      ({ocupacion}% ocup. · {diasOp} días)
                                    </span>
                                  )}
                                </div>
                              )
                            })}
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
              <p>No hay datos históricos disponibles</p>
            </div>
          )}
        </TremorCard>
      </PageContent>
    </div>
  )
}

export default ReservationsPage
