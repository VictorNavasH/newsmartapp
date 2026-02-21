"use client"

import {
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  AlertCircle,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Button } from "@/components/ui/button"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils"
import type {
  TreasuryKPIs,
  TreasuryAccount,
  TreasuryCategoryBreakdown,
  TreasuryMonthlySummary,
  BankConsentInfo,
  SyncStatus,
} from "@/types"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  RefreshCw,
  Plus,
  Calendar,
  Clock,
  Zap,
  Shield,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { formatIBAN } from "./constants"

interface TreasuryDashboardTabProps {
  kpis: TreasuryKPIs | null
  accounts: TreasuryAccount[]
  loading: boolean
  ingresosDelta: number
  gastosDelta: number
  balanceEvolutionData: { date: string; saldo: number }[]
  monthlyData: { month: string; monthLabel: string; ingresos: number; gastos: number }[]
  topCategoriesWithPercentage: { name: string; value: number; percentage: number }[]
  uncategorizedData: { totalGastos: number; totalIngresos: number; numTransacciones: number }
  onViewUncategorized: () => void
  // GoCardless Props
  consentInfo: BankConsentInfo | null
  syncStatus: SyncStatus | null
  syncingAccountId: string | null
  onSyncAccount: (id: string) => void
  onConnectBank: () => void
  onRenewConsent: (id: string) => void
  goCardlessAppUrl: string | null
}

export function TreasuryDashboardTab({
  kpis,
  accounts,
  loading,
  ingresosDelta,
  gastosDelta,
  balanceEvolutionData,
  monthlyData,
  topCategoriesWithPercentage,
  uncategorizedData,
  onViewUncategorized,
  consentInfo,
  syncStatus,
  syncingAccountId,
  onSyncAccount,
  onConnectBank,
  onRenewConsent,
  goCardlessAppUrl,
}: TreasuryDashboardTabProps) {
  // Rate limit helpers
  const minRemaining = syncStatus
    ? Math.min(syncStatus.rateLimits.transactions.remaining, syncStatus.rateLimits.balances.remaining)
    : null
  const canSync = minRemaining === null || minRemaining > 0
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Saldo Total</p>
              <p className="text-2xl font-bold text-[#364f6b]">
                {loading ? "..." : formatCurrency(kpis?.saldo_total || 0)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-400">
                  {accounts?.length || 0} cuenta{(accounts?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
              <Landmark className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
            </div>
          </div>
        </TremorCard>

        {/* Ingresos */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Ingresos</p>
              <p className="text-2xl font-bold text-[#364f6b]">
                {loading ? "..." : formatCurrency(kpis?.ingresos_periodo || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {ingresosDelta >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" style={{ color: BRAND_COLORS.success }} />
                ) : (
                  <ArrowDownRight className="h-3 w-3" style={{ color: BRAND_COLORS.error }} />
                )}
                <span className="text-xs" style={{ color: ingresosDelta >= 0 ? BRAND_COLORS.success : BRAND_COLORS.error }}>
                  {ingresosDelta >= 0 ? "+" : ""}
                  {ingresosDelta.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">vs periodo anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.success}15` }}>
              <TrendingUp className="h-5 w-5" style={{ color: BRAND_COLORS.success }} />
            </div>
          </div>
        </TremorCard>

        {/* Gastos */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Gastos</p>
              <p className="text-2xl font-bold text-[#364f6b]">
                {loading ? "..." : formatCurrency(kpis?.gastos_periodo || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {gastosDelta <= 0 ? (
                  <ArrowDownRight className="h-3 w-3" style={{ color: BRAND_COLORS.success }} />
                ) : (
                  <ArrowUpRight className="h-3 w-3" style={{ color: BRAND_COLORS.error }} />
                )}
                <span className="text-xs" style={{ color: gastosDelta <= 0 ? BRAND_COLORS.success : BRAND_COLORS.error }}>
                  {gastosDelta >= 0 ? "+" : ""}
                  {gastosDelta.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">vs periodo anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.error}15` }}>
              <TrendingDown className="h-5 w-5" style={{ color: BRAND_COLORS.error }} />
            </div>
          </div>
        </TremorCard>

        {/* Balance */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Balance Periodo</p>
              <p className="text-2xl font-bold text-[#364f6b]">
                {loading ? "..." : formatCurrency((kpis?.ingresos_periodo ?? 0) - (kpis?.gastos_periodo ?? 0))}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-slate-400">vs periodo anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
              <TrendingUp className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
            </div>
          </div>
        </TremorCard>
      </div>

      {/* Cuentas Bancarias */}
      <TremorCard
        title="Cuentas Bancarias"
        icon={<Building2 className="h-5 w-5" />}
        actions={
          goCardlessAppUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-[#17c3b2] text-[#17c3b2] hover:bg-[#17c3b2]/10"
              onClick={onConnectBank}
            >
              <Plus className="h-3.5 w-3.5" />
              Conectar banco
            </Button>
          )
        }
      >
        {/* Panel de estado de sincronización */}
        {goCardlessAppUrl && accounts.length > 0 && (
          <div className="mb-4 mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Info izquierda */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {/* Última sincronización */}
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {syncStatus?.lastSyncAt
                      ? `Última sync: ${format(new Date(syncStatus.lastSyncAt), "dd MMM HH:mm", { locale: es })}`
                      : "Sin sincronizar"}
                  </span>
                </div>

                {/* Requests restantes */}
                {syncStatus && (
                  <div className="flex items-center gap-1.5">
                    <Zap className={`h-3.5 w-3.5 ${
                      minRemaining === 0 ? "text-red-500" :
                      minRemaining !== null && minRemaining <= 2 ? "text-amber-500" : "text-emerald-500"
                    }`} />
                    <span className={`font-medium ${
                      minRemaining === 0 ? "text-red-600" :
                      minRemaining !== null && minRemaining <= 2 ? "text-amber-600" : "text-slate-600"
                    }`}>
                      {minRemaining}/{syncStatus.rateLimits.transactions.limit} requests
                    </span>
                  </div>
                )}

                {/* Consentimiento */}
                {syncStatus?.consentDaysRemaining !== null && syncStatus?.consentDaysRemaining !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Shield className={`h-3.5 w-3.5 ${
                      syncStatus.consentDaysRemaining <= 7 ? "text-red-500" :
                      syncStatus.consentDaysRemaining <= 15 ? "text-amber-500" : "text-slate-400"
                    }`} />
                    <span className={`${
                      syncStatus.consentDaysRemaining <= 7 ? "text-red-600 font-medium" :
                      syncStatus.consentDaysRemaining <= 15 ? "text-amber-600" : "text-slate-500"
                    }`}>
                      {syncStatus.consentDaysRemaining}d consentimiento
                    </span>
                    {syncStatus.consentDaysRemaining <= 7 && syncStatus.consentInstitutionId && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-red-600 hover:text-red-700"
                        onClick={() => onRenewConsent(syncStatus.consentInstitutionId!)}
                      >
                        Renovar
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Botón sincronizar */}
              <Button
                size="sm"
                className="h-8 px-4 text-xs font-medium gap-1.5 bg-[#17c3b2] hover:bg-[#14a89a] text-white shrink-0"
                onClick={() => onSyncAccount("all")}
                disabled={!!syncingAccountId || !canSync}
                title={!canSync ? "Límite diario alcanzado. Se reinicia a las 00:00" : "Sincronizar todas las cuentas"}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncingAccountId === "all" ? "animate-spin" : ""}`} />
                {syncingAccountId === "all" ? "Sincronizando..." : "Sincronizar todo"}
              </Button>
            </div>

            {/* Aviso de rate limit */}
            {syncStatus && minRemaining !== null && minRemaining <= 2 && minRemaining > 0 && (
              <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Has usado {syncStatus.rateLimits.transactions.limit - minRemaining} de {syncStatus.rateLimits.transactions.limit} sincronizaciones diarias (plan gratuito)
              </p>
            )}
            {syncStatus && minRemaining === 0 && (
              <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Límite diario alcanzado. Las sincronizaciones se reinician a las 00:00
              </p>
            )}
          </div>
        )}

        {/* Grid de cuentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {loading ? (
            <p className="text-slate-400 col-span-full text-center py-8">Cargando cuentas...</p>
          ) : (accounts?.length || 0) === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <Building2 className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium text-center">No hay cuentas configuradas</p>
              {goCardlessAppUrl && (
                <Button variant="link" className="text-[#17c3b2] mt-1" onClick={onConnectBank}>
                  Conectar tu primer banco
                </Button>
              )}
            </div>
          ) : (
            <>
              {accounts.map((account) => (
                <div key={account.id} className="p-4 border border-slate-200 rounded-lg bg-white hover:border-[#17c3b2]/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {account.bank_logo ? (
                        <img
                          src={account.bank_logo || "/placeholder.svg"}
                          alt={account.bank_name}
                          className="h-8 w-8 object-contain rounded"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-slate-400" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{account.bank_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{formatIBAN(account.iban)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(account.balance)}</p>
                    <div className="flex items-center mt-1">
                      {account.last_sync ? (
                        <p className="text-[10px] text-slate-400">
                          Sync: {format(new Date(account.last_sync), "dd MMM HH:mm", { locale: es })}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-500">Pendiente sync</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Card rapida para conectar otro */}
              {goCardlessAppUrl && (
                <button
                  onClick={onConnectBank}
                  className="p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/30 hover:bg-[#17c3b2]/5 hover:border-[#17c3b2]/30 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="p-1.5 rounded-full bg-slate-100 group-hover:bg-[#17c3b2]/10 transition-colors">
                    <Plus className="h-4 w-4 text-slate-400 group-hover:text-[#17c3b2]" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 group-hover:text-[#17c3b2]">Añadir banco</span>
                </button>
              )}
            </>
          )}
        </div>
      </TremorCard>

      {/* Banner sin categorizar */}
      {(kpis?.transacciones_sin_categorizar || uncategorizedData.numTransacciones) > 0 && (
        <TremorCard className="border-l-[6px] bg-white" style={{ borderLeftColor: BRAND_COLORS.warning }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#ffcb77]/20">
                <AlertCircle className="h-6 w-6 text-[#ffcb77]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#364f6b]">
                  {(kpis?.transacciones_sin_categorizar || uncategorizedData.numTransacciones).toLocaleString("es-ES")}{" "}
                  transacciones pendientes de categorizar
                </h3>
                <p className="text-sm text-slate-500">
                  {formatCurrency(uncategorizedData.totalGastos)} en gastos ·{" "}
                  {formatCurrency(uncategorizedData.totalIngresos)} en ingresos
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent hover:bg-[#ffcb77]/10 border-[#ffcb77] text-[#ffcb77]"
              onClick={onViewUncategorized}
            >
              Ver pendientes
            </Button>
          </div>
        </TremorCard>
      )}

      {/* Evolucion del Saldo */}
      <TremorCard>
        <TremorTitle>Evolucion del Saldo</TremorTitle>
        <div className="h-[300px] mt-4">
          {balanceEvolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(parseISO(v), "dd MMM", { locale: es })}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tickFormatter={formatCurrencyCompact}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null
                    return (
                      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                        <p className="text-sm font-bold text-slate-700 mb-2">
                          {format(parseISO(label), "EEEE, d MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-sm">
                          Saldo:{" "}
                          <span className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                            {formatCurrency(payload[0]?.value as number)}
                          </span>
                        </p>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke={BRAND_COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: BRAND_COLORS.primary, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              No hay datos suficientes para mostrar el grafico
            </div>
          )}
        </div>
      </TremorCard>

      {/* Ingresos vs Gastos + Top Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Gastos por Mes */}
        <TremorCard>
          <TremorTitle>Ingresos vs Gastos por Mes</TremorTitle>
          <div className="h-[300px] mt-4">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tickFormatter={formatCurrencyCompact}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-2 capitalize">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm">
                              <span
                                className="inline-block w-3 h-3 rounded mr-2"
                                style={{ backgroundColor: entry.color || BRAND_COLORS.primary }}
                              />
                              {entry.name}: <span className="font-bold">{formatCurrency(entry.value)}</span>
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" fill={BRAND_COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill={BRAND_COLORS.error} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No hay datos para mostrar
              </div>
            )}
          </div>
        </TremorCard>

        {/* Top Categorias de Gasto */}
        <TremorCard>
          <TremorTitle>Top Categorias de Gasto</TremorTitle>
          <div className="h-[300px] mt-4">
            {topCategoriesWithPercentage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategoriesWithPercentage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatCurrencyCompact}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    width={120}
                    tickFormatter={(v) => (v.length > 15 ? `${v.substring(0, 15)}...` : v)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-1">{data.name}</p>
                          <p className="text-sm">
                            Total: <span className="font-bold">{formatCurrency(data.value)}</span>
                          </p>
                          <p className="text-xs text-slate-500">{data.percentage.toFixed(1)}% del total</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="value" fill={BRAND_COLORS.primary} radius={[0, 4, 4, 0]}>
                    {topCategoriesWithPercentage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No hay datos para mostrar
              </div>
            )}
          </div>
        </TremorCard>
      </div>
    </div>
  )
}
