"use client"
import { useEffect, useState, useMemo, useCallback } from "react"
import { WeatherCard } from "@/components/features/WeatherCard"
import { WeekReservationsCard } from "@/components/features/WeekReservationsCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { fetchRealTimeData, fetchFinancialKPIs, fetchLaborCostAnalysis, fetchWeekRevenue } from "@/lib/dataService"
import type { RealTimeData, FinancialKPIs, LaborCostDay, WeekRevenueDay } from "@/types"
import {
  Banknote,
  Receipt,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart,
  SunIcon,
  MoonIcon,
  RefreshCw,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { formatCurrency, formatTime, formatDateLong } from "@/lib/utils"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
  Legend,
} from "recharts"

export function DashboardPage() {
  const [liveData, setLiveData] = useState<RealTimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [dbConnected, setDbConnected] = useState(true)

  const [financialKPIs, setFinancialKPIs] = useState<FinancialKPIs[]>([])
  const [financialPeriod, setFinancialPeriod] = useState<string>("mes")
  const [laborCostData, setLaborCostData] = useState<LaborCostDay[]>([])
  const [laborCostDays, setLaborCostDays] = useState<number>(15)
  const [weekRevenueData, setWeekRevenueData] = useState<WeekRevenueDay[]>([])
  const [weekOffset, setWeekOffset] = useState<number>(0)

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - laborCostDays)
        const [data, kpis, laborCost, weekRevenue] = await Promise.all([
          fetchRealTimeData(),
          fetchFinancialKPIs(),
          fetchLaborCostAnalysis(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]),
          fetchWeekRevenue(weekOffset),
        ])
        setLiveData(data)
        setFinancialKPIs(kpis)
        setLaborCostData(laborCost)
        setWeekRevenueData(weekRevenue)
        setDbConnected(true)
        setLastUpdate(new Date())
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        setDbConnected(false)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [laborCostDays, weekOffset],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  const currentKPIs = useMemo(() => {
    return financialKPIs.find((k) => k.periodo === financialPeriod) || null
  }, [financialKPIs, financialPeriod])

  const currentShift = liveData?.total
  const topProducts = currentShift?.sales_data?.top_products || []
  const vfMetrics = currentShift?.verifactu_metrics || { success: 0, error: 0, pending: 0 }

  const trimestreLabel = useMemo(() => {
    const trimestre = financialKPIs.find((k) => k.periodo !== "mes")
    return trimestre?.periodo || "Trimestre"
  }, [financialKPIs])

  const laborChartData = useMemo(() => {
    return laborCostData.map((d) => {
      const date = new Date(d.fecha)
      const day = date.getDate()
      const month = date.toLocaleDateString("es-ES", { month: "short" })
      return {
        ...d,
        fechaCorta: `${day} ${month}`,
      }
    })
  }, [laborCostData])

  const weekRevenueChartData = useMemo(() => {
    return weekRevenueData.map((d) => ({
      ...d,
      label: `${d.diaSemanaCorto} ${d.diaMes}`,
    }))
  }, [weekRevenueData])

  const weekRevenueTotals = useMemo(() => {
    const totalFacturado = weekRevenueData.reduce((sum, d) => sum + (d.facturadoReal || 0), 0)
    const totalPrevision = weekRevenueData.reduce((sum, d) => sum + (d.prevision || 0), 0)
    const previsionSemana = weekRevenueData.reduce((sum, d) => {
      if (d.tipoDia === "pasado") {
        return sum + (d.facturadoReal || 0)
      }
      // Hoy y futuro usan previsión
      return sum + (d.prevision || 0)
    }, 0)
    const porcentajeTotal = previsionSemana > 0 ? (totalFacturado / previsionSemana) * 100 : 0
    return { totalFacturado, totalPrevision, previsionSemana, porcentajeTotal }
  }, [weekRevenueData])

  const LaborCostTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0]?.payload
    if (!data) return null

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="text-sm font-bold text-[#364f6b] mb-2 border-b border-slate-100 pb-2">
          {new Date(data.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#17c3b2" }} />
              <span className="text-xs text-slate-500">Ventas netas</span>
            </div>
            <span className="text-xs font-bold text-[#364f6b]">{formatCurrency(data.ventas_netas)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#fe6d73" }} />
              <span className="text-xs text-slate-500">Coste laboral</span>
            </div>
            <span className="text-xs font-bold text-[#364f6b]">{formatCurrency(data.coste_laboral)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ffce85" }} />
              <span className="text-xs text-slate-500">% sobre ventas</span>
            </div>
            <span className="text-xs font-bold text-[#364f6b]">{data.porcentaje_laboral.toFixed(1)}%</span>
          </div>
          <div className="border-t border-slate-100 pt-1.5 mt-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Horas trabajadas</span>
              <span className="text-xs text-slate-600">{data.horas_trabajadas}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Trabajadores</span>
              <span className="text-xs text-slate-600">{data.trabajadores}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const WeekRevenueTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    const data = payload[0]?.payload
    if (!data) return null

    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl min-w-[200px]">
        <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">
          {label}
          {data.esHoy && <span className="ml-2 text-xs font-medium text-[#02b1c4]">(Hoy)</span>}
        </p>
        <div className="space-y-1.5">
          {data.tipoDia !== "futuro" && data.facturadoReal > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#17c3b2]" />
                <span className="text-slate-500">Facturado</span>
              </div>
              <span className="font-bold text-slate-700">
                {data.facturadoReal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#cbd5e1]" />
              <span className="text-slate-500">Previsión</span>
            </div>
            <span className="font-bold text-slate-700">
              {data.prevision.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </span>
          </div>
          {data.tipoDia !== "futuro" && data.porcentajeAlcanzado > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ffce85]" />
                <span className="text-slate-500">% Alcanzado</span>
              </div>
              <span className="font-bold text-slate-700">{data.porcentajeAlcanzado.toFixed(1)}%</span>
            </div>
          )}
          {data.tipoDia === "pasado" && data.margenErrorPct !== null && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">Margen error</span>
              <span className={`font-bold ${data.margenErrorPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {data.margenErrorPct >= 0 ? "+" : ""}
                {data.margenErrorPct.toFixed(1)}%
              </span>
            </div>
          )}
          {data.comensalesReservados > 0 && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">Comensales reservados</span>
              <span className="font-bold text-slate-700">{data.comensalesReservados}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={BarChart}
        title="Dashboard"
        subtitle="Panel de control general de NÜA"
        actions={
          <>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#02b1c4] hover:bg-[#029dad] disabled:opacity-50 rounded-full text-sm text-white font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Actualizando..." : "Actualizar"}</span>
            </button>

            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <div className="w-2 h-2 rounded-full bg-[#02b1c4]" />
              <span>{formatDateLong(new Date())}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm">
              <div className={`w-2 h-2 rounded-full ${dbConnected ? "bg-[#17c3b2] animate-pulse" : "bg-[#fe6d73]"}`} />
              <span className={`font-medium ${dbConnected ? "text-[#17c3b2]" : "text-[#fe6d73]"}`}>
                {dbConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Última actualización: {formatTime(lastUpdate)}</span>
            </div>
          </>
        }
      />

      <PageContent>
        {/* FILA 1: Weather + Reservas Semana */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WeatherCard />
          </div>
          <div className="lg:col-span-2">
            <WeekReservationsCard />
          </div>
        </div>

        <TremorCard>
          <div className="flex items-center justify-between mb-6">
            <TremorTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#02b1c4]" />
              Resumen Financiero
            </TremorTitle>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setFinancialPeriod("mes")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  financialPeriod === "mes"
                    ? "bg-white text-[#02b1c4] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setFinancialPeriod(trimestreLabel)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  financialPeriod !== "mes"
                    ? "bg-white text-[#02b1c4] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {trimestreLabel}
              </button>
            </div>
          </div>

          {currentKPIs ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Grafico de barras */}
              <div className="flex-1 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={[
                      { name: "Ingresos", value: currentKPIs.ingresos, color: "#17c3b2" },
                      { name: "Gastos", value: currentKPIs.gastos, color: "#fe6d73" },
                      {
                        name: "Margen",
                        value: currentKPIs.margen,
                        color: currentKPIs.margen >= 0 ? "#02b1c4" : "#fe6d73",
                      },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#364f6b", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), ""]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ fontWeight: 600, color: "#364f6b" }}
                    />
                    <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                      {[
                        { name: "Ingresos", value: currentKPIs.ingresos, color: "#17c3b2" },
                        { name: "Gastos", value: currentKPIs.gastos, color: "#fe6d73" },
                        {
                          name: "Margen",
                          value: currentKPIs.margen,
                          color: currentKPIs.margen >= 0 ? "#02b1c4" : "#fe6d73",
                        },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>

              {/* Panel lateral con metricas */}
              <div className="lg:w-48 flex flex-row lg:flex-col gap-3">
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 uppercase">Margen %</span>
                  <p
                    className={`text-xl font-bold mt-1 ${currentKPIs.margen >= 0 ? "text-[#17c3b2]" : "text-[#fe6d73]"}`}
                  >
                    {currentKPIs.margen_pct.toFixed(1)}%
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 uppercase">Ticket Medio</span>
                  <p className="text-xl font-bold text-[#364f6b] mt-1">{formatCurrency(currentKPIs.ticket_medio)}</p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 uppercase">Comensales</span>
                  <p className="text-xl font-bold text-[#364f6b] mt-1">
                    {currentKPIs.comensales.toLocaleString("es-ES")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sin datos financieros disponibles</p>
            </div>
          )}
        </TremorCard>

        <TremorCard>
          <div className="flex items-center justify-between mb-6">
            <TremorTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#02b1c4]" />
              Evolución Costes Laborales
            </TremorTitle>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setLaborCostDays(7)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  laborCostDays === 7 ? "bg-white text-[#02b1c4] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setLaborCostDays(15)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  laborCostDays === 15 ? "bg-white text-[#02b1c4] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                15 días
              </button>
              <button
                onClick={() => setLaborCostDays(30)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  laborCostDays === 30 ? "bg-white text-[#02b1c4] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                30 días
              </button>
            </div>
          </div>

          {laborChartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={laborChartData} margin={{ top: 20, right: 60, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="fechaCorta"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    domain={[0, 50]}
                  />
                  <Tooltip content={<LaborCostTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        ventas_netas: "Ventas netas",
                        coste_laboral: "Coste laboral",
                        porcentaje_laboral: "% Coste laboral",
                      }
                      return <span className="text-xs text-slate-600">{labels[value] || value}</span>
                    }}
                  />
                  <Bar yAxisId="left" dataKey="ventas_netas" fill="#17c3b2" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="coste_laboral" fill="#fe6d73" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="porcentaje_laboral"
                    stroke="#ffce85"
                    strokeWidth={2}
                    dot={{ fill: "#ffce85", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#ffce85" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sin datos de costes laborales disponibles</p>
            </div>
          )}
        </TremorCard>

        <TremorCard className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TremorTitle>Facturación Semanal</TremorTitle>
              <span className="text-xs bg-[#227c9d]/10 text-[#227c9d] px-2 py-1 rounded-full font-bold live-badge">
                Live
              </span>
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

              {/* Subtarjeta Previsión Semana */}
              <div className="bg-[#17c3b2]/10 px-3 py-1 rounded-lg text-center">
                <span className="text-[10px] text-[#17c3b2] font-bold block">Prev. Semana</span>
                <span className="text-lg font-bold text-[#17c3b2] leading-tight">
                  {Math.round(weekRevenueTotals.previsionSemana).toLocaleString("es-ES")} €
                </span>
              </div>

              {/* Subtarjeta Facturado */}
              <div className="bg-[#02b1c4]/10 px-3 py-1 rounded-lg text-center">
                <span className="text-[10px] text-[#02b1c4] font-bold block">Facturado</span>
                <span className="text-lg font-bold text-[#02b1c4] leading-tight">
                  {Math.round(weekRevenueTotals.totalFacturado).toLocaleString("es-ES")} €
                  <span className="text-xs font-normal ml-1">({weekRevenueTotals.porcentajeTotal.toFixed(0)}%)</span>
                </span>
              </div>
            </div>
          </div>
          {weekRevenueChartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weekRevenueChartData} margin={{ top: 20, right: 60, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    domain={[0, 150]}
                  />
                  <Tooltip content={<WeekRevenueTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        facturadoReal: "Facturado",
                        prevision: "Previsión",
                        porcentajeAlcanzado: "% Alcanzado",
                      }
                      return <span className="text-xs text-slate-600">{labels[value] || value}</span>
                    }}
                  />
                  <Bar yAxisId="left" dataKey="facturadoReal" fill="#17c3b2" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar yAxisId="left" dataKey="prevision" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={28} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="porcentajeAlcanzado"
                    stroke="#ffce85"
                    strokeWidth={2}
                    dot={{ fill: "#ffce85", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#ffce85" }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sin datos de facturación disponibles</p>
            </div>
          )}
        </TremorCard>

        {/* FILA 4: Facturación/Ticket/VeriFactu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricGroupCard
            title="Facturación Hoy"
            live={true}
            icon={<Banknote className="w-5 h-5 text-[#02b1c4]" />}
            loading={loading}
            decimals={2}
            suffix=" €"
            total={{ value: currentShift?.revenue || 0, previous: 0, delta: 0, trend: "neutral" }}
          >
            {liveData?.prevision?.prevision_facturacion > 0 && (
              <div className="mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">Previsión del día</span>
                  <span className="text-xs font-bold text-slate-600">
                    {formatCurrency(liveData.prevision.prevision_facturacion)}
                  </span>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(liveData.prevision.porcentaje_prevision_alcanzado, 100)}%`,
                      backgroundColor:
                        liveData.prevision.porcentaje_prevision_alcanzado >= 100
                          ? "#17c3b2"
                          : liveData.prevision.porcentaje_prevision_alcanzado >= 70
                            ? "#ffcb77"
                            : "#02b1c4",
                    }}
                  />
                  {/* Indicador si supera el 100% */}
                  {liveData.prevision.porcentaje_prevision_alcanzado > 100 && (
                    <div
                      className="absolute top-0 h-full bg-[#17c3b2]/30 rounded-r-full"
                      style={{
                        left: "100%",
                        width: `${Math.min(liveData.prevision.porcentaje_prevision_alcanzado - 100, 50)}%`,
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">
                    {liveData.prevision.comensales_reservados} comensales reservados
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color:
                        liveData.prevision.porcentaje_prevision_alcanzado >= 100
                          ? "#17c3b2"
                          : liveData.prevision.porcentaje_prevision_alcanzado >= 70
                            ? "#ffcb77"
                            : "#02b1c4",
                    }}
                  >
                    {liveData.prevision.porcentaje_prevision_alcanzado.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            {/* Fin barra de progreso */}

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
              <div className="p-3 rounded-lg bg-[#ffcb77]/20 border border-slate-100/50 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <SunIcon className="w-3.5 h-3.5 text-[#ffcb77]" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Comida</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{liveData?.lunch_percentage || 0}%</span>
                </div>
                <p className="text-lg font-bold text-[#364f6b] text-right">
                  {formatCurrency(liveData?.lunch?.revenue || 0)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#227c9d]/15 border border-slate-100/50 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MoonIcon className="w-3.5 h-3.5 text-[#227c9d]" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cena</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{liveData?.dinner_percentage || 0}%</span>
                </div>
                <p className="text-lg font-bold text-[#364f6b] text-right">
                  {formatCurrency(liveData?.dinner?.revenue || 0)}
                </p>
              </div>
            </div>
          </MetricGroupCard>

          <MetricGroupCard
            title="Ticket Medio Hoy"
            live={true}
            icon={<Receipt className="w-5 h-5 text-[#02b1c4]" />}
            loading={loading}
            decimals={2}
            suffix=" €"
            total={{ value: currentShift?.avg_ticket || 0, previous: 0, delta: 0, trend: "neutral" }}
          >
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
              <div className="p-3 rounded-lg bg-[#ffcb77]/20 border border-slate-100/50 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <SunIcon className="w-3.5 h-3.5 text-[#ffcb77]" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Comida</span>
                  </div>
                </div>
                <p className="text-lg font-bold text-[#364f6b] text-right">
                  {formatCurrency(liveData?.lunch?.avg_ticket || 0)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#227c9d]/15 border border-slate-100/50 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MoonIcon className="w-3.5 h-3.5 text-[#227c9d]" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cena</span>
                  </div>
                </div>
                <p className="text-lg font-bold text-[#364f6b] text-right">
                  {formatCurrency(liveData?.dinner?.avg_ticket || 0)}
                </p>
              </div>
            </div>
          </MetricGroupCard>

          <TremorCard className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <TremorTitle>VeriFactu</TremorTitle>
              <span className="text-xs bg-[#227c9d]/10 text-[#227c9d] px-2 py-1 rounded-full font-bold live-badge">
                Live
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#17c3b2]/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-[#17c3b2] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#364f6b]">{vfMetrics.success}</p>
                <p className="text-xs text-slate-500">Enviadas OK</p>
              </div>
              <div className="text-center p-4 bg-[#ffcb77]/10 rounded-lg">
                <Clock className="w-6 h-6 text-[#ffcb77] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#364f6b]">{vfMetrics.pending}</p>
                <p className="text-xs text-slate-500">Pendientes</p>
              </div>
              <div className="text-center p-4 bg-[#fe6d73]/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-[#fe6d73] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#364f6b]">{vfMetrics.error}</p>
                <p className="text-xs text-slate-500">Con Error</p>
              </div>
            </div>
          </TremorCard>
        </div>

        {/* FILA 5: Top Productos */}
        <TremorCard>
          <div className="flex items-center justify-between mb-4">
            <TremorTitle>Top Productos Hoy</TremorTitle>
            <span className="text-xs bg-[#227c9d]/10 text-[#227c9d] px-2 py-1 rounded-full font-bold live-badge">
              Live
            </span>
          </div>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Pos
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Unidades
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Facturado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 10).map((product: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        {index === 0 ? (
                          <span className="text-xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-600">
                            {index + 1}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-[#364f6b]">{product.nombre || product.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          {product.categoria || product.category || "Sin categoria"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-bold text-[#02b1c4]">
                          {product.cantidad || product.unidades || product.quantity || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-bold text-[#17c3b2]">
                          {formatCurrency(product.revenue || product.facturado || product.total || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="py-3 px-3 text-sm font-bold text-[#364f6b]">
                      Total Top 10
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold text-[#02b1c4]">
                      {topProducts
                        .slice(0, 10)
                        .reduce((acc: number, p: any) => acc + (p.quantity || p.cantidad || p.unidades || 0), 0)}{" "}
                      uds
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold text-[#17c3b2]">
                      {formatCurrency(
                        topProducts
                          .slice(0, 10)
                          .reduce((acc: number, p: any) => acc + (p.revenue || p.facturado || p.total || 0), 0),
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">Sin datos de productos</p>
          )}
        </TremorCard>
      </PageContent>
    </div>
  )
}

export default DashboardPage
