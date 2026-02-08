"use client"

import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import {
  CalendarCheck,
  Users,
  PieChart,
  Grid3x3,
  RotateCw,
  UserCheck,
} from "lucide-react"
import { CHART_CONFIG, CARD_TOOLTIPS, BRAND_COLORS } from "@/constants"
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { formatNumber } from "@/lib/utils"
import type { DailyCompleteMetrics, ComparisonResult } from "@/types"

interface CapacityInfo {
  plazas_turno: number
  plazas_dia: number
  mesas_turno: number
  mesas_dia: number
}

interface ReservationsKPISectionProps {
  loading: boolean
  capacity: CapacityInfo
  historyData: DailyCompleteMetrics[]
  getMetricDelta: (
    getter: (m: DailyCompleteMetrics) => number,
    curr: DailyCompleteMetrics | null,
    prev: DailyCompleteMetrics | null,
  ) => ComparisonResult
  current: DailyCompleteMetrics | null
  previous: DailyCompleteMetrics | null
}

export function ReservationsKPISection({
  loading,
  capacity,
  historyData,
  getMetricDelta,
  current,
  previous,
}: ReservationsKPISectionProps) {
  return (
    <>
      {/* Barra de capacidad */}
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
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Por Dia</div>
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

          <div className="text-xs text-slate-400 italic">100% ocupacion = {capacity.plazas_dia} comensales/dia</div>
        </div>
      </div>

      {/* 6 MetricGroupCards */}
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
          title="Ocupacion"
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
          title="Rotacion de Mesas"
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

      {/* Grafico de 30 dias */}
      <TremorCard>
        <div className="flex items-center justify-between">
          <TremorTitle>Evolucion de Reservas y Ocupacion (Ultimos 30 dias)</TremorTitle>

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
              <span>Ocupacion</span>
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
                      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl min-w-[200px]">
                        <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                          {label}
                        </p>
                        {payload
                          .filter((entry: any) => entry.value !== null && entry.value !== undefined)
                          .map((entry: any, index: number) => {
                            const isOccupancy = entry.dataKey === "total.occupancy_rate"
                            const isReservations = entry.dataKey === "total.reservations"
                            const isPax = entry.dataKey === "total.pax"

                            let unit = ""
                            if (isOccupancy) unit = "%"
                            else if (isReservations) unit = " reservas"
                            else if (isPax) unit = " comensales"

                            const formattedValue = isOccupancy
                              ? entry.value?.toFixed(1)
                              : entry.value != null ? formatNumber(entry.value) : "-"

                            return (
                              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 font-medium">{entry.name}:</span>
                                <span className="font-bold text-slate-700">
                                  {formattedValue}
                                  {unit}
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
                  name="Ocupacion"
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
    </>
  )
}
