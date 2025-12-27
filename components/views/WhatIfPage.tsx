"use client"
import { useState, useEffect, useMemo } from "react"
import { Calculator, Users, Receipt, TrendingUp, TrendingDown, Calendar, Target, Zap } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Slider } from "@/components/ui/slider"
import { fetchWhatIfReferenceData } from "@/lib/whatIfService"
import type { WhatIfReferenceData } from "@/types"
import { BRAND_COLORS } from "@/constants"

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function WhatIfPage() {
  const [referenceData, setReferenceData] = useState<WhatIfReferenceData | null>(null)
  const [loading, setLoading] = useState(true)

  // Slider values
  const [customers, setCustomers] = useState(45)
  const [avgTicket, setAvgTicket] = useState(25)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await fetchWhatIfReferenceData()
        setReferenceData(data)
        setCustomers(Math.round(data.comensales_media))
        setAvgTicket(Math.round(data.ticket_medio_historico))
      } catch (error) {
        console.error("[v0] Error loading what-if data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculated values
  const calculations = useMemo(() => {
    if (!referenceData) return null

    const dailyRevenue = customers * avgTicket
    const avgDaily = referenceData.facturacion_media_dia
    const difference = dailyRevenue - avgDaily
    const percentDiff = avgDaily > 0 ? (difference / avgDaily) * 100 : 0
    const monthlyProjection = dailyRevenue * referenceData.dias_operativos_mes
    const occupancy = (customers / referenceData.capacidad_dia) * 100
    const percentVsBest =
      referenceData.mejor_dia_facturacion > 0 ? (dailyRevenue / referenceData.mejor_dia_facturacion) * 100 : 0

    return {
      dailyRevenue,
      difference,
      percentDiff,
      monthlyProjection,
      occupancy,
      percentVsBest,
    }
  }, [customers, avgTicket, referenceData])

  // Occupancy color based on percentage
  const getOccupancyColor = (occupancy: number): string => {
    if (occupancy < 50) return BRAND_COLORS.error
    if (occupancy < 80) return BRAND_COLORS.lunch
    return BRAND_COLORS.success
  }

  if (loading || !referenceData || !calculations) {
    return (
      <div className="relative min-h-screen bg-slate-50 pb-20">
        <PageHeader icon={Calculator} title="Simulador What-If" subtitle="Cargando datos de referencia..." />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-slate-400">Cargando...</div>
          </div>
        </PageContent>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={Calculator}
        title="Simulador What-If"
        subtitle="Explora escenarios de facturación ajustando comensales y ticket medio"
      />

      <PageContent>
        {/* Reference Data Banner - styled like capacity banner in ReservationsPage */}
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Media Diaria</div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                  <span className="text-lg font-bold text-[#364f6b]">
                    {formatCurrency(referenceData.facturacion_media_dia)}
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-slate-200" />

              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Ticket Medio</div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                  <span className="text-lg font-bold text-[#364f6b]">
                    {formatCurrency(referenceData.ticket_medio_historico)}
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-slate-200" />

              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Capacidad</div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                  <span className="text-lg font-bold text-[#364f6b]">{referenceData.capacidad_dia} pax/día</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 italic">
              Mejor día histórico: {formatCurrency(referenceData.mejor_dia_facturacion)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <TremorCard>
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
              <TremorTitle>Parámetros de Simulación</TremorTitle>
            </div>

            {/* Customers Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: BRAND_COLORS.accent }} />
                  <span className="font-medium text-slate-700">Comensales / día</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: BRAND_COLORS.primary }}>
                  {customers}
                </span>
              </div>
              <Slider
                value={[customers]}
                onValueChange={(value) => setCustomers(value[0])}
                min={10}
                max={260}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>10</span>
                <span className="text-slate-500 font-medium">Media: {referenceData.comensales_media}</span>
                <span>260</span>
              </div>
            </div>

            {/* Average Ticket Slider */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" style={{ color: BRAND_COLORS.lunch }} />
                  <span className="font-medium text-slate-700">Ticket medio</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: BRAND_COLORS.primary }}>
                  {formatCurrency(avgTicket)}
                </span>
              </div>
              <Slider
                value={[avgTicket]}
                onValueChange={(value) => setAvgTicket(value[0])}
                min={15}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>15€</span>
                <span className="text-slate-500 font-medium">
                  Media: {formatCurrency(referenceData.ticket_medio_historico)}
                </span>
                <span>50€</span>
              </div>
            </div>

            {/* Occupancy Bar */}
            <div className="mt-8 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-700">% Ocupación</span>
                <span className="text-lg font-bold" style={{ color: getOccupancyColor(calculations.occupancy) }}>
                  {calculations.occupancy.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(calculations.occupancy, 100)}%`,
                    backgroundColor: getOccupancyColor(calculations.occupancy),
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </TremorCard>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Daily Revenue - Main Result */}
            <TremorCard>
              <div className="text-center py-6">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                  Facturación día simulada
                </p>
                <p className="text-5xl font-bold text-[#364f6b]">{formatCurrency(calculations.dailyRevenue)}</p>

                <div
                  className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold uppercase tracking-wide"
                  style={{
                    borderColor: "#227c9d",
                    color: "#227c9d",
                    backgroundColor: "transparent",
                  }}
                >
                  {calculations.difference >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {calculations.difference >= 0 ? "+" : ""}
                    {formatCurrency(calculations.difference)} vs media
                  </span>
                  <span>
                    ({calculations.percentDiff >= 0 ? "+" : ""}
                    {calculations.percentDiff.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </TremorCard>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Monthly Projection */}
              <TremorCard>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}>
                    <Calendar className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Proyección mensual</p>
                    <p className="text-xl font-bold text-[#364f6b] mt-1">
                      {formatCurrency(calculations.monthlyProjection)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{referenceData.dias_operativos_mes} días operativos</p>
                  </div>
                </div>
              </TremorCard>

              {/* vs Best Day */}
              <TremorCard>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.lunch}20` }}>
                    <Target className="w-5 h-5" style={{ color: BRAND_COLORS.lunch }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">vs Mejor día</p>
                    <p className="text-xl font-bold text-[#364f6b] mt-1">{calculations.percentVsBest.toFixed(0)}%</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Récord: {formatCurrency(referenceData.mejor_dia_facturacion)}
                    </p>
                  </div>
                </div>
              </TremorCard>
            </div>

            {/* Quick Scenarios */}
            <TremorCard>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                <TremorTitle>Escenarios rápidos</TremorTitle>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setCustomers(Math.round(referenceData.comensales_media * 0.7))
                    setAvgTicket(Math.round(referenceData.ticket_medio_historico))
                  }}
                  className="p-4 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-center group"
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Día flojo</p>
                  <p className="text-lg font-bold text-[#364f6b] mt-1 group-hover:text-[#02b1c4]">-30% pax</p>
                </button>
                <button
                  onClick={() => {
                    setCustomers(Math.round(referenceData.comensales_media))
                    setAvgTicket(Math.round(referenceData.ticket_medio_historico))
                  }}
                  className="p-4 rounded-lg border-2 transition-all text-center"
                  style={{ borderColor: BRAND_COLORS.primary, backgroundColor: `${BRAND_COLORS.primary}10` }}
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Día normal</p>
                  <p className="text-lg font-bold mt-1" style={{ color: BRAND_COLORS.primary }}>
                    Media
                  </p>
                </button>
                <button
                  onClick={() => {
                    setCustomers(Math.round(referenceData.capacidad_dia * 0.85))
                    setAvgTicket(Math.round(referenceData.ticket_medio_historico * 1.15))
                  }}
                  className="p-4 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-center group"
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Día top</p>
                  <p className="text-lg font-bold text-[#364f6b] mt-1 group-hover:text-[#02b1c4]">85% + 15%</p>
                </button>
              </div>
            </TremorCard>
          </div>
        </div>
      </PageContent>
    </div>
  )
}
