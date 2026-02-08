"use client"

import { Landmark, Calendar, Percent, CreditCard } from "lucide-react"
import { TremorCard } from "@/components/ui/TremorCard"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency } from "@/lib/utils"
import type {
  PoolBancarioResumen,
  PoolBancarioPrestamo,
  PoolBancarioVencimiento,
  PoolBancarioPorBanco,
  PoolBancarioCalendarioMes,
} from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartTooltip } from "@/components/charts/ChartTooltip"
import { getBankColor } from "./constants"

interface TreasuryPoolBancarioTabProps {
  poolResumen: PoolBancarioResumen | null
  poolPrestamos: PoolBancarioPrestamo[]
  poolVencimientos: PoolBancarioVencimiento[]
  poolPorBanco: PoolBancarioPorBanco[]
  poolCalendario: PoolBancarioCalendarioMes[]
  loading: boolean
}

export function TreasuryPoolBancarioTab({
  poolResumen,
  poolPrestamos,
  poolVencimientos,
  poolPorBanco,
  poolCalendario,
  loading,
}: TreasuryPoolBancarioTabProps) {
  if (loading) {
    return <p className="text-slate-400 text-center py-8">Cargando pool bancario...</p>
  }

  if (!poolResumen) {
    return <p className="text-slate-400 text-center py-8">No hay datos de prestamos</p>
  }

  return (
    <div className="space-y-6">
      {/* KPIs del Pool */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TremorCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Landmark className="h-5 w-5 text-[#02b1c4]" />
            <span className="text-sm text-slate-500">Saldo Pendiente</span>
          </div>
          <p className="text-2xl font-bold text-[#364f6b]">
            {formatCurrency(poolResumen.saldo_pendiente_total || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {poolResumen.total_prestamos_activos || 0} prestamos activos
          </p>
        </TremorCard>

        <TremorCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-[#02b1c4]" />
            <span className="text-sm text-slate-500">Cuota Mensual</span>
          </div>
          <p className="text-2xl font-bold text-[#364f6b]">
            {formatCurrency(poolResumen.cuota_mensual_total || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Proximos pagos</p>
        </TremorCard>

        <TremorCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="h-5 w-5 text-[#02b1c4]" />
            <span className="text-sm text-slate-500">Amortizado</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[#17c3b2]">
              {(poolResumen.porcentaje_amortizado || 0).toFixed(1)}%
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full bg-[#17c3b2]"
              style={{ width: `${poolResumen.porcentaje_amortizado || 0}%` }}
            />
          </div>
        </TremorCard>

        <TremorCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-5 w-5 text-[#02b1c4]" />
            <span className="text-sm text-slate-500">Total Amortizado</span>
          </div>
          <p className="text-2xl font-bold text-[#364f6b]">
            {formatCurrency(poolResumen.capital_total_amortizado || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Capital devuelto</p>
        </TremorCard>
      </div>

      {/* Proximos Vencimientos + Distribucion por Banco */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proximos Vencimientos */}
        <TremorCard className="lg:col-span-2 p-4">
          <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Proximos Vencimientos (30 dias)</h3>
          <div className="space-y-3">
            {poolVencimientos.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No hay vencimientos proximos</p>
            ) : (
              poolVencimientos.slice(0, 6).map((v, idx) => (
                <div
                  key={`${v.nombre_prestamo}-${v.fecha_vencimiento}-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    v.estado_vencimiento === "vencido"
                      ? "bg-red-50 border border-red-200"
                      : v.estado_vencimiento === "hoy"
                        ? "bg-orange-50 border border-orange-200"
                        : v.estado_vencimiento === "proximo"
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {v.banco_logo ? (
                      <img
                        src={v.banco_logo || "/placeholder.svg"}
                        alt={v.banco}
                        className="h-8 w-8 object-contain rounded"
                      />
                    ) : (
                      <Landmark className="h-8 w-8 text-slate-400" />
                    )}
                    <div>
                      <p className="font-medium text-[#364f6b]">{v.nombre_prestamo}</p>
                      <p className="text-sm text-slate-500">{v.banco}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#364f6b]">{formatCurrency(v.importe_cuota)}</p>
                    <p
                      className={`text-xs ${
                        v.estado_vencimiento === "vencido"
                          ? "text-[#fe6d73] font-medium"
                          : v.estado_vencimiento === "hoy"
                            ? "text-orange-600 font-medium"
                            : "text-slate-400"
                      }`}
                    >
                      {v.estado_vencimiento === "vencido"
                        ? `Vencido (${Math.abs(v.dias_hasta_vencimiento)} dias)`
                        : v.estado_vencimiento === "hoy"
                          ? "Hoy"
                          : format(new Date(v.fecha_vencimiento), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TremorCard>

        {/* Distribucion por Banco */}
        <TremorCard className="p-4">
          <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Por Banco</h3>
          {poolPorBanco.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Sin datos</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={poolPorBanco}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="saldo_pendiente"
                    nameKey="banco"
                  >
                    {poolPorBanco.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBankColor(entry.banco, index)} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const data = payload[0].payload as PoolBancarioPorBanco
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                            {data.banco}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getBankColor(data.banco) }}
                              />
                              <span className="text-slate-500 font-medium w-24">Saldo pendiente:</span>
                              <span className="font-bold text-slate-700">
                                {formatCurrency(data.saldo_pendiente)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getBankColor(data.banco) }}
                              />
                              <span className="text-slate-500 font-medium w-24">Cuota mensual:</span>
                              <span className="font-bold text-slate-700">
                                {formatCurrency(data.cuota_mensual)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getBankColor(data.banco) }}
                              />
                              <span className="text-slate-500 font-medium w-24">% del total:</span>
                              <span className="font-bold text-slate-700">
                                {(data.porcentaje_del_total || 0).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {poolPorBanco.map((banco, idx) => (
              <div key={banco.banco} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {banco.banco_logo ? (
                    <img
                      src={banco.banco_logo || "/placeholder.svg"}
                      alt={banco.banco}
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getBankColor(banco.banco, idx) }}
                    />
                  )}
                  <span className="text-slate-600">{banco.banco}</span>
                </div>
                <span className="font-medium text-[#364f6b]">
                  {(banco.porcentaje_del_total || 0).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </TremorCard>
      </div>

      {/* Evolucion Mensual */}
      <TremorCard className="p-4">
        <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Evolucion Cuotas Mensuales</h3>
        {poolCalendario.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Sin datos de calendario</p>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={poolCalendario} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as PoolBancarioCalendarioMes
                        return (
                          <ChartTooltip
                            title={data.mes}
                            items={[
                              {
                                label: "Capital",
                                value: formatCurrency(data.total_capital || 0),
                                color: "#fe6d73",
                              },
                              {
                                label: "Intereses",
                                value: formatCurrency(data.total_intereses || 0),
                                color: "#ffcb77",
                              },
                              { label: "Total", value: formatCurrency(data.total_cuota || 0) },
                            ]}
                          />
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="total_capital"
                    stackId="a"
                    fill="#fe6d73"
                    radius={[0, 0, 0, 0]}
                    name="Capital"
                  />
                  <Bar
                    dataKey="total_intereses"
                    stackId="a"
                    fill="#ffcb77"
                    radius={[4, 4, 0, 0]}
                    name="Intereses"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.error }} />
                <span className="text-sm text-slate-600">Capital</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.warning }} />
                <span className="text-sm text-slate-600">Intereses</span>
              </div>
            </div>
          </>
        )}
      </TremorCard>

      {/* Cards de Prestamos */}
      <div>
        <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Detalle de Prestamos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {poolPrestamos.map((prestamo) => (
            <TremorCard key={prestamo.prestamo_id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {prestamo.banco_logo ? (
                    <img
                      src={prestamo.banco_logo || "/placeholder.svg"}
                      alt={prestamo.banco}
                      className="h-10 w-10 object-contain rounded"
                    />
                  ) : (
                    <Landmark className="h-10 w-10 text-slate-400" />
                  )}
                  <div>
                    <p className="font-semibold text-[#364f6b]">{prestamo.nombre_prestamo}</p>
                    <p className="text-sm text-slate-500">{prestamo.banco}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    prestamo.estado === "activo"
                      ? "bg-[#17c3b2]/10 text-[#17c3b2]"
                      : prestamo.estado === "liquidado"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-[#fe6d73]/10 text-[#fe6d73]"
                  }`}
                >
                  {prestamo.estado}
                </span>
              </div>

              {/* Barra de progreso amortizacion */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Amortizado</span>
                  <span>{Number(prestamo.porcentaje_amortizado || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#17c3b2]"
                    style={{
                      width: `${prestamo.porcentaje_amortizado || 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Importe pendiente</p>
                  <p className="font-semibold text-[#364f6b]">
                    {formatCurrency(prestamo.saldo_pendiente || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Cuota mensual</p>
                  <p className="font-semibold text-[#364f6b]">{formatCurrency(prestamo.cuota_mensual || 0)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tipo interes</p>
                  <p className="font-medium text-[#364f6b]">{Number(prestamo.tasa_interes || 0).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-slate-500">Cuotas pendientes</p>
                  <p className="font-medium text-[#364f6b]">{prestamo.cuotas_pendientes || 0}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">Capital concedido</p>
                  <p className="font-medium text-[#364f6b]">{formatCurrency(prestamo.capital_inicial || 0)}</p>
                </div>
              </div>

              {prestamo.proxima_cuota_fecha && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Proxima cuota</span>
                  <span className="text-sm font-medium text-[#364f6b]">
                    {format(new Date(prestamo.proxima_cuota_fecha), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </TremorCard>
          ))}
        </div>
      </div>
    </div>
  )
}
