"use client"

import type React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { WeatherCard } from "../components/features/WeatherCard"
import { WeekReservationsCard } from "../components/features/WeekReservationsCard"
import { MetricGroupCard } from "../components/ui/MetricGroupCard"
import { TremorCard, TremorTitle } from "../components/ui/TremorCard"
import { fetchRealTimeData, fetchFinancialHistory, fetchOperationsRealTime } from "../lib/dataService"
import type { OperacionesData } from "../types"
import {
  Banknote,
  Receipt,
  Trophy,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart,
  SunIcon,
  MoonIcon,
  RefreshCw,
  ChefHat,
  Timer,
  Users,
  CircleDot,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react"
import { PageHeader } from "../components/layout/PageHeader"
import { PageContent } from "../components/layout/PageContent"
import { formatCurrency, formatTime, formatDateLong } from "../lib/utils"
import { BRAND_COLORS } from "../constants"

type FinancialPeriod = "week" | "month" | "quarter" | "year"

const DashboardPage: React.FC = () => {
  const [liveData, setLiveData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [dbConnected, setDbConnected] = useState(true)

  const [operationsData, setOperationsData] = useState<OperacionesData | null>(null)

  const [financialPeriod, setFinancialPeriod] = useState<FinancialPeriod>("week")
  const [financialData, setFinancialData] = useState<{ date: string; income: number; expenses: number }[]>([])

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const [data, opsData] = await Promise.all([fetchRealTimeData(), fetchOperationsRealTime()])
      setLiveData(data)
      setOperationsData(opsData)
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

  useEffect(() => {
    const loadFin = async () => {
      const data = await fetchFinancialHistory(financialPeriod)
      setFinancialData(data)
    }
    loadFin()
  }, [financialPeriod])

  const currentShift = liveData?.total

  const paymentData = useMemo(() => {
    if (!currentShift) return []
    return [
      { name: "Tarjeta", value: currentShift.payment_methods?.card || 0, color: BRAND_COLORS.success },
      { name: "Efectivo", value: currentShift.payment_methods?.cash || 0, color: BRAND_COLORS.accent },
      { name: "Apps", value: currentShift.payment_methods?.digital || 0, color: BRAND_COLORS.lunch },
    ]
  }, [currentShift])

  const topProducts = currentShift?.sales_data.top_products || []
  const topCategories = currentShift?.sales_data.categories.slice(0, 3) || []

  const vfMetrics = currentShift?.verifactu_metrics || { success: 0, error: 0, pending: 0 }

  const itemsEnCola = useMemo(() => {
    if (!operationsData?.resumen) return { total: 0, bebida: 0, comida: 0, postre: 0 }
    const r = operationsData.resumen
    return {
      total: r.items_sin_confirmar + r.items_en_preparacion + r.items_listos_servir,
      bebida: r.items_bebida || 0,
      comida: r.items_comida || 0,
      postre: r.items_postre || 0,
    }
  }, [operationsData])

  const mesasUrgentes = useMemo(() => {
    if (!operationsData?.mesas) return []
    return [...operationsData.mesas]
      .filter((m) => m.sin_confirmar > 0 || m.en_preparacion > 0 || m.listos > 0)
      .sort((a, b) => {
        if ((b.items_criticos || 0) !== (a.items_criticos || 0)) {
          return (b.items_criticos || 0) - (a.items_criticos || 0)
        }
        return (b.max_espera_min || 0) - (a.max_espera_min || 0)
      })
      .slice(0, 6)
  }, [operationsData])

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
              <ChefHat className="w-5 h-5 text-[#02b1c4]" />
              Operaciones en Vivo
            </TremorTitle>
            <div className="flex items-center gap-2">
              {operationsData?.resumen.turno_actual && (
                <span className="flex items-center gap-1.5 text-xs bg-[#02b1c4]/10 text-[#02b1c4] px-2 py-1 rounded-full font-medium">
                  {operationsData.resumen.turno_actual === "comida" ? (
                    <Sun className="w-3.5 h-3.5" />
                  ) : (
                    <Moon className="w-3.5 h-3.5" />
                  )}
                  {operationsData.resumen.turno_actual === "comida" ? "Comida" : "Cena"}
                </span>
              )}
              <span className="text-xs bg-[#227c9d]/10 text-[#227c9d] px-2 py-1 rounded-full font-bold live-badge">
                Live
              </span>
            </div>
          </div>

          {operationsData ? (
            <>
              {(operationsData.resumen.items_criticos || 0) > 0 && (
                <div className="mb-4 p-3 bg-[#fe6d73]/10 border border-[#fe6d73]/30 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#fe6d73] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#fe6d73]">
                      {operationsData.resumen.items_criticos} items criticos
                    </p>
                    <p className="text-xs text-slate-500">Tiempo de espera superior a 15 minutos</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#02b1c4]" />
                    <span className="text-xs font-medium text-slate-500 uppercase">Mesas Activas</span>
                  </div>
                  <p className="text-3xl font-bold text-[#364f6b]">{operationsData.resumen.mesas_activas}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CircleDot className="w-4 h-4 text-[#ffcb77]" />
                    <span className="text-xs font-medium text-slate-500 uppercase">Items en Cola</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-[#364f6b]">{itemsEnCola.total}</p>
                    {itemsEnCola.total > 10 && (
                      <span className="text-xs bg-[#fe6d73]/20 text-[#fe6d73] px-2 py-0.5 rounded-full font-medium mb-1">
                        Alta carga
                      </span>
                    )}
                  </div>
                  {itemsEnCola.total > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Beb: {itemsEnCola.bebida} | Com: {itemsEnCola.comida} | Pos: {itemsEnCola.postre}
                    </p>
                  )}
                </div>

                <div
                  className={`rounded-xl p-4 border ${
                    (operationsData.resumen.tiempo_max_espera || 0) > 15
                      ? "bg-[#fe6d73]/10 border-[#fe6d73]/30"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Timer
                      className={`w-4 h-4 ${
                        (operationsData.resumen.tiempo_max_espera || 0) > 15 ? "text-[#fe6d73]" : "text-[#02b1c4]"
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-500 uppercase">Max Espera</span>
                  </div>
                  <p
                    className={`text-3xl font-bold ${
                      (operationsData.resumen.tiempo_max_espera || 0) > 15 ? "text-[#fe6d73]" : "text-[#364f6b]"
                    }`}
                  >
                    {operationsData.resumen.tiempo_max_espera ?? 0}
                    <span className="text-lg font-medium text-slate-400 ml-1">min</span>
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-4 h-4 text-[#17c3b2]" />
                    <span className="text-xs font-medium text-slate-500 uppercase">Importe en Curso</span>
                  </div>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {formatCurrency(
                      operationsData.resumen.importe_total_pedido - operationsData.resumen.importe_entregado,
                    )}
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-[#17c3b2] h-full rounded-full transition-all"
                      style={{
                        width: `${
                          operationsData.resumen.importe_total_pedido > 0
                            ? (operationsData.resumen.importe_entregado / operationsData.resumen.importe_total_pedido) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatCurrency(operationsData.resumen.importe_entregado)} servido
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 bg-[#227c9d]/15 rounded-lg border border-[#227c9d]/30">
                  <div className="w-3 h-3 rounded-full bg-[#227c9d] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#364f6b]">{operationsData.resumen.items_sin_confirmar}</p>
                  <p className="text-xs text-slate-500 font-medium">Confirmados</p>
                </div>
                <div className="text-center p-3 bg-[#ffcb77]/20 rounded-lg border border-[#ffcb77]/30">
                  <div className="w-3 h-3 rounded-full bg-[#ffcb77] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#364f6b]">{operationsData.resumen.items_en_preparacion}</p>
                  <p className="text-xs text-slate-500 font-medium">En preparación</p>
                </div>
                <div className="text-center p-3 bg-[#17c3b2]/15 rounded-lg border border-[#17c3b2]/30">
                  <div className="w-3 h-3 rounded-full bg-[#17c3b2] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#364f6b]">{operationsData.resumen.items_listos_servir}</p>
                  <p className="text-xs text-slate-500 font-medium">Listos servir</p>
                </div>
                <div className="text-center p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <CheckCircle className="w-3 h-3 text-slate-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#364f6b]">{operationsData.resumen.items_entregados}</p>
                  <p className="text-xs text-slate-500 font-medium">Entregados</p>
                </div>
              </div>

              {mesasUrgentes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Mesas con pedidos pendientes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {mesasUrgentes.map((mesa) => (
                      <div
                        key={mesa.mesa}
                        className={`p-3 rounded-lg border ${
                          (mesa.items_criticos || 0) > 0
                            ? "bg-[#fe6d73]/10 border-[#fe6d73]/50"
                            : (mesa.max_espera_min || 0) > 10
                              ? "bg-[#ffcb77]/10 border-[#ffcb77]/30"
                              : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-[#364f6b]">{mesa.mesa}</span>
                          <div className="flex items-center gap-1">
                            {(mesa.items_criticos || 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] bg-[#fe6d73] text-white px-1.5 py-0.5 rounded font-bold">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {mesa.items_criticos}
                              </span>
                            )}
                            {mesa.max_espera_min && mesa.max_espera_min > 0 && (
                              <span
                                className={`text-xs font-medium ${
                                  (mesa.items_criticos || 0) > 0
                                    ? "text-[#fe6d73]"
                                    : mesa.max_espera_min > 10
                                      ? "text-[#ffcb77]"
                                      : "text-slate-400"
                                }`}
                              >
                                {mesa.max_espera_min}m
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {mesa.sin_confirmar > 0 && (
                            <span className="text-xs bg-[#227c9d]/20 text-[#227c9d] px-1.5 py-0.5 rounded font-medium">
                              {mesa.sin_confirmar}
                            </span>
                          )}
                          {mesa.en_preparacion > 0 && (
                            <span className="text-xs bg-[#ffcb77]/30 text-[#b8860b] px-1.5 py-0.5 rounded font-medium">
                              {mesa.en_preparacion}
                            </span>
                          )}
                          {mesa.listos > 0 && (
                            <span className="text-xs bg-[#17c3b2]/20 text-[#17c3b2] px-1.5 py-0.5 rounded font-medium">
                              {mesa.listos}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mesasUrgentes.length === 0 && itemsEnCola.total === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Sin pedidos pendientes en cocina</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sin actividad de operaciones</p>
            </div>
          )}
        </TremorCard>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricGroupCard
            title="Facturación"
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
                  {formatCurrency(liveData?.lunch.revenue || 0)}
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
                  {formatCurrency(liveData?.dinner.revenue || 0)}
                </p>
              </div>
            </div>
          </MetricGroupCard>

          <MetricGroupCard
            title="Ticket Medio"
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
                  {formatCurrency(liveData?.lunch.avg_ticket || 0)}
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
                  {formatCurrency(liveData?.dinner.avg_ticket || 0)}
                </p>
              </div>
            </div>
          </MetricGroupCard>

          <TremorCard>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#ffcb77]" />
              <TremorTitle>Top Productos Hoy</TremorTitle>
            </div>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-[#ffcb77] text-white"
                            : index === 1
                              ? "bg-slate-300 text-white"
                              : index === 2
                                ? "bg-[#cd7f32] text-white"
                                : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-700 font-medium">{product.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#364f6b]">{product.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">Sin ventas registradas</p>
            )}
          </TremorCard>
        </div>

        <TremorCard>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-[#17c3b2]" />
            <TremorTitle>VeriFactu</TremorTitle>
            <span className="text-xs bg-[#02b1c4]/10 text-[#02b1c4] px-2 py-1 rounded-full font-bold">Live</span>
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
      </PageContent>
    </div>
  )
}

export default DashboardPage
