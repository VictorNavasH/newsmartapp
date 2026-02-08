"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Package,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  FileText,
  BarChart3,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TremorCard } from "@/components/ui/TremorCard"
import { MenuBar } from "@/components/ui/menu-bar"
import { Skeleton } from "@/components/ui/skeleton"
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
  fetchProductFormats,
  fetchComprasAnalisisKPIs,
  fetchComprasDistribucion,
  fetchComprasTopProductos,
  fetchComprasEvolucionMensual,
  fetchComprasTablaJerarquica,
} from "@/lib/comprasService"
import { formatCurrency, formatDateFromString } from "@/lib/utils"
import type {
  CompraPedido,
  CompraFacturaConciliacion,
  CompraAlbaranDisponible,
  CompraProveedor,
  CompraKPIs,
  DateRange,
  CompraDistribucionCategoria,
  CompraTablaJerarquica,
  CompraAnalisisKPI,
  CompraTopProducto,
  CompraEvolucionMensual,
} from "@/types"
import { format, startOfMonth, subMonths } from "date-fns"
import { toast } from "sonner"

import { ComprasPedidosTab } from "./compras/ComprasPedidosTab"
import { ComprasConciliacionTab } from "./compras/ComprasConciliacionTab"
import { ComprasAnalisisTab } from "./compras/ComprasAnalisisTab"
import { ESTADO_PEDIDO_CONFIG } from "./compras/constants"

type ComprasTab = "pedidos" | "conciliacion" | "analisis"

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
  const [formatosMap, setFormatosMap] = useState<Map<string, string>>(new Map())

  const [analisisKPIs, setAnalisisKPIs] = useState<CompraAnalisisKPI | null>(null)
  const [evolucionMensual, setEvolucionMensual] = useState<CompraEvolucionMensual[]>([])
  const [distribucion, setDistribucion] = useState<CompraDistribucionCategoria[]>([])
  const [topProductos, setTopProductos] = useState<CompraTopProducto[]>([])
  const [tablaJerarquica, setTablaJerarquica] = useState<CompraTablaJerarquica[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedFamilia, setSelectedFamilia] = useState<string | null>(null)
  const [analisisLoading, setAnalisisLoading] = useState(false)
  const [periodoAnalisis, setPeriodoAnalisis] = useState<string>("3m")

  // Filters - Pedidos
  const [estadoPedidoFilter, setEstadoPedidoFilter] = useState<string>("todos")
  const [proveedorPedidoFilter, setProveedorPedidoFilter] = useState<string>("todos")
  const [searchPedidos, setSearchPedidos] = useState<string>("")

  // Filters - Conciliación
  const [estadoConciliacionFilter, setEstadoConciliacionFilter] = useState<string>("todos")
  const [proveedorConciliacionFilter, setProveedorConciliacionFilter] = useState<string>("todos")
  const [soloRevision, setSoloRevision] = useState<boolean>(false)

  // Conciliación state
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<CompraFacturaConciliacion | null>(null)
  const [albaranesSeleccionados, setAlbaranesSeleccionados] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // State for drawer of order detail
  const [pedidoDetalle, setPedidoDetalle] = useState<CompraPedido | null>(null)

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
    {
      icon: BarChart3,
      label: "Análisis",
      href: "#",
      gradient: "radial-gradient(circle, rgba(255,203,119,0.15) 0%, rgba(255,203,119,0) 70%)",
      iconColor: "text-[#ffcb77]",
    },
  ]

  useEffect(() => {
    fetchProductFormats().then((data) => {
      setFormatosMap(new Map(data.map((f) => [String(f.id), f.name])))
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

  useEffect(() => {
    if (activeTab === "analisis") {
      loadAnalisisData()
    }
  }, [activeTab, periodoAnalisis, selectedFamilia])

  async function loadAnalisisData() {
    setAnalisisLoading(true)

    const today = new Date()
    let fechaDesde: Date
    let mesesNum: number
    switch (periodoAnalisis) {
      case "1m":
        fechaDesde = subMonths(today, 1)
        mesesNum = 1
        break
      case "3m":
        fechaDesde = subMonths(today, 3)
        mesesNum = 3
        break
      case "6m":
        fechaDesde = subMonths(today, 6)
        mesesNum = 6
        break
      case "12m":
        fechaDesde = subMonths(today, 12)
        mesesNum = 12
        break
      default:
        fechaDesde = subMonths(today, 3)
        mesesNum = 3
    }

    const fechaDesdeStr = format(fechaDesde, "yyyy-MM-dd")
    const fechaHastaStr = format(today, "yyyy-MM-dd")

    const [kpisData, distribucionData, topData, evolucionData, tablaData] = await Promise.all([
      fetchComprasAnalisisKPIs({ fechaDesde: fechaDesdeStr, fechaHasta: fechaHastaStr }),
      fetchComprasDistribucion({ fechaDesde: fechaDesdeStr, fechaHasta: fechaHastaStr }),
      fetchComprasTopProductos({ fechaDesde: fechaDesdeStr, fechaHasta: fechaHastaStr, limite: 500 }),
      fetchComprasEvolucionMensual(mesesNum),
      fetchComprasTablaJerarquica({ fechaDesde: fechaDesdeStr, fechaHasta: fechaHastaStr }),
    ])

    setAnalisisKPIs(kpisData)
    setDistribucion(distribucionData)
    setTopProductos(topData)
    setEvolucionMensual(evolucionData)
    setTablaJerarquica(tablaData)
    setAnalisisLoading(false)
  }

  // Load facturas when tab changes to conciliación
  useEffect(() => {
    if (activeTab === "conciliacion") {
      loadFacturas()
    }
  }, [activeTab, estadoConciliacionFilter, proveedorConciliacionFilter, soloRevision])

  async function loadFacturas() {
    const data = await fetchFacturasConciliacion({
      estadoConciliacion: estadoConciliacionFilter,
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

  const formatDate = (dateStr: string) => formatDateFromString(dateStr)

  const handleTabChange = (item: string) => {
    if (item === "Pedidos") setActiveTab("pedidos")
    else if (item === "Conciliación") setActiveTab("conciliacion")
    else if (item === "Análisis") setActiveTab("analisis")
  }

  const toggleRowExpanded = (key: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
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

  const handleConfirmarTodas = async () => {
    const autoFacturas = facturas.filter(
      (f) => f.estado_conciliacion === "auto_conciliado" && f.conciliacion_id
    )
    if (autoFacturas.length === 0) return

    setActionLoading("confirmar_todas")
    let ok = 0
    for (const f of autoFacturas) {
      const result = await confirmarConciliacion(f.conciliacion_id!)
      if (result.success) ok++
    }
    toast.success(`${ok} de ${autoFacturas.length} conciliaciones confirmadas`)
    loadFacturas()
    setActionLoading(null)
  }

  const toggleAlbaranSeleccion = (albaranId: string) => {
    setAlbaranesSeleccionados((prev) =>
      prev.includes(albaranId) ? prev.filter((id) => id !== albaranId) : [...prev, albaranId],
    )
  }

  // Agrupar distribución por familia
  const distribucionAgrupada = useMemo(() => {
    const grupos = new Map<string, { familia: string; total: number; porcentaje: number }>()
    distribucion.forEach((item) => {
      const familiaKey = item.familia || "Sin familia"
      const existing = grupos.get(familiaKey)
      if (existing) {
        existing.total += item.total
        existing.porcentaje += item.porcentaje
      } else {
        grupos.set(familiaKey, {
          familia: familiaKey,
          total: item.total,
          porcentaje: item.porcentaje,
        })
      }
    })
    return Array.from(grupos.values()).sort((a, b) => b.total - a.total)
  }, [distribucion])

  const tablaAgrupada = useMemo(() => {
    const grupos = new Map<string, CompraTablaJerarquica[]>()
    tablaJerarquica.forEach((item) => {
      const key = item.categoria
      if (!grupos.has(key)) {
        grupos.set(key, [])
      }
      grupos.get(key)!.push(item)
    })
    return grupos
  }, [tablaJerarquica])

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader icon={ShoppingCart} title="Compras" subtitle="Gestión de pedidos y conciliación de facturas" />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="flex justify-center">
          <MenuBar
            items={comprasMenuItems}
            activeItem={
              activeTab === "pedidos" ? "Pedidos" : activeTab === "conciliacion" ? "Conciliación" : "Análisis"
            }
            onItemClick={handleTabChange}
          />
        </div>

        {activeTab !== "analisis" && kpis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#02b1c4]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Pedidos Pendientes</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#364f6b]">{kpis.pedidos_pendientes}</p>
              <p className="text-sm text-slate-500 mt-1">
                {formatCurrency(kpis.importe_pedidos_pendientes)}
              </p>
            </TremorCard>

            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ffcb77]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Albaranes sin Facturar</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#364f6b]">{kpis.albaranes_sin_facturar}</p>
              <p className="text-sm text-slate-500 mt-1">
                {formatCurrency(kpis.importe_sin_facturar)}
              </p>
            </TremorCard>

            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#fe6d73]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Facturas Pendientes</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#fe6d73]">{kpis.facturas_pendientes}</p>
              <p className="text-sm text-slate-500 mt-1">
                {formatCurrency(kpis.importe_facturas_pendientes)}
              </p>
            </TremorCard>

            <TremorCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#17c3b2]" />
                  <h3 className="font-bold text-[#364f6b] text-sm">Actividad del Mes</h3>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#17c3b2]">{kpis.num_pedidos_mes + kpis.num_albaranes_mes}</p>
              <p className="text-sm text-slate-500 mt-1">
                {kpis.num_pedidos_mes} pedidos · {kpis.num_albaranes_mes} albaranes
              </p>
            </TremorCard>
          </div>
        )}

        {loading && activeTab !== "analisis" ? (
          <Skeleton className="h-[400px] w-full rounded-xl" />
        ) : (
          <>
            {activeTab === "pedidos" && (
              <ComprasPedidosTab
                filteredPedidos={filteredPedidos}
                proveedores={proveedores}
                dateRange={dateRange}
                setDateRange={setDateRange}
                estadoPedidoFilter={estadoPedidoFilter}
                setEstadoPedidoFilter={setEstadoPedidoFilter}
                proveedorPedidoFilter={proveedorPedidoFilter}
                setProveedorPedidoFilter={setProveedorPedidoFilter}
                searchPedidos={searchPedidos}
                setSearchPedidos={setSearchPedidos}
                onRefresh={loadData}
                onViewDetail={setPedidoDetalle}
                formatosMap={formatosMap}
              />
            )}

            {activeTab === "conciliacion" && (
              <ComprasConciliacionTab
                facturas={facturas}
                albaranesDisponibles={albaranesDisponibles}
                proveedores={proveedores}
                estadoConciliacionFilter={estadoConciliacionFilter}
                setEstadoConciliacionFilter={setEstadoConciliacionFilter}
                proveedorConciliacionFilter={proveedorConciliacionFilter}
                setProveedorConciliacionFilter={setProveedorConciliacionFilter}
                soloRevision={soloRevision}
                setSoloRevision={setSoloRevision}
                facturaSeleccionada={facturaSeleccionada}
                setFacturaSeleccionada={setFacturaSeleccionada}
                albaranesSeleccionados={albaranesSeleccionados}
                toggleAlbaranSeleccion={toggleAlbaranSeleccion}
                actionLoading={actionLoading}
                onRefreshFacturas={loadFacturas}
                onVincular={handleVincular}
                onConfirmar={handleConfirmar}
                onDescartar={handleDescartar}
                onConfirmarTodas={handleConfirmarTodas}
              />
            )}

            {activeTab === "analisis" && (
              <ComprasAnalisisTab
                analisisKPIs={analisisKPIs}
                evolucionMensual={evolucionMensual}
                distribucionAgrupada={distribucionAgrupada}
                tablaAgrupada={tablaAgrupada}
                topProductos={topProductos}
                expandedRows={expandedRows}
                selectedFamilia={selectedFamilia}
                setSelectedFamilia={setSelectedFamilia}
                periodoAnalisis={periodoAnalisis}
                setPeriodoAnalisis={setPeriodoAnalisis}
                analisisLoading={analisisLoading}
                toggleRowExpanded={toggleRowExpanded}
                onRefresh={loadAnalisisData}
              />
            )}
          </>
        )}
      </div>

      {/* Sheet de detalle de pedido */}
      <Sheet open={!!pedidoDetalle} onOpenChange={() => setPedidoDetalle(null)}>
        <SheetContent side="right" className="w-[450px] sm:max-w-[450px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-slate-100 pb-4 px-6 pt-6">
            <SheetTitle className="text-lg font-bold text-[#364f6b]">Detalle Pedido</SheetTitle>
          </SheetHeader>

          {pedidoDetalle && (
            <div className="px-6 py-4 space-y-6">
              {/* Información básica */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">N Pedido</span>
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
                  <span className="font-semibold text-slate-800">{formatCurrency(pedidoDetalle.pedido_subtotal)}</span>
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

              {/* Albarán vinculado */}
              {pedidoDetalle.albaran_ref && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-slate-700 text-sm">Albarán Vinculado</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">N Albarán</span>
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

              {/* Observaciones */}
              {pedidoDetalle.pedido_observaciones && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-slate-700 text-sm">Observaciones</h4>
                  <p className="text-sm text-slate-600">{pedidoDetalle.pedido_observaciones}</p>
                </div>
              )}

              {/* Incidencias */}
              {pedidoDetalle.albaran_incidencias && (
                <div className="bg-red-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-[#fe6d73] text-sm">Incidencias</h4>
                  <p className="text-sm text-slate-600">{pedidoDetalle.albaran_incidencias}</p>
                </div>
              )}

              {/* Tabla de productos */}
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
                            <tr key={`pedido-item-${idx}`} className="border-t border-slate-100">
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
