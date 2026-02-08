"use client"

import {
  PieChartIcon,
  Filter,
  X,
  Building2,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Tooltip as RechartsTooltip } from "recharts"
import { STATUS_COLORS, CATEGORY_COLORS, type ProviderStatusFilter } from "./constants"

interface PieChartDataItem {
  name: string
  value: number
  color: string
  fill: string
}

interface ProviderSummaryItem {
  proveedor: string
  total: number
  pagado: number
  pendiente: number
  vencido: number
  facturas: number
}

interface ExpensesProveedorTabProps {
  providerList: string[]
  selectedProvider: string
  setSelectedProvider: (v: string) => void
  providerStatusFilter: ProviderStatusFilter
  setProviderStatusFilter: (v: ProviderStatusFilter) => void
  filteredProviderExpenses: { length: number }
  providerPieChartData: PieChartDataItem[]
  providerSummary: ProviderSummaryItem[]
  totals: { total: number; pagado: number; pendiente: number; vencido: number; facturas: number }
  rightCardHeight: number | undefined
  loadingExpenses: boolean
}

export function ExpensesProveedorTab({
  providerList,
  selectedProvider,
  setSelectedProvider,
  providerStatusFilter,
  setProviderStatusFilter,
  filteredProviderExpenses,
  providerPieChartData,
  providerSummary,
  totals,
  rightCardHeight,
  loadingExpenses,
}: ExpensesProveedorTabProps) {
  return (
    <div className="space-y-6">
      <TremorCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#17c3b2]" />
            <TremorTitle>Filtros</TremorTitle>
          </div>
          {(selectedProvider !== "all" || providerStatusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProvider("all")
                setProviderStatusFilter("all")
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-500">Proveedor</label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="Todos los proveedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {providerList.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-500">Estado</label>
            <Select
              value={providerStatusFilter}
              onValueChange={(v) => setProviderStatusFilter(v as ProviderStatusFilter)}
            >
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="partial">Pagado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(selectedProvider !== "all" || providerStatusFilter !== "all") && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Mostrando <span className="font-semibold">{filteredProviderExpenses.length}</span> gastos
              {selectedProvider !== "all" && (
                <>
                  {" "}
                  de <span className="font-semibold">{selectedProvider}</span>
                </>
              )}
              {providerStatusFilter !== "all" && (
                <>
                  {" "}
                  con estado{" "}
                  <span className="font-semibold">
                    {providerStatusFilter === "partial"
                      ? "Pagado"
                      : providerStatusFilter === "pending"
                        ? "Pendiente"
                        : "Vencido"}
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </TremorCard>

      {/* Gráficos de Proveedor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TremorCard>
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-5 w-5 text-[#17c3b2]" />
            <TremorTitle>Distribución por Proveedor</TremorTitle>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={providerPieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    const total = providerPieChartData.reduce((sum, d) => sum + d.value, 0)
                    const percent = ((data.value / total) * 100).toFixed(1)
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                          <span className="font-medium text-[#364f6b]">{data.name}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Total gastado:</span>
                            <span className="font-medium text-[#364f6b]">
                              {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                data.value,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">% del total:</span>
                            <span className="font-medium text-[#364f6b]">{percent}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {providerPieChartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </TremorCard>

        <div style={{ height: rightCardHeight ? `${rightCardHeight}px` : "auto" }} className="overflow-hidden">
          <TremorCard className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <Building2 className="h-5 w-5 text-[#17c3b2]" />
              <TremorTitle>Resumen por Proveedor</TremorTitle>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
              {providerSummary.map((provider, index) => {
                const percentage = totals.total > 0 ? (provider.total / totals.total) * 100 : 0
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                return (
                  <div key={provider.proveedor} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-700">{provider.proveedor}</span>
                      </div>
                      <span className="font-bold text-slate-800">{formatCurrency(provider.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{provider.facturas} facturas</span>
                      <span className="text-[#17c3b2]">Pagado: {formatCurrency(provider.pagado)}</span>
                      <span className="text-[#ffcb77]">Pendiente: {formatCurrency(provider.pendiente)}</span>
                      {provider.vencido > 0 && (
                        <span className="text-[#fe6d73]">Vencido: {formatCurrency(provider.vencido)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </TremorCard>
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <TremorCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#17c3b2]" />
            <TremorTitle>Detalle por Proveedor</TremorTitle>
          </div>
          <span className="text-sm text-slate-500">{providerSummary.length} proveedores</span>
        </div>

        {loadingExpenses ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        ) : providerSummary.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left p-3 font-semibold text-slate-600">Ranking</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Proveedor</th>
                  <th className="text-center p-3 font-semibold text-slate-600">Facturas</th>
                  <th className="text-right p-3 font-semibold text-slate-600">Total</th>
                  <th className="text-right p-3 font-semibold text-slate-600">Pagado</th>
                  <th className="text-right p-3 font-semibold text-slate-600">Pendiente</th>
                  <th className="text-right p-3 font-semibold text-slate-600">Vencido</th>
                  <th className="text-right p-3 font-semibold text-slate-600">% Total</th>
                </tr>
              </thead>
              <tbody>
                {providerSummary.map((provider, index) => {
                  const percentage = totals.total > 0 ? (provider.total / totals.total) * 100 : 0
                  return (
                    <tr
                      key={provider.proveedor}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3">
                        {index === 0 ? (
                          <span className="text-lg">{"\u{1F947}"}</span>
                        ) : index === 1 ? (
                          <span className="text-lg">{"\u{1F948}"}</span>
                        ) : index === 2 ? (
                          <span className="text-lg">{"\u{1F949}"}</span>
                        ) : (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-500">
                            {index + 1}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{provider.proveedor}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-slate-600">{provider.facturas}</td>
                      <td className="p-3 text-right font-semibold text-[#364f6b]">
                        {formatCurrency(provider.total)}
                      </td>
                      <td className="p-3 text-right" style={{ color: STATUS_COLORS.partial }}>
                        {formatCurrency(provider.pagado)}
                      </td>
                      <td className="p-3 text-right" style={{ color: STATUS_COLORS.pending }}>
                        {formatCurrency(provider.pendiente)}
                      </td>
                      <td
                        className="p-3 text-right"
                        style={{ color: provider.vencido > 0 ? STATUS_COLORS.overdue : "inherit" }}
                      >
                        {provider.vencido > 0 ? formatCurrency(provider.vencido) : "-"}
                      </td>
                      <td className="p-3 text-right text-slate-600">{percentage.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron proveedores</p>
          </div>
        )}
      </TremorCard>
    </div>
  )
}
