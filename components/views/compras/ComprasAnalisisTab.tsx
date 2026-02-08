"use client"

import {
  X,
  RefreshCw,
  ShoppingCart,
  FileText,
  Package,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type {
  CompraDistribucionCategoria,
  CompraTablaJerarquica,
  CompraAnalisisKPI,
  CompraTopProducto,
  CompraEvolucionMensual,
} from "@/types"
import { CHART_COLORS } from "./constants"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DistribucionAgrupada {
  familia: string
  total: number
  porcentaje: number
}

interface ComprasAnalisisTabProps {
  analisisKPIs: CompraAnalisisKPI | null
  evolucionMensual: CompraEvolucionMensual[]
  distribucionAgrupada: DistribucionAgrupada[]
  tablaAgrupada: Map<string, CompraTablaJerarquica[]>
  topProductos: CompraTopProducto[]
  expandedRows: Set<string>
  selectedFamilia: string | null
  setSelectedFamilia: (v: string | null) => void
  periodoAnalisis: string
  setPeriodoAnalisis: (v: string) => void
  analisisLoading: boolean
  toggleRowExpanded: (key: string) => void
  onRefresh: () => void
}

export function ComprasAnalisisTab({
  analisisKPIs,
  evolucionMensual,
  distribucionAgrupada,
  tablaAgrupada,
  topProductos,
  expandedRows,
  selectedFamilia,
  setSelectedFamilia,
  periodoAnalisis,
  setPeriodoAnalisis,
  analisisLoading,
  toggleRowExpanded,
  onRefresh,
}: ComprasAnalisisTabProps) {
  return (
    <>
      {/* Selector de período */}
      <div className="flex items-center gap-2">
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          {[
            { value: "1m", label: "1 mes" },
            { value: "3m", label: "3 meses" },
            { value: "6m", label: "6 meses" },
            { value: "12m", label: "12 meses" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriodoAnalisis(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${option.value === periodoAnalisis
                ? "bg-[#02b1c4] text-white"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {selectedFamilia && (
          <Badge
            variant="outline"
            className="bg-[#02b1c4]/10 text-[#02b1c4] border-[#02b1c4]/30 cursor-pointer"
            onClick={() => setSelectedFamilia(null)}
          >
            {selectedFamilia} <X className="h-3 w-3 ml-1" />
          </Badge>
        )}

        <Button variant="outline" size="icon" onClick={onRefresh} className="ml-auto bg-transparent">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {analisisLoading ? (
        <Skeleton className="h-[400px] w-full rounded-xl" />
      ) : (
        <>
          {/* KPIs de Análisis */}
          {analisisKPIs && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TremorCard>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#02b1c4]" />
                    <h3 className="font-bold text-[#364f6b] text-sm">Total Compras</h3>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#364f6b]">
                  {formatCurrency(analisisKPIs.total_compras)}
                </p>
                <p className="text-sm text-slate-500 mt-1">en el período</p>
              </TremorCard>

              <TremorCard>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#17c3b2]" />
                    <h3 className="font-bold text-[#364f6b] text-sm">Albaranes</h3>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#364f6b]">{analisisKPIs.num_albaranes}</p>
                <p className="text-sm text-slate-500 mt-1">recepcionados</p>
              </TremorCard>

              <TremorCard>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#ffcb77]" />
                    <h3 className="font-bold text-[#364f6b] text-sm">Ticket Medio</h3>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#364f6b]">
                  {formatCurrency(analisisKPIs.ticket_medio)}
                </p>
                <p className="text-sm text-slate-500 mt-1">por albarán</p>
              </TremorCard>

              <TremorCard>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {(analisisKPIs.variacion_vs_anterior ?? 0) >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-[#fe6d73]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#17c3b2]" />
                    )}
                    <h3 className="font-bold text-[#364f6b] text-sm">vs. Período Anterior</h3>
                  </div>
                </div>
                <p
                  className={`text-3xl font-bold ${(analisisKPIs.variacion_vs_anterior ?? 0) >= 0 ? "text-[#fe6d73]" : "text-[#17c3b2]"}`}
                >
                  {(analisisKPIs.variacion_vs_anterior ?? 0) >= 0 ? "+" : ""}
                  {(analisisKPIs.variacion_vs_anterior ?? 0).toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500 mt-1">variación</p>
              </TremorCard>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolución Mensual */}
            <TremorCard>
              <TremorTitle>Evolución Mensual</TremorTitle>
              <div className="h-[300px] mt-4">
                {evolucionMensual.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucionMensual}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes_label" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Total"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#02b1c4"
                        strokeWidth={3}
                        dot={{ fill: "#02b1c4", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    Sin datos para el período
                  </div>
                )}
              </div>
            </TremorCard>

            {/* Distribución por Familia */}
            <TremorCard>
              <TremorTitle>Distribución por Familia</TremorTitle>
              <p className="text-sm text-slate-500 mb-2">Click en una porción para filtrar</p>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Gráfico Donut */}
                <div className="h-[200px] lg:w-1/2">
                  {distribucionAgrupada.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribucionAgrupada}
                          dataKey="total"
                          nameKey="familia"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          onClick={(_, index) => {
                            const item = distribucionAgrupada[index]
                            if (selectedFamilia === item.familia) {
                              setSelectedFamilia(null)
                            } else {
                              setSelectedFamilia(item.familia)
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {distribucionAgrupada.map((entry, index) => (
                            <Cell
                              key={`cell-dist-${entry.familia || index}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                              opacity={selectedFamilia && selectedFamilia !== entry.familia ? 0.3 : 1}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl min-w-[180px]">
                                <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                                  {data.familia}
                                </p>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Importe:</span>
                                    <span className="font-bold text-[#02b1c4]">
                                      {formatCurrency(data.total)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Porcentaje:</span>
                                    <span className="font-bold text-slate-700">
                                      {data.porcentaje.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Sin datos para el período
                    </div>
                  )}
                </div>

                <div className="lg:w-1/2 max-h-[200px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {distribucionAgrupada.map((item, index) => (
                        <tr
                          key={`dist-row-${item.familia || index}-${index}`}
                          onClick={() => {
                            if (selectedFamilia === item.familia) {
                              setSelectedFamilia(null)
                            } else {
                              setSelectedFamilia(item.familia)
                            }
                          }}
                          className={`cursor-pointer transition-all ${selectedFamilia === item.familia
                            ? "bg-slate-100"
                            : selectedFamilia
                              ? "opacity-40 hover:opacity-70"
                              : "hover:bg-slate-50"
                            }`}
                        >
                          <td className="py-2 pl-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="font-medium text-slate-700 whitespace-nowrap">
                                {item.familia}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 text-right font-bold text-[#02b1c4] whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-2 pr-2 text-right text-slate-500 whitespace-nowrap">
                            ({item.porcentaje.toFixed(1)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TremorCard>
          </div>

          {/* Tabla Jerárquica y Top Productos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla Jerárquica */}
            <TremorCard>
              <TremorTitle>Desglose por Categoría</TremorTitle>
              <div className="mt-4 max-h-[400px] overflow-y-auto">
                {tablaAgrupada.size > 0 ? (
                  <div className="space-y-1">
                    {Array.from(tablaAgrupada.entries()).map(([categoria, items], i) => {
                      const totalCategoria = items.reduce((sum, i) => sum + (i.total_con_iva || 0), 0)
                      const isExpanded = expandedRows.has(categoria)

                      return (
                        <div key={`cat-group-${categoria || i}-${i}`} className="border border-slate-100 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleRowExpanded(categoria)}
                            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                              <span className="font-semibold text-slate-700">{categoria}</span>
                              <Badge variant="outline" className="text-xs">
                                {items.length} tipos
                              </Badge>
                            </div>
                            <span className="font-bold text-[#02b1c4]">{formatCurrency(totalCategoria)}</span>
                          </button>

                          {isExpanded && (
                            <div className="bg-white divide-y divide-slate-100">
                              {items.map((item, idx) => {
                                const porcentaje =
                                  totalCategoria > 0 ? (item.total_con_iva / totalCategoria) * 100 : 0
                                return (
                                  <div
                                    key={`${categoria}-item-${idx}`}
                                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
                                  >
                                    <div className="flex-1 pl-6">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700">
                                          {item.tipo || item.familia || "Sin clasificar"}
                                        </span>
                                        {item.subtipo && item.subtipo !== item.tipo && (
                                          <span className="text-xs text-slate-400">({item.subtipo})</span>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-400 mt-0.5">
                                        {item.num_lineas} compras
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-right">
                                      <div className="w-16">
                                        <div className="text-xs text-slate-400">% Cat.</div>
                                        <div className="font-medium text-slate-600">
                                          {porcentaje.toFixed(1)}%
                                        </div>
                                      </div>
                                      <div className="w-24">
                                        <div className="text-xs text-slate-400">Total</div>
                                        <div className="font-bold text-[#02b1c4]">
                                          {formatCurrency(item.total_con_iva)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-slate-400">
                    Sin datos para el período
                  </div>
                )}
              </div>
            </TremorCard>

            {/* Top Productos */}
            <TremorCard>
              <TremorTitle>Productos</TremorTitle>
              <div className="mt-4 max-h-[400px] overflow-y-auto">
                {topProductos.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Producto</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Formato</th>
                        <th className="text-right py-2 px-2 font-semibold text-slate-600">Cantidad</th>
                        <th className="text-right py-2 px-2 font-semibold text-slate-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductos.map((producto, idx) => (
                        <tr key={`top-prod-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2">
                            <div>
                              <p className="font-medium text-slate-800">{producto.producto}</p>
                              {producto.formato && (
                                <p className="text-xs text-slate-400">{producto.formato}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-left text-slate-600">{producto.formato ?? "-"}</td>
                          <td className="py-2 px-2 text-right text-slate-600">{producto.cantidad}</td>
                          <td className="py-2 px-2 text-right font-medium text-[#02b1c4]">
                            {formatCurrency(producto.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-slate-400">
                    Sin datos para el período
                  </div>
                )}
              </div>
            </TremorCard>
          </div>
        </>
      )}
    </>
  )
}
