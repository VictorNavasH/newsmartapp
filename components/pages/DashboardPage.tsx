"use client"

import type React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { WeatherCard } from "@/components/features/WeatherCard"
import { WeekReservationsCard } from "@/components/features/WeekReservationsCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { fetchRealTimeData, fetchFinancialKPIs, fetchOcupacionSemanal } from "@/lib/dataService"
import type { FinancialKPIs, OcupacionDia } from "@/types"
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
  CalendarDays,
  Sun,
  Moon,
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
} from "recharts"

const DashboardPage: React.FC = () => {
  const [liveData, setLiveData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [dbConnected, setDbConnected] = useState(true)

  const [financialKPIs, setFinancialKPIs] = useState<FinancialKPIs[]>([])
  const [financialPeriod, setFinancialPeriod] = useState<string>("mes")
  const [ocupacionSemanal, setOcupacionSemanal] = useState<OcupacionDia[]>([])

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const [data, kpis, ocupacion] = await Promise.all([
        fetchRealTimeData(),
        fetchFinancialKPIs(),
        fetchOcupacionSemanal(),
      ])
      setLiveData(data)
      setFinancialKPIs(kpis)
      setOcupacionSemanal(ocupacion)
      setDbConnected(true)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setDbConnected(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const currentKPIs = useMemo(() => {
    return financialKPIs.find((k) => k.periodo === financialPeriod) || null
  }, [financialKPIs, financialPeriod])

  const calculateVariation = (current: number, previous: number): number => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const currentShift = liveData?.total
  const topProducts = currentShift?.sales_data?.top_products || []
  const vfMetrics = currentShift?.verifactu_metrics || { success: 0, error: 0, pending: 0 }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "pico":
        return "bg-[#fe6d73] text-white"
      case "fuerte":
        return "bg-[#ffcb77] text-[#364f6b]"
      case "normal":
        return "bg-[#17c3b2] text-white"
      default:
        return "bg-slate-200 text-slate-600"
    }
  }

  const trimestreLabel = useMemo(() => {
    const trimestre = financialKPIs.find((k) => k.periodo !== "mes")
    return trimestre?.periodo || "Trimestre"
  }, [financialKPIs])

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
              <CalendarDays className="w-5 h-5 text-[#02b1c4]" />
              Ocupación Próximos 7 Días
            </TremorTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-200" />
                <span className="text-slate-500">Tranquilo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#17c3b2]" />
                <span className="text-slate-500">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#ffcb77]" />
                <span className="text-slate-500">Fuerte</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#fe6d73]" />
                <span className="text-slate-500">Pico</span>
              </div>
            </div>
          </div>

          {ocupacionSemanal.length > 0 ? (
            <div className="grid grid-cols-7 gap-3">
              {ocupacionSemanal.map((dia) => (
                <div
                  key={dia.fecha}
                  className={`rounded-xl p-4 text-center transition-all ${
                    dia.es_hoy ? "ring-2 ring-[#02b1c4] ring-offset-2" : ""
                  } ${getNivelColor(dia.nivel_ocupacion)}`}
                >
                  <p className="text-xs font-bold uppercase mb-1">{dia.dia_semana}</p>
                  <p className="text-lg font-bold mb-2">{new Date(dia.fecha).getDate()}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-xs opacity-80">
                      <Sun className="w-3 h-3" />
                      <span>{dia.comensales_comida}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs opacity-80">
                      <Moon className="w-3 h-3" />
                      <span>{dia.comensales_cena}</span>
                    </div>
                  </div>
                  <p className="text-xl font-bold mt-2">{dia.ocupacion_total_pct}%</p>
                  {dia.es_hoy && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase bg-white/30 px-2 py-0.5 rounded">
                      Hoy
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sin datos de ocupación disponibles</p>
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
