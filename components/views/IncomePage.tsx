"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchIncomeFromDB,
  aggregateMetrics,
  fetchTableBillingFromDB,
  aggregateTableMetrics,
  getBusinessDate,
} from "@/lib/dataService"
import type { DailyCompleteMetrics, DateRange, TableBillingMetrics, TableAggregatedMetrics } from "@/types"
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, Receipt, Utensils, Users, TrendingUp, Award, Table2 } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { CHART_CONFIG, CARD_TOOLTIPS, BRAND_COLORS } from "@/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDateLong, formatDateShort } from "@/lib/utils"

type PeriodKey = "hoy" | "ayer" | "semana" | "mes" | "trimestre" | "custom"

const activeTabStyle = `data-[state=active]:bg-[${BRAND_COLORS.primary}] data-[state=active]:text-white`

const IncomePage: React.FC = () => {
  const chartCardRef = useRef<HTMLDivElement>(null)
  const [summaryCardHeight, setSummaryCardHeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(false) // Declare loading variable

  const [activeTab, setActiveTab] = useState<PeriodKey>("ayer")
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: yesterday, to: yesterday }
  })

  const [historyData, setHistoryData] = useState<DailyCompleteMetrics[]>([])

  const [current, setCurrent] = useState<DailyCompleteMetrics | null>(null)
  const [previous, setPrevious] = useState<DailyCompleteMetrics | null>(null)

  const [tableData, setTableData] = useState<TableAggregatedMetrics[]>([])
  const [tableHistory, setTableHistory] = useState<TableBillingMetrics[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [loadingTables, setLoadingTables] = useState(true)

  console.log("[v0] Rendering IncomePage with current data:", {
    fecha: current?.total.revenue,
    pax: current?.total.pax,
    dateRange: dateRange,
    hasCurrentData: !!current,
  })

  const handlePeriodChange = (period: string) => {
    const businessToday = getBusinessDate()
    businessToday.setHours(12, 0, 0, 0)
    const fromDate = new Date(businessToday)
    const toDate = new Date(businessToday)

    switch (period) {
      case "hoy":
        setDateRange({ from: businessToday, to: businessToday })
        setActiveTab("hoy")
        return
      case "ayer":
        fromDate.setDate(businessToday.getDate() - 1)
        toDate.setDate(businessToday.getDate() - 1)
        break
      case "semana":
        const day = businessToday.getDay() || 7
        if (day !== 1) fromDate.setDate(businessToday.getDate() - (day - 1))
        toDate.setDate(businessToday.getDate() - 1)
        break
      case "mes":
        fromDate.setDate(1)
        toDate.setDate(businessToday.getDate() - 1)
        break
      case "trimestre":
        const currentQuarter = Math.floor(businessToday.getMonth() / 3)
        fromDate.setMonth(currentQuarter * 3, 1)
        toDate.setDate(businessToday.getDate() - 1)
        break
      default:
        return
    }

    setActiveTab(period as PeriodKey)
    setDateRange({ from: fromDate, to: toDate })
  }

  const handleDateChange = (newRange: DateRange) => {
    if (!newRange.from || !newRange.to) return

    const normalizeDate = (date: Date) => {
      const normalized = new Date(date)
      normalized.setHours(12, 0, 0, 0)
      return normalized
    }

    console.log("[v0] handleDateChange called with:", {
      from: newRange.from.toISOString().split("T")[0],
      to: newRange.to.toISOString().split("T")[0],
    })

    setActiveTab("custom")
    setDateRange({
      from: normalizeDate(newRange.from),
      to: normalizeDate(newRange.to),
    })
  }

  useEffect(() => {
    const loadData = async () => {
      if (!dateRange.from || !dateRange.to) return

      setLoading(true)
      try {
        const currentData = await fetchIncomeFromDB(dateRange.from, dateRange.to)

        console.log("[v0] currentData received:", {
          count: currentData.length,
          firstDate: currentData[0]?.fecha,
          dateRange: { from: dateRange.from, to: dateRange.to },
        })

        const oneDayMs = 24 * 60 * 60 * 1000
        const daysDiff = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / oneDayMs) + 1

        let prevFrom: Date
        let prevTo: Date

        if (daysDiff === 1) {
          prevFrom = new Date(dateRange.from)
          prevFrom.setDate(prevFrom.getDate() - 7)
          prevTo = new Date(dateRange.to)
          prevTo.setDate(prevTo.getDate() - 7)
        } else if (daysDiff <= 7) {
          prevFrom = new Date(dateRange.from)
          prevFrom.setDate(prevFrom.getDate() - 7)
          prevTo = new Date(dateRange.to)
          prevTo.setDate(prevTo.getDate() - 7)
        } else if (daysDiff <= 31) {
          prevFrom = new Date(dateRange.from)
          prevFrom.setMonth(prevFrom.getMonth() - 1)
          prevTo = new Date(dateRange.to)
          prevTo.setMonth(prevTo.getMonth() - 1)
          const maxDayPrevMonth = new Date(prevTo.getFullYear(), prevTo.getMonth() + 1, 0).getDate()
          if (prevTo.getDate() > maxDayPrevMonth) {
            prevTo.setDate(maxDayPrevMonth)
          }
        } else {
          prevTo = new Date(dateRange.from)
          prevTo.setDate(prevTo.getDate() - 1)
          prevFrom = new Date(prevTo)
          prevFrom.setDate(prevFrom.getDate() - (daysDiff - 1))
        }

        const previousData = await fetchIncomeFromDB(prevFrom, prevTo)

        console.log("[v0] previousData received:", {
          count: previousData.length,
          firstDate: previousData[0]?.fecha,
          prevRange: { from: prevFrom, to: prevTo },
        })

        const currentAgg = aggregateMetrics(currentData)
        const previousAgg = aggregateMetrics(previousData)

        console.log("[v0] Aggregated metrics:", {
          currentRevenue: currentAgg?.total.revenue,
          previousRevenue: previousAgg?.total.revenue,
          currentPax: currentAgg?.total.pax,
          previousPax: previousAgg?.total.pax,
        })

        setCurrent(currentAgg)
        setPrevious(previousAgg)
      } catch (err) {
        console.error("[v0] Error loading income data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  useEffect(() => {
    const loadHistory = async () => {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      // fetchIncomeFromDB recibe Date objects
      const data = await fetchIncomeFromDB(thirtyDaysAgo, today)
      setHistoryData(data)
    }
    loadHistory()
  }, [])

  useEffect(() => {
    const loadTableData = async () => {
      setLoadingTables(true)
      try {
        // fetchTableBillingFromDB recibe Date objects
        const data = await fetchTableBillingFromDB(dateRange.from, dateRange.to)
        const aggregated = aggregateTableMetrics(data)
        setTableData(aggregated)
        setTableHistory(data)
        if (aggregated.length > 0 && !selectedTable) {
          setSelectedTable(aggregated[0].table_id)
        }
      } catch (err) {
        console.error("[v0] Error loading table data:", err)
      } finally {
        setLoadingTables(false)
      }
    }

    loadTableData()
  }, [dateRange])

  const calculateDelta = (curr: number, prev: number) => {
    const delta = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100
    return {
      value: curr,
      previous: prev,
      delta: Number.parseFloat(delta.toFixed(1)),
      trend: (delta > 0 ? "up" : delta < 0 ? "down" : "neutral") as "up" | "down" | "neutral",
    }
  }

  const getMetricDelta = (getter: (m: DailyCompleteMetrics) => number) => {
    const c = current ? getter(current) : 0
    const p = previous ? getter(previous) : 0
    return calculateDelta(c, p)
  }

  const getPeriodLabel = () => {
    // getBusinessDate() se llama solo si activeTab es 'hoy'
    if (activeTab === "hoy" && dateRange.from.getTime() === getBusinessDate().getTime()) return "Hoy"
    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return formatDateLong(dateRange.from)
    }
    return `${formatDateShort(dateRange.from)} - ${formatDateShort(dateRange.to)}`
  }

  const tipPercentage = current
    ? current.total.revenue > 0
      ? ((current.total.tips / current.total.revenue) * 100).toFixed(1)
      : "0"
    : "0"

  const totalPayments = current
    ? current.total.payment_methods.card + current.total.payment_methods.cash + current.total.payment_methods.digital
    : 0

  const cardPct = totalPayments > 0 ? ((current!.total.payment_methods.card / totalPayments) * 100).toFixed(0) : "0"
  const cashPct = totalPayments > 0 ? ((current!.total.payment_methods.cash / totalPayments) * 100).toFixed(0) : "0"
  const digitalPct =
    totalPayments > 0 ? ((current!.total.payment_methods.digital / totalPayments) * 100).toFixed(0) : "0"

  const insightData = useMemo(() => {
    const getTrend = () => {
      if (!current || !previous) return "neutral"
      const currRev = current.total.revenue
      const prevRev = previous.total.revenue
      if (prevRev === 0) return "neutral"
      const d = ((currRev - prevRev) / prevRev) * 100
      return d > 0 ? "up" : d < 0 ? "down" : "neutral"
    }

    return {
      revenue: current?.total.revenue,
      tips: current?.total.tips,
      transactions: current?.total.transactions,
      avg_ticket_pax: current?.total.avg_ticket_pax,
      trend: getTrend(),
    }
  }, [current, previous])

  const selectedTableTrend = useMemo(() => {
    if (!selectedTable) return []

    const tableMetrics = tableHistory
      .filter((row) => row.table_id === selectedTable)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    const dateMap = new Map<string, { fecha: string; facturado: number; propinas: number; facturas: number }>()

    tableMetrics.forEach((row) => {
      if (!dateMap.has(row.fecha)) {
        dateMap.set(row.fecha, {
          fecha: row.fecha,
          facturado: 0,
          propinas: 0,
          facturas: 0,
        })
      }
      const entry = dateMap.get(row.fecha)!
      entry.facturado += row.total_facturado
      entry.propinas += row.total_propinas
      entry.facturas += row.num_facturas
    })

    return Array.from(dateMap.values())
  }, [selectedTable, tableHistory])

  const selectedTableData = tableData.find((t) => t.table_id === selectedTable)

  const validPaxDays = historyData.filter((d) => (d.total?.avg_ticket_pax || 0) > 0)
  const avgTicketPax =
    validPaxDays.length > 0
      ? validPaxDays.reduce((acc, d) => acc + (d.total?.avg_ticket_pax || 0), 0) / validPaxDays.length
      : 0

  const validTableDays = historyData.filter((d) => (d.total?.avg_ticket_table || 0) > 0)
  const avgTicketTable =
    validTableDays.length > 0
      ? validTableDays.reduce((acc, d) => acc + (d.total?.avg_ticket_table || 0), 0) / validTableDays.length
      : 0

  // formatDate se usa solo para debug, se elimina del scope principal
  // const formatDate = (date: Date): string => {
  //   const yyyy = date.getFullYear()
  //   const mm = String(date.getMonth() + 1).padStart(2, "0")
  //   const dd = String(date.getDate()).padStart(2, "0")
  //   return `${yyyy}-${mm}-${dd}`
  // }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={DollarSign}
        title="Ingresos"
        subtitle={`Análisis financiero y tickets medios: ${getPeriodLabel()}`}
        actions={
          <>
            <Tabs value={activeTab} onValueChange={(v) => handlePeriodChange(v)}>
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
                {/* <TabsTrigger value="hoy" className={activeTabStyle}>Hoy</TabsTrigger> */}
              </TabsList>
            </Tabs>

            {/* DateRangePicker recibe directamente Date objects */}
            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />
          </>
        }
      />

      <PageContent>
        {/* AIInsightCard has been removed for brevity */}
        {/* Fila 1: Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricGroupCard
            title="Ingresos Totales"
            icon={<DollarSign className="w-5 h-5" />}
            loading={loading}
            decimals={2}
            suffix="€"
            total={getMetricDelta((d) => d.total.revenue)}
            lunch={getMetricDelta((d) => d.lunch.revenue)}
            dinner={getMetricDelta((d) => d.dinner.revenue)}
            secondaryMetric={{
              label: "Nº FACTURAS",
              value: current?.total.transactions || 0,
            }}
            tooltip={CARD_TOOLTIPS.totalRevenue}
          />

          <MetricGroupCard
            title="Propinas"
            icon={<Receipt className="w-5 h-5" />}
            loading={loading}
            decimals={2}
            suffix="€"
            total={getMetricDelta((d) => d.total.tips)}
            lunch={getMetricDelta((d) => d.lunch.tips)}
            dinner={getMetricDelta((d) => d.dinner.tips)}
            secondaryMetric={{
              label: `${tipPercentage}% s/Facturación`,
              value: "",
            }}
            tooltip={CARD_TOOLTIPS.tips}
          />

          <MetricGroupCard
            title="Ticket por Comensal"
            icon={<Users className="w-5 h-5" />}
            loading={loading}
            decimals={2}
            suffix="€"
            total={getMetricDelta((d) => d.total.avg_ticket_pax)}
            lunch={getMetricDelta((d) => d.lunch.avg_ticket_pax)}
            dinner={getMetricDelta((d) => d.dinner.avg_ticket_pax)}
            secondaryMetric={{
              label: "PAX TOTAL",
              value: current?.total.pax || 0,
            }}
            tooltip={CARD_TOOLTIPS.avgTicketPax}
          />
        </div>

        {/* Fila 2: Análisis Detallado - Tickets Medios */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricGroupCard
            title="Ticket por Transacción"
            icon={<Receipt className="w-5 h-5" />}
            loading={loading}
            decimals={2}
            suffix="€"
            total={getMetricDelta((d) => d.total.avg_ticket_transaction)}
            lunch={getMetricDelta((d) => d.lunch.avg_ticket_transaction)}
            dinner={getMetricDelta((d) => d.dinner.avg_ticket_transaction)}
            tooltip={CARD_TOOLTIPS.avgTicketTransaction}
            secondaryMetric={{
              label: "Nº TRANS.",
              value: current?.total.transactions || 0,
            }}
          />

          <MetricGroupCard
            title="Ticket por Mesa"
            icon={<Table2 className="w-5 h-5" />}
            loading={loading}
            decimals={2}
            suffix="€"
            total={getMetricDelta((d) => d.total.avg_ticket_table)}
            lunch={getMetricDelta((d) => d.lunch.avg_ticket_table)}
            dinner={getMetricDelta((d) => d.dinner.avg_ticket_table)}
            tooltip={CARD_TOOLTIPS.avgTicketTable}
            secondaryMetric={{
              label: "Nº MESAS",
              value: current?.total.tables_used || 0,
            }}
          />

          <MetricGroupCard
            title="Ticket por Reserva"
            icon={<Utensils className="w-5 h-5" />}
            loading={loading}
            decimals={2}
            suffix="€"
            total={getMetricDelta((d) => d.total.avg_ticket_res)}
            lunch={getMetricDelta((d) => d.lunch.avg_ticket_res)}
            dinner={getMetricDelta((d) => d.dinner.avg_ticket_res)}
            tooltip={CARD_TOOLTIPS.avgTicketReservation}
            secondaryMetric={{
              label: "Nº RESERV.",
              value: current?.total.reservations || 0,
            }}
          />

          {/* Payment Methods Card - Use BRAND_COLORS */}
          <TremorCard>
            <div className="flex items-center gap-2 mb-4">
              <Table2 className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
              <h3 className="font-bold text-[#364f6b] text-base">Métodos de Pago</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <div className="flex items-center gap-2">
                  <Table2 className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                  <span className="text-sm font-medium text-slate-600">Tarjeta</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#364f6b]">{cardPct}%</p>
                  <p className="text-xs text-slate-500">
                    {current?.total.payment_methods.card.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                  <span className="text-sm font-medium text-slate-600">Efectivo</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#364f6b]">{cashPct}%</p>
                  <p className="text-xs text-slate-500">
                    {current?.total.payment_methods.cash.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: BRAND_COLORS.lunch }} />
                  <span className="text-sm font-medium text-slate-600">Otros</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#364f6b]">{digitalPct}%</p>
                  <p className="text-xs text-slate-500">
                    {current?.total.payment_methods.digital.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </p>
                </div>
              </div>
            </div>
          </TremorCard>
        </div>

        {/* Gráficos de Evolución - Use BRAND_COLORS throughout */}
        <div className="grid grid-cols-1 gap-6">
          {/* Evolución de Ingresos */}
          <TremorCard>
            <div className="flex items-center justify-between">
              <TremorTitle>Evolución de Ingresos (Últimos 30 días)</TremorTitle>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }} />
                  <span>Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.lunch }} />
                  <span>Comida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.accent }} />
                  <span>Cena</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={historyData}>
                    <CartesianGrid {...CHART_CONFIG.grid} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      {...CHART_CONFIG.axis}
                    />
                    <YAxis {...CHART_CONFIG.axis} />
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
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 font-medium w-16">{entry.name}</span>
                                <span className="font-bold text-slate-700">
                                  {entry.value.toLocaleString("es-ES", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  €
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total.revenue"
                      name="Total"
                      stroke={BRAND_COLORS.primary}
                      strokeWidth={3}
                      dot={{ fill: BRAND_COLORS.primary, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="lunch.revenue"
                      name="Comida"
                      stroke={BRAND_COLORS.lunch}
                      strokeWidth={2}
                      dot={{ fill: BRAND_COLORS.lunch, r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dinner.revenue"
                      name="Cena"
                      stroke={BRAND_COLORS.accent}
                      strokeWidth={2}
                      dot={{ fill: BRAND_COLORS.accent, r: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <p>Cargando datos históricos...</p>
                </div>
              )}
            </div>
          </TremorCard>

          {/* Evolución de Tickets Medios */}
          <TremorCard>
            <div className="flex items-center justify-between mb-6">
              <TremorTitle className="flex items-center gap-2 text-lg">
                Evolución de Tickets Medios (Últimos 30 días)
              </TremorTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHART_CONFIG.avgTicketColors.pax }}
                    />
                    <span className="text-slate-600">Por Comensal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHART_CONFIG.avgTicketColors.table }}
                    />
                    <span className="text-slate-600">Por Mesa</span>
                  </div>
                </div>
                {historyData.length > 0 && (
                  <div className="flex gap-3">
                    <div
                      className="px-3 py-2 rounded-lg text-center min-w-[100px]"
                      style={{ backgroundColor: `${CHART_CONFIG.avgTicketColors.pax}20` }}
                    >
                      <p className="text-xs text-slate-500 mb-0.5">Ticket Comensal</p>
                      <p className="text-lg font-bold" style={{ color: CHART_CONFIG.avgTicketColors.pax }}>
                        {avgTicketPax.toFixed(2)}€
                      </p>
                    </div>
                    <div
                      className="px-3 py-2 rounded-lg text-center min-w-[100px]"
                      style={{ backgroundColor: `${CHART_CONFIG.avgTicketColors.table}20` }}
                    >
                      <p className="text-xs text-slate-500 mb-0.5">Ticket Mesa</p>
                      <p className="text-lg font-bold" style={{ color: CHART_CONFIG.avgTicketColors.table }}>
                        {avgTicketTable.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* </CHANGE> */}
            </div>
            <div className="h-80">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={historyData}>
                    <CartesianGrid {...CHART_CONFIG.grid} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      {...CHART_CONFIG.axis}
                    />
                    <YAxis {...CHART_CONFIG.axis} />
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
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 font-medium w-24">{entry.name}</span>
                                <span className="text-slate-700 font-bold ml-auto">{entry.value}€</span>
                              </div>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total.avg_ticket_pax"
                      stroke={CHART_CONFIG.avgTicketColors.pax}
                      strokeWidth={2.5}
                      dot={false}
                      name="Por Comensal"
                    />
                    <Line
                      type="monotone"
                      dataKey="total.avg_ticket_table"
                      stroke={CHART_CONFIG.avgTicketColors.table}
                      strokeWidth={2.5}
                      dot={false}
                      name="Por Mesa"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <p>No hay datos disponibles para esta mesa</p>
                </div>
              )}
            </div>
          </TremorCard>
        </div>

        {/* Análisis por Mesa - Use BRAND_COLORS */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6" style={{ color: BRAND_COLORS.primary }} />
            <h2 className="text-2xl font-bold text-[#364f6b]">Análisis por Mesa</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking de Mesas - todas las mesas con scroll */}
            <TremorCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                  <TremorTitle>Ranking de Mesas</TremorTitle>
                </div>
                <span className="text-xs text-slate-500">{tableData.length} mesas</span>
              </div>

              {loadingTables ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {tableData.map((table, index) => {
                    const medalEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`
                    const maxRevenue = tableData[0]?.total_facturado || 1
                    const barWidth = (table.total_facturado / maxRevenue) * 100
                    const isSelected = selectedTable === table.table_id

                    return (
                      <div
                        key={table.table_id}
                        className={`p-3 rounded-lg transition-all cursor-pointer ${
                          isSelected ? "border-2" : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${BRAND_COLORS.primary}10` : undefined,
                          borderColor: isSelected ? BRAND_COLORS.primary : "transparent",
                        }}
                        onClick={() => setSelectedTable(table.table_id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-lg font-bold w-8"
                              style={{ color: index < 3 ? BRAND_COLORS.success : "#64748b" }}
                            >
                              {medalEmoji}
                            </span>
                            <span className="font-medium text-slate-700">{table.nombre_mesa}</span>
                          </div>
                          <span className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                            {table.total_facturado.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            €
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${barWidth}%`,
                                background: `linear-gradient(to right, ${BRAND_COLORS.primary}, ${BRAND_COLORS.success})`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-16 text-right">{table.num_facturas} facturas</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TremorCard>

            <TremorCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                  <TremorTitle>Evolución de Mesa</TremorTitle>
                </div>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecciona una mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tableData.map((table) => (
                      <SelectItem key={table.table_id} value={table.table_id}>
                        {table.nombre_mesa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTableData && (
                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Facturado</p>
                    <p className="text-lg font-bold text-[#364f6b]">
                      {selectedTableData.total_facturado.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      €
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Nº Facturas</p>
                    <p className="text-lg font-bold text-[#364f6b]">{selectedTableData.num_facturas}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Ticket Medio</p>
                    <p className="text-lg font-bold text-[#364f6b]">
                      {selectedTableData.avg_factura.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      €
                    </p>
                  </div>
                </div>
              )}

              <div className="h-[280px]">
                {selectedTableTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={selectedTableTrend}>
                      <CartesianGrid {...CHART_CONFIG.grid} />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
                        }
                        {...CHART_CONFIG.axis}
                      />
                      <YAxis {...CHART_CONFIG.axis} />
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
                              <div className="space-y-1">
                                <p className="text-xs text-slate-600">
                                  Facturado:{" "}
                                  <span className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                                    {payload[0]?.value.toLocaleString("es-ES", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                    €
                                  </span>
                                </p>
                                <p className="text-xs text-slate-600">
                                  Facturas: <span className="font-bold">{payload[0]?.payload.facturas}</span>
                                </p>
                              </div>
                            </div>
                          )
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="facturado"
                        stroke={BRAND_COLORS.primary}
                        strokeWidth={3}
                        dot={{ fill: BRAND_COLORS.primary, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p>No hay datos disponibles para esta mesa</p>
                  </div>
                )}
              </div>
            </TremorCard>
          </div>

          {/* Métricas Detalladas - Use BRAND_COLORS */}
          <TremorCard className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Table2 className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
              <TremorTitle>Métricas Detalladas por Mesa</TremorTitle>
            </div>

            {loadingTables ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-3 font-semibold text-slate-600">Ranking</th>
                      <th className="text-left p-3 font-semibold text-slate-600">Mesa</th>
                      <th className="text-right p-3 font-semibold text-slate-600">Total €</th>
                      <th className="text-right p-3 font-semibold text-slate-600">Facturas</th>
                      <th className="text-right p-3 font-semibold text-slate-600">Propinas</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Avg/Factura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((table, index) => {
                      const medalEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null

                      return (
                        <tr
                          key={table.table_id}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: selectedTable === table.table_id ? `${BRAND_COLORS.primary}08` : undefined,
                          }}
                          onClick={() => setSelectedTable(table.table_id)}
                        >
                          <td className="p-3">
                            {medalEmoji ? (
                              <span className="text-lg">{medalEmoji}</span>
                            ) : (
                              <span
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                                style={{
                                  backgroundColor: "#f1f5f9",
                                  color: "#64748b",
                                }}
                              >
                                {index + 1}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-700">{table.nombre_mesa}</td>
                          <td className="p-3 text-right font-bold" style={{ color: BRAND_COLORS.primary }}>
                            {table.total_facturado.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            €
                          </td>
                          <td className="p-3 text-right text-slate-600">{table.num_facturas}</td>
                          <td className="p-3 text-right text-slate-600">
                            {table.total_propinas.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            €
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            {table.avg_factura.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            €
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TremorCard>
        </div>
      </PageContent>
    </div>
  )
}

export default IncomePage
