"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Package,
  FileCheck,
  Search,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  ShoppingCart,
  FileText,
  Eye,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MenuBar } from "@/components/ui/menu-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  fetchPedidos,
  fetchFacturasConciliacion,
  fetchAlbaranesDisponibles,
  fetchProveedores,
  fetchKPIs,
  vincularAlbaranes,
  confirmarConciliacion,
  descartarConciliacion,
  fetchProductFormats, // Añadir import de fetchProductFormats
} from "@/lib/comprasService"
import { BRAND_COLORS } from "@/constants"
import type {
  CompraPedido,
  CompraFacturaConciliacion,
  CompraAlbaranDisponible,
  CompraProveedor,
  CompraKPIs,
  DateRange,
} from "@/types"
import { format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

type ComprasTab = "pedidos" | "conciliacion"

// Colores de estados de pedidos
const ESTADO_PEDIDO_CONFIG: Record<string, { label: string }> = {
  pendiente: { label: "Pendiente" },
  enviado: { label: "Enviado" },
  autorizado: { label: "Autorizado" },
  recepcionado: { label: "Recepcionado" },
}

// Colores de estados de conciliación
const ESTADO_CONCILIACION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  auto_conciliado: { label: "Auto", color: "#17c3b2", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  conciliado: { label: "Manual", color: "#17c3b2", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  probable: { label: "Probable", color: "#ffcb77", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  revision: { label: "Revisar", color: "#fe6d73", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  posible_duplicado: { label: "Duplicado?", color: "#fe6d73", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  descartado: { label: "Descartado", color: "#94a3b8", icon: <XCircle className="h-3.5 w-3.5" /> },
}

const ESTADO_PAGO_CONFIG: Record<string, { label: string; color: string }> = {
  pagada: { label: "Pagada", color: "#17c3b2" },
  parcial: { label: "Parcial", color: "#ffcb77" },
  pendiente: { label: "Pendiente", color: "#fe6d73" },
  abono: { label: "Abono", color: "#02b1c4" },
}

export default function ComprasPage() {
  // State
  const [activeTab, setActiveTab] = useState<ComprasTab>("pedidos")
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })

  // Data states
  const [pedidos, setPedidos] = useState<CompraPedido[]>([])
  const [facturas, setFacturas] = useState<CompraFacturaConciliacion[]>([])
  const [albaranesDisponibles, setAlbaranesDisponibles] = useState<CompraAlbaranDisponible[]>([])
  const [proveedores, setProveedores] = useState<CompraProveedor[]>([])
  const [kpis, setKpis] = useState<CompraKPIs | null>(null)
  const [formatosMap, setFormatosMap] = useState<Map<string, string>>(new Map()) // Cambiado a Map<string, string>

  // Filters - Pedidos
  const [estadoPedidoFilter, setEstadoPedidoFilter] = useState<string>("todos")
  const [proveedorPedidoFilter, setProveedorPedidoFilter] = useState<string>("todos")
  const [searchPedidos, setSearchPedidos] = useState<string>("")

  // Filters - Conciliación
  const [estadoConciliacionFilter, setEstadoConciliacionFilter] = useState<string>("todos")
  const [estadoPagoFilter, setEstadoPagoFilter] = useState<string>("todos")
  const [proveedorConciliacionFilter, setProveedorConciliacionFilter] = useState<string>("todos")
  const [soloRevision, setSoloRevision] = useState<boolean>(false)

  // Conciliación state
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<CompraFacturaConciliacion | null>(null)
  const [albaranesSeleccionados, setAlbaranesSeleccionados] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // State for drawer of order detail
  const [pedidoDetalle, setPedidoDetalle] = useState<CompraPedido | null>(null)

  // Menu items
  const comprasMenuItems = [
    {
      icon: Package,
      label: "Pedidos",
      href: "#",
      gradient: "radial-gradient(circle, rgba(2,177,196,0.15) 0%, rgba(2,177,196,0) 70%)",
      iconColor: "text-[#02b1c4]",
    },
    {
      icon: FileCheck,
      label: "Conciliación",
      href: "#",
      gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(23,195,178,0) 70%)",
      iconColor: "text-[#17c3b2]",
    },
  ]

  useEffect(() => {
    fetchProductFormats().then((data) => {
      setFormatosMap(new Map(data.map((f) => [String(f.gstock_format_id), f.name])))
    })
  }, [])

  // Load data
  useEffect(() => {
    loadData()
  }, [dateRange])

  async function loadData() {
    setLoading(true)
    const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
    const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

    const [pedidosData, proveedoresData, kpisData] = await Promise.all([
      fetchPedidos({
        fechaDesde: startDate,
        fechaHasta: endDate,
      }),
      fetchProveedores(),
      fetchKPIs(),
    ])

    setPedidos(pedidosData)
    setProveedores(proveedoresData)
    setKpis(kpisData)
    setLoading(false)
  }

  // Load facturas when tab changes to conciliación
  useEffect(() => {
    if (activeTab === "conciliacion") {
      loadFacturas()
    }
  }, [activeTab, estadoConciliacionFilter, estadoPagoFilter, proveedorConciliacionFilter, soloRevision])

  async function loadFacturas() {
    const data = await fetchFacturasConciliacion({
      estadoConciliacion: estadoConciliacionFilter,
      estadoPago: estadoPagoFilter,
      proveedor: proveedorConciliacionFilter,
      soloRevision,
    })
    setFacturas(data)
  }

  // Load albaranes when factura is selected
  useEffect(() => {
    if (facturaSeleccionada?.gstock_supplier_id) {
      loadAlbaranes(facturaSeleccionada.gstock_supplier_id)
    } else {
      setAlbaranesDisponibles([])
    }
    setAlbaranesSeleccionados([])
  }, [facturaSeleccionada])

  async function loadAlbaranes(proveedorId: string) {
    const data = await fetchAlbaranesDisponibles(proveedorId)
    setAlbaranesDisponibles(data)
  }

  // Filtered pedidos
  const filteredPedidos = useMemo(() => {
    let result = pedidos

    if (estadoPedidoFilter !== "todos") {
      result = result.filter((p) => p.estado === estadoPedidoFilter)
    }
    if (proveedorPedidoFilter !== "todos") {
      result = result.filter((p) => p.gstock_supplier_id === proveedorPedidoFilter)
    }
    if (searchPedidos) {
      const term = searchPedidos.toLowerCase()
      result = result.filter(
        (p) => p.numero_pedido.toLowerCase().includes(term) || p.proveedor.toLowerCase().includes(term),
      )
    }

    return result
  }, [pedidos, estadoPedidoFilter, proveedorPedidoFilter, searchPedidos])

  // Helpers
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value)

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: es })
    } catch {
      return dateStr
    }
  }

  // Handle tab change
  const handleTabChange = (item: string) => {
    if (item === "Pedidos") setActiveTab("pedidos")
    else if (item === "Conciliación") setActiveTab("conciliacion")
  }

  // Acciones de conciliación
  const handleVincular = async () => {
    if (!facturaSeleccionada || albaranesSeleccionados.length === 0) return

    setActionLoading("vincular")
    const result = await vincularAlbaranes(facturaSeleccionada.factura_id, albaranesSeleccionados)

    if (result.success) {
      toast.success("Albaranes vinculados correctamente")
      loadFacturas()
      setFacturaSeleccionada(null)
    } else {
      toast.error(result.error || "Error al vincular albaranes")
    }
    setActionLoading(null)
  }

  const handleConfirmar = async (factura: CompraFacturaConciliacion) => {
    if (!factura.conciliacion_id) return

    setActionLoading(factura.id)
    const result = await confirmarConciliacion(factura.conciliacion_id)

    if (result.success) {
      toast.success("Conciliación confirmada")
      loadFacturas()
    } else {
      toast.error(result.error || "Error al confirmar")
    }
    setActionLoading(null)
  }

  const handleDescartar = async (factura: CompraFacturaConciliacion) => {
    setActionLoading(factura.id)
    const result = await descartarConciliacion(factura.factura_id)

    if (result.success) {
      toast.success("Conciliación descartada")
      loadFacturas()
    } else {
      toast.error(result.error || "Error al descartar")
    }
    setActionLoading(null)
  }

  const toggleAlbaranSeleccion = (albaranId: string) => {
    setAlbaranesSeleccionados((prev) =>
      prev.includes(albaranId) ? prev.filter((id) => id !== albaranId) : [...prev, albaranId],
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader icon={ShoppingCart} title="Compras" subtitle="Gestión de pedidos y conciliación de facturas" />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="flex justify-center">
          <MenuBar
            items={comprasMenuItems}
            activeItem={activeTab === "pedidos" ? "Pedidos" : "Conciliación"}
            onItemClick={handleTabChange}
          />
        </div>

        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Pedidos Pendientes */}
            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#02b1c4]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Pedidos Pendientes</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#364f6b]">{Number(kpis.pedidos_pendientes) || 0}</p>
              <p className="text-sm text-slate-500 mt-1">
                {Number(kpis.importe_pedidos_pendientes || 0).toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            </TremorCard>

            {/* Albaranes sin Facturar */}
            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ffcb77]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Albaranes sin Facturar</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#364f6b]">{Number(kpis.albaranes_sin_facturar) || 0}</p>
              <p className="text-sm text-slate-500 mt-1">
                {Number(kpis.importe_sin_facturar || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </p>
            </TremorCard>

            {/* Revisar */}
            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#fe6d73]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Revisar</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#fe6d73]">{Number(kpis.facturas_pendientes_revision) || 0}</p>
              <p className="text-sm text-slate-500 mt-1">facturas pendientes</p>
            </TremorCard>

            {/* Conciliadas */}
            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#17c3b2]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Conciliadas</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#17c3b2]">{Number(kpis.facturas_conciliadas) || 0}</p>
              <p className="text-sm text-slate-500 mt-1">facturas este mes</p>
            </TremorCard>
          </div>
        )}

        {loading ? (
          <Skeleton className="h-[400px] w-full rounded-xl" />
        ) : (
          <>
            {/* ==================== TAB PEDIDOS ==================== */}
            {activeTab === "pedidos" && (
              <>
                {/* Filtros Pedidos */}
                <div className="flex flex-wrap items-center gap-4">
                  <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={setDateRange} />

                  <Select value={proveedorPedidoFilter} onValueChange={setProveedorPedidoFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los proveedores</SelectItem>
                      {proveedores.map((p) => (
                        <SelectItem key={p.gstock_supplier_id} value={p.gstock_supplier_id}>
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

                  <Button variant="outline" size="icon" onClick={loadData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/*Tabla Pedidos */}
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
                                            <span className="text-slate-500 font-medium block mb-1">
                                              Observaciones:
                                            </span>
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
                                onClick={() => setPedidoDetalle(pedido)}
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
            )}

            {/* ==================== TAB CONCILIACIÓN ==================== */}
            {activeTab === "conciliacion" && (
              <>
                {/* Filtros Conciliación */}
                <div className="flex flex-wrap items-center gap-4">
                  <Select value={estadoConciliacionFilter} onValueChange={setEstadoConciliacionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado Conciliación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="auto_conciliado">Auto-conciliado</SelectItem>
                      <SelectItem value="conciliado">Conciliado manual</SelectItem>
                      <SelectItem value="probable">Probable</SelectItem>
                      <SelectItem value="revision">Requiere revisión</SelectItem>
                      <SelectItem value="posible_duplicado">Posible duplicado</SelectItem>
                      <SelectItem value="descartado">Descartado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={estadoPagoFilter} onValueChange={setEstadoPagoFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Estado Pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pagada">Pagada</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                      <SelectItem value="abono">Abono</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={proveedorConciliacionFilter} onValueChange={setProveedorConciliacionFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los proveedores</SelectItem>
                      {proveedores.map((p) => (
                        <SelectItem key={p.gstock_supplier_id} value={p.gstock_supplier_id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Checkbox id="soloRevision" checked={soloRevision} onCheckedChange={(c) => setSoloRevision(!!c)} />
                    <label htmlFor="soloRevision" className="text-sm text-slate-600 cursor-pointer">
                      Solo pendientes de revisión
                    </label>
                  </div>

                  <Button variant="outline" size="icon" onClick={loadFacturas}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Split Panel 70/30 */}
                <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4">
                  {/* Panel Izquierdo - Facturas */}
                  <div className="space-y-4">
                    <TremorTitle>Facturas ({facturas.length})</TremorTitle>

                    {facturas.length === 0 ? (
                      <TremorCard>
                        <p className="text-center text-slate-400 py-8">No hay facturas con los filtros seleccionados</p>
                      </TremorCard>
                    ) : (
                      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                        {facturas.map((factura) => {
                          const estadoConc = factura.estado_conciliacion
                            ? ESTADO_CONCILIACION_CONFIG[factura.estado_conciliacion]
                            : null
                          const estadoPago = ESTADO_PAGO_CONFIG[factura.estado_pago] || ESTADO_PAGO_CONFIG.pendiente
                          const isSelected = facturaSeleccionada?.id === factura.id

                          return (
                            <div
                              key={factura.id}
                              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-[#227c9d] ring-2 ring-[#227c9d]/20"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                              onClick={() => setFacturaSeleccionada(factura)}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {estadoConc && (
                                    <Badge
                                      style={{ backgroundColor: `${estadoConc.color}15`, color: estadoConc.color }}
                                      className="gap-1"
                                    >
                                      {estadoConc.icon}
                                      {estadoConc.label}
                                    </Badge>
                                  )}
                                  {!estadoConc && (
                                    <Badge variant="outline" className="text-slate-500">
                                      Pendiente
                                    </Badge>
                                  )}
                                  <span className="font-semibold text-slate-800">Factura {factura.factura_numero}</span>
                                </div>
                                <Badge style={{ backgroundColor: `${estadoPago.color}15`, color: estadoPago.color }}>
                                  {estadoPago.label}
                                </Badge>
                              </div>

                              {/* Info */}
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <span className="text-slate-500">Proveedor:</span>{" "}
                                  <span className="text-slate-800">{factura.proveedor || "Sin proveedor"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">NIF:</span>{" "}
                                  <span className="text-slate-800">{factura.proveedor_nif || "-"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Fecha:</span>{" "}
                                  <span className="text-slate-800">{formatDate(factura.factura_fecha)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Vencimiento:</span>{" "}
                                  <span className="text-slate-800">
                                    {factura.factura_vencimiento ? formatDate(factura.factura_vencimiento) : "-"}
                                  </span>
                                </div>
                              </div>

                              {/* Importes */}
                              <div className="flex items-center gap-4 text-sm mb-3">
                                <span>
                                  Base: <strong>{formatCurrency(factura.factura_base)}</strong>
                                </span>
                                <span>
                                  IVA: <strong>{formatCurrency(factura.factura_iva)}</strong>
                                </span>
                                <span>
                                  Total: <strong className="text-lg">{formatCurrency(factura.factura_total)}</strong>
                                </span>
                              </div>

                              {/* Concepto */}
                              {factura.factura_concepto && (
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{factura.factura_concepto}</p>
                              )}

                              {/* IA Info */}
                              {factura.ia_confianza_pct !== null && (
                                <div className="flex items-center gap-2 text-sm mb-3">
                                  <span className="text-slate-500">IA: {factura.ia_confianza_pct}% confianza</span>
                                  {factura.tipo_conciliacion && (
                                    <span className="text-slate-400">| Tipo: {factura.tipo_conciliacion}</span>
                                  )}
                                </div>
                              )}

                              {/* Motivo revisión */}
                              {factura.motivo_revision && (
                                <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
                                  <AlertTriangle className="h-4 w-4" />
                                  {factura.motivo_revision}
                                </div>
                              )}

                              {/* Albaranes vinculados */}
                              {factura.albaranes_vinculados && factura.albaranes_vinculados.length > 0 && (
                                <div className="text-sm mb-3">
                                  <span className="text-slate-500">Albaranes: </span>
                                  {factura.albaranes_vinculados.map((alb, i) => (
                                    <Badge key={i} variant="outline" className="mr-1">
                                      {alb}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Acciones */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                {factura.estado_conciliacion === "auto_conciliado" && factura.conciliacion_id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleConfirmar(factura)
                                    }}
                                    disabled={actionLoading === factura.id}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Confirmar
                                  </Button>
                                )}

                                {!factura.estado_conciliacion ||
                                factura.estado_conciliacion === "revision" ||
                                factura.estado_conciliacion === "probable" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFacturaSeleccionada(factura)
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Vincular Albarán
                                  </Button>
                                ) : null}

                                {factura.estado_conciliacion !== "descartado" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-400 hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDescartar(factura)
                                    }}
                                    disabled={actionLoading === factura.id}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Descartar
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Panel Derecho - Albaranes */}
                  <div className="space-y-4">
                    <TremorTitle>
                      Albaranes Disponibles
                      {facturaSeleccionada && (
                        <span className="text-sm font-normal text-slate-500 ml-2">
                          ({facturaSeleccionada.proveedor || "Sin proveedor"})
                        </span>
                      )}
                    </TremorTitle>

                    {!facturaSeleccionada ? (
                      <TremorCard>
                        <p className="text-center text-slate-400 py-8">Selecciona una factura para ver albaranes</p>
                      </TremorCard>
                    ) : albaranesDisponibles.length === 0 ? (
                      <TremorCard>
                        <p className="text-center text-slate-400 py-8">
                          No hay albaranes disponibles para este proveedor
                        </p>
                      </TremorCard>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                          {albaranesDisponibles.map((albaran) => {
                            const isSelected = albaranesSeleccionados.includes(albaran.id)

                            return (
                              <div
                                key={albaran.id}
                                className={`bg-white rounded-lg border p-3 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-[#17c3b2] bg-[#17c3b2]/5"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                                onClick={() => toggleAlbaranSeleccion(albaran.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox checked={isSelected} />
                                    <span className="font-medium text-slate-800">{albaran.numero_albaran}</span>
                                  </div>
                                  <span className="font-semibold text-slate-800">
                                    {formatCurrency(albaran.importe_total)}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-500 mt-1">{formatDate(albaran.fecha)}</div>
                              </div>
                            )
                          })}
                        </div>

                        {albaranesSeleccionados.length > 0 && (
                          <Button
                            className="w-full"
                            style={{ backgroundColor: BRAND_COLORS.primary }}
                            onClick={handleVincular}
                            disabled={actionLoading === "vincular"}
                          >
                            {actionLoading === "vincular" ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Vincular {albaranesSeleccionados.length} albarán(es)
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Sheet open={!!pedidoDetalle} onOpenChange={(open) => !open && setPedidoDetalle(null)}>
        <SheetContent side="right" className="w-[450px] sm:max-w-[450px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-slate-100 pb-4 px-6 pt-6">
            <SheetTitle className="text-lg font-bold text-[#364f6b]">Detalle Pedido</SheetTitle>
          </SheetHeader>

          {pedidoDetalle && (
            <div className="px-6 py-4 space-y-6">
              {/* Información básica */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Nº Pedido</span>
                  <span className="font-semibold text-slate-800">{pedidoDetalle.numero_pedido}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Proveedor</span>
                  <span className="font-semibold text-slate-800">{pedidoDetalle.proveedor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Fecha Pedido</span>
                  <span className="font-semibold text-slate-800">{formatDate(pedidoDetalle.fecha_pedido)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Estado</span>
                  <span className="font-semibold text-[#02b1c4]">
                    {ESTADO_PEDIDO_CONFIG[pedidoDetalle.estado]?.label || pedidoDetalle.estado_label}
                  </span>
                </div>
              </div>

              {/* Importes */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-slate-700 text-sm">Importes</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Base</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(pedidoDetalle.pedido_base)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">IVA</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(pedidoDetalle.pedido_iva || 0)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                  <span className="text-sm font-semibold text-slate-700">Total Pedido</span>
                  <span className="font-bold text-slate-800">{formatCurrency(pedidoDetalle.pedido_total)}</span>
                </div>
              </div>

              {/* Albarán vinculado (solo si existe) */}
              {pedidoDetalle.albaran_ref && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-slate-700 text-sm">Albarán Vinculado</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Nº Albarán</span>
                    <span className="font-semibold text-slate-800">{pedidoDetalle.albaran_ref}</span>
                  </div>
                  {pedidoDetalle.albaran_fecha && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Fecha Albarán</span>
                      <span className="font-semibold text-slate-800">{formatDate(pedidoDetalle.albaran_fecha)}</span>
                    </div>
                  )}
                  {pedidoDetalle.albaran_total != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Total Albarán</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(pedidoDetalle.albaran_total)}
                      </span>
                    </div>
                  )}
                  {pedidoDetalle.diferencia_importe != null && (
                    <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                      <span className="text-sm text-slate-500">Diferencia</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${pedidoDetalle.importe_coincide ? "text-[#17c3b2]" : "text-[#ffcb77]"}`}
                      >
                        {formatCurrency(pedidoDetalle.diferencia_importe)}
                        {pedidoDetalle.importe_coincide && <CheckCircle className="h-4 w-4" />}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Observaciones (solo si hay) */}
              {pedidoDetalle.pedido_observaciones && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-slate-700 text-sm">Observaciones</h4>
                  <p className="text-sm text-slate-600">{pedidoDetalle.pedido_observaciones}</p>
                </div>
              )}

              {/* Incidencias (solo si hay) */}
              {pedidoDetalle.albaran_incidencias && (
                <div className="bg-red-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-[#fe6d73] text-sm">Incidencias</h4>
                  <p className="text-sm text-slate-600">{pedidoDetalle.albaran_incidencias}</p>
                </div>
              )}

              {/*Tabla de productos (solo si hay items) */}
              {pedidoDetalle.pedido_items && pedidoDetalle.pedido_items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-700 text-sm">
                    Productos ({pedidoDetalle.pedido_items.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold text-slate-600">Producto</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-600">Formato</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600">Pedido</th>
                          {pedidoDetalle.estado === "recepcionado" && (
                            <>
                              <th className="text-right py-2 px-3 font-semibold text-slate-600">Recibido</th>
                              <th className="text-center py-2 px-3 font-semibold text-slate-600">OK</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {pedidoDetalle.pedido_items.map((item, idx) => {
                          const isOk = Math.abs(item.quantityOrdered - item.quantityReceived) <= 0.1
                          const formatName = item.formatOrderedId
                            ? formatosMap.get(String(item.formatOrderedId)) || "-"
                            : "-"
                          return (
                            <tr key={idx} className="border-t border-slate-100">
                              <td className="py-2 px-3 text-slate-800">{item.name}</td>
                              <td className="py-2 px-3 text-slate-600">{formatName}</td>
                              <td className="py-2 px-3 text-right text-slate-600">{item.quantityOrdered}</td>
                              {pedidoDetalle.estado === "recepcionado" && (
                                <>
                                  <td className="py-2 px-3 text-right text-slate-600">{item.quantityReceived}</td>
                                  <td className="py-2 px-3 text-center">
                                    {isOk ? (
                                      <CheckCircle className="h-4 w-4 text-[#17c3b2] inline" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-[#ffcb77] inline" />
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
