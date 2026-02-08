"use client"

import {
  Search,
  Check,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency, formatDateFromString } from "@/lib/utils"
import type { CompraPedido, CompraProveedor, DateRange } from "@/types"
import { ESTADO_PEDIDO_CONFIG } from "./constants"

interface ComprasPedidosTabProps {
  filteredPedidos: CompraPedido[]
  proveedores: CompraProveedor[]
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  estadoPedidoFilter: string
  setEstadoPedidoFilter: (v: string) => void
  proveedorPedidoFilter: string
  setProveedorPedidoFilter: (v: string) => void
  searchPedidos: string
  setSearchPedidos: (v: string) => void
  onRefresh: () => void
  onViewDetail: (pedido: CompraPedido) => void
  formatosMap: Map<string, string>
}

export function ComprasPedidosTab({
  filteredPedidos,
  proveedores,
  dateRange,
  setDateRange,
  estadoPedidoFilter,
  setEstadoPedidoFilter,
  proveedorPedidoFilter,
  setProveedorPedidoFilter,
  searchPedidos,
  setSearchPedidos,
  onRefresh,
  onViewDetail,
  formatosMap,
}: ComprasPedidosTabProps) {
  const formatDate = (dateStr: string) => formatDateFromString(dateStr)

  return (
    <>
      {/* Filtros Pedidos */}
      <div className="flex flex-wrap items-center gap-4">
        <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={setDateRange} />

        <Select value={proveedorPedidoFilter} onValueChange={setProveedorPedidoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="todos" value="todos">Todos los proveedores</SelectItem>
            {proveedores.map((p, i) => (
              <SelectItem key={`prov-pedido-${p.gstock_supplier_id}-${i}`} value={p.gstock_supplier_id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estadoPedidoFilter} onValueChange={setEstadoPedidoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="autorizado">Autorizado</SelectItem>
            <SelectItem value="recepcionado">Recepcionado</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar pedido..."
            value={searchPedidos}
            onChange={(e) => setSearchPedidos(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabla Pedidos */}
      <TremorCard>
        <TremorTitle>Pedidos</TremorTitle>
        <p className="text-sm text-slate-500 mb-4">{filteredPedidos.length} pedidos</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Proveedor</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">N Pedido</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Fecha Pedido</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">Importe Pedido</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Albarán</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Fecha Albarán</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">Importe Albarán</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Validado</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Ver</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-800">{pedido.proveedor}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{pedido.numero_pedido}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(pedido.fecha_pedido)}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">
                    {formatCurrency(pedido.pedido_total)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-medium text-[#02b1c4]">
                      {ESTADO_PEDIDO_CONFIG[pedido.estado]?.label || pedido.estado_label || pedido.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{pedido.albaran_ref || "-"}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {pedido.albaran_fecha ? formatDate(pedido.albaran_fecha) : "-"}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {pedido.albaran_total != null ? formatCurrency(pedido.albaran_total) : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {pedido.estado === "recepcionado" && pedido.albaran_ref ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex cursor-pointer">
                              {pedido.importe_coincide ? (
                                <CheckCircle className="h-5 w-5 text-[#17c3b2]" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-[#ffcb77]" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl min-w-[200px]"
                          >
                            <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                              Detalle Validación
                            </p>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-500 font-medium w-28">Importe Pedido:</span>
                                <span className="font-bold text-slate-700">
                                  {formatCurrency(pedido.pedido_total)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-500 font-medium w-28">Importe Albarán:</span>
                                <span className="font-bold text-slate-700">
                                  {pedido.albaran_total != null ? formatCurrency(pedido.albaran_total) : "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-500 font-medium w-28">Diferencia:</span>
                                <span
                                  className={`font-bold ${pedido.importe_coincide ? "text-[#17c3b2]" : "text-[#ffcb77]"}`}
                                >
                                  {pedido.diferencia_importe != null
                                    ? formatCurrency(pedido.diferencia_importe)
                                    : "-"}
                                  {pedido.importe_coincide && " ✓"}
                                </span>
                              </div>
                              {pedido.pedido_observaciones && (
                                <div className="pt-2 border-t border-slate-100">
                                  <span className="text-slate-500 font-medium block mb-1">Observaciones:</span>
                                  <span className="text-slate-700">{pedido.pedido_observaciones}</span>
                                </div>
                              )}
                              {pedido.albaran_incidencias && (
                                <div className="pt-2 border-t border-slate-100">
                                  <span className="text-slate-500 font-medium block mb-1">Incidencias:</span>
                                  <span className="text-[#fe6d73]">{pedido.albaran_incidencias}</span>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onViewDetail(pedido)}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="h-4 w-4 text-[#02b1c4]" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPedidos.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No se encontraron pedidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TremorCard>
    </>
  )
}
