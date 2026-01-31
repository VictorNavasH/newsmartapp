"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, startOfWeek, subDays, startOfQuarter, isValid } from "date-fns"
import { es } from "date-fns/locale"
import {
  Receipt,
  CreditCard,
  Banknote,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  FileText,
  Percent,
  ChevronRight,
  ChevronLeft,
  Eye,
  RefreshCw,
} from "lucide-react"

import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MenuBar } from "@/components/ui/menu-bar"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { formatCurrency } from "@/lib/utils"
import {
  fetchFacturacionListado,
  fetchFacturacionKPIs,
  fetchTiposIngreso,
  fetchFacturacionAlertas,
  fetchFacturacionMensual,
} from "@/lib/facturacionService"
import type {
  FacturacionListadoItem,
  FacturacionTipoIngreso,
  FacturacionAlerta,
  FacturacionMensual,
} from "@/types"

const BRAND_COLORS = {
  primary: "#02b1c4",
  secondary: "#17c3b2",
  accent: "#ffcb77",
  danger: "#fe6d73",
  dark: "#364f6b",
}

const facturacionMenuItems = [
  {
    icon: FileText,
    label: "Facturas",
    href: "#facturas",
    gradient: "radial-gradient(circle, rgba(2,177,196,0.15) 0%, rgba(2,177,196,0) 70%)",
    iconColor: "text-[#02b1c4]",
  },
  {
    icon: Euro,
    label: "Ingresos",
    href: "#ingresos",
    gradient: "radial-gradient(circle, rgba(255,203,119,0.15) 0%, rgba(255,203,119,0) 70%)",
    iconColor: "text-[#ffcb77]",
  },
  {
    icon: AlertTriangle,
    label: "Alertas",
    href: "#alertas",
    gradient: "radial-gradient(circle, rgba(254,109,115,0.15) 0%, rgba(254,109,115,0) 70%)",
    iconColor: "text-[#fe6d73]",
  },
]

const CHART_COLORS = ["#02b1c4", "#17c3b2", "#ffcb77", "#fe6d73", "#364f6b"]

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState("Facturas")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })

  // Estados para datos
  const [listado, setListado] = useState<FacturacionListadoItem[]>([])
  const [tiposIngreso, setTiposIngreso] = useState<FacturacionTipoIngreso[]>([])
  const [alertas, setAlertas] = useState<FacturacionAlerta[]>([])
  const [dataMensual, setDataMensual] = useState<FacturacionMensual[]>([])
  const [loading, setLoading] = useState(true)

  // Added state for factura detalle
  const [facturaDetalle, setFacturaDetalle] = useState<FacturacionListadoItem | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)

  const [kpiData, setKpiData] = useState({
    total_facturado: 0,
    total_tarjeta: 0,
    total_efectivo: 0,
    num_facturas: 0,
    ticket_medio: 0,
    base_imponible: 0,
    iva_total: 0,
    verifactu_ok: 0,
    verifactu_error: 0,
    verifactu_pendiente: 0,
  })

  const setPeriod = (period: string) => {
    setSelectedPeriod(period)
    const today = new Date()
    let from: Date

    switch (period) {
      case "yesterday":
        from = subDays(today, 1)
        setDateRange({ from, to: from })
        break
      case "week":
        from = startOfWeek(today, { weekStartsOn: 1 })
        setDateRange({ from, to: today })
        break
      case "month":
        from = startOfMonth(today)
        setDateRange({ from, to: today })
        break
      case "quarter":
        from = startOfQuarter(today)
        setDateRange({ from, to: today })
        break
      default:
        break
    }
    setCurrentPage(1)
  }

  const handleDateChange = (range: { from: Date; to: Date }) => {
    setDateRange({ from: range.from, to: range.to })
    setSelectedPeriod("custom")
    setCurrentPage(1)
  }

  useEffect(() => {
    const loadKPIs = async () => {
      const startDateStr = format(dateRange.from, "yyyy-MM-dd")
      const endDateStr = format(dateRange.to, "yyyy-MM-dd")
      const kpis = await fetchFacturacionKPIs(startDateStr, endDateStr)
      setKpiData(kpis)
    }
    loadKPIs()
  }, [dateRange])

  useEffect(() => {
    const loadListado = async () => {
      setLoading(true)
      const startDateStr = format(dateRange.from, "yyyy-MM-dd")
      const endDateStr = format(dateRange.to, "yyyy-MM-dd")

      const { data, count } = await fetchFacturacionListado(startDateStr, endDateStr, undefined, {
        page: currentPage,
        pageSize,
      })

      setListado(data)
      setTotalCount(count)
      setLoading(false)
    }
    loadListado()
  }, [dateRange, currentPage, pageSize])

  // Carga de otros datos (tipos ingreso, alertas, mensual)
  useEffect(() => {
    const loadOtherData = async () => {
      const [tiposData, alertasData, mensualData] = await Promise.all([
        fetchTiposIngreso(),
        fetchFacturacionAlertas(),
        fetchFacturacionMensual(),
      ])
      setTiposIngreso(tiposData)
      setAlertas(alertasData)
      setDataMensual(mensualData)
    }
    loadOtherData()
  }, [])

  const alertas_error = alertas.filter((a) => a.severidad === "error").length
  const alertas_warning = alertas.filter((a) => a.severidad === "warning").length

  const totalPages = Math.ceil(totalCount / pageSize)

  const formatDateES = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "-"
    try {
      const date = new Date(dateStr)
      if (!isValid(date)) return String(dateStr)
      return format(date, "dd/MM/yyyy", { locale: es })
    } catch {
      return String(dateStr)
    }
  }

  const getConsumoItems = (payload: any) => {
    if (!payload) return []
    try {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload
      const orders = data?.Transaction?.Orders || []
      const items = orders.flatMap((order: any) => order.Items || [])
      return items.filter((item: any) => item.PaymentStatus === 2)
    } catch (e) {
      return []
    }
  }

  const formatCurrencyES = (value: string | number | undefined) => {
    if (value === undefined) return "0,00 €"
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(num)) return "0,00 €"
    return num.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
  }

  const activeTabStyle = `data-[state=active]:bg-[#02b1c4] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200`

  const periodSubtitle =
    selectedPeriod === "yesterday"
      ? "Ayer"
      : selectedPeriod === "week"
        ? "Esta semana"
        : selectedPeriod === "month"
          ? "Este mes"
          : selectedPeriod === "quarter"
            ? "Este trimestre"
            : `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`

  return (
    <PageContent>
      <PageHeader
        title="Facturación"
        subtitle={`Control de facturas y cumplimiento fiscal · ${periodSubtitle}`}
        icon={Receipt}
        actions={
          <div className="flex items-center gap-3">
            <Tabs value={selectedPeriod} onValueChange={setPeriod}>
              <TabsList className="bg-white border border-slate-200 shadow-sm">
                <TabsTrigger value="yesterday" className={activeTabStyle}>
                  Ayer
                </TabsTrigger>
                <TabsTrigger value="week" className={activeTabStyle}>
                  Semana
                </TabsTrigger>
                <TabsTrigger value="month" className={activeTabStyle}>
                  Mes
                </TabsTrigger>
                <TabsTrigger value="quarter" className={activeTabStyle}>
                  Trimestre
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Facturado */}
        <MetricGroupCard
          title="Total Facturado"
          icon={<CreditCard className="w-5 h-5 text-[#02b1c4]" />}
          total={{ value: kpiData.total_facturado, previous: 0, delta: 0, trend: "neutral" }}
          decimals={2}
          suffix="€"
        >
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 rounded-lg bg-[#02b1c4]/10 border border-slate-100/50">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-[#02b1c4]" />
                <span className="text-xs font-medium text-slate-600 uppercase">Tarjeta</span>
              </div>
              <p className="text-sm font-bold text-[#364f6b] text-right mt-1">
                {formatCurrency(kpiData.total_tarjeta)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[#17c3b2]/10 border border-slate-100/50">
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3 h-3 text-[#17c3b2]" />
                <span className="text-xs font-medium text-slate-600 uppercase">Efectivo</span>
              </div>
              <p className="text-sm font-bold text-[#364f6b] text-right mt-1">
                {formatCurrency(kpiData.total_efectivo)}
              </p>
            </div>
          </div>
        </MetricGroupCard>

        {/* Facturas Emitidas */}
        <MetricGroupCard
          title="Facturas Emitidas"
          icon={<FileText className="w-5 h-5 text-[#17c3b2]" />}
          total={{ value: kpiData.num_facturas, previous: 0, delta: 0, trend: "neutral" }}
          decimals={0}
        >
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100/50">
              <div className="flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-slate-500" />
                <span className="text-xs font-medium text-slate-600 uppercase">Ticket Medio</span>
              </div>
              <p className="text-sm font-bold text-[#364f6b] text-right mt-1">{formatCurrency(kpiData.ticket_medio)}</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100/50">
              <div className="flex items-center gap-1.5">
                <Euro className="w-3 h-3 text-slate-500" />
                <span className="text-xs font-medium text-slate-600 uppercase">IVA Total</span>
              </div>
              <p className="text-sm font-bold text-[#364f6b] text-right mt-1">{formatCurrency(kpiData.iva_total)}</p>
            </div>
          </div>
        </MetricGroupCard>

        {/* Estado VeriFactu */}
        <MetricGroupCard
          title="Estado VeriFactu"
          icon={<CheckCircle className="w-5 h-5 text-[#17c3b2]" />}
          total={{
            value: kpiData.num_facturas > 0 ? (kpiData.verifactu_ok / kpiData.num_facturas) * 100 : 0,
            previous: 0,
            delta: 0,
            trend: "neutral",
          }}
          decimals={1}
          suffix="%"
        >
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="p-2 rounded-lg bg-[#17c3b2]/10 border border-slate-100/50">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#17c3b2]" />
                <span className="text-xs font-medium text-slate-600">OK</span>
              </div>
              <p className="text-sm font-bold text-[#17c3b2] text-right mt-1">{kpiData.verifactu_ok}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#fe6d73]/10 border border-slate-100/50">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-[#fe6d73]" />
                <span className="text-xs font-medium text-slate-600">Error</span>
              </div>
              <p className="text-sm font-bold text-[#fe6d73] text-right mt-1">{kpiData.verifactu_error}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#ffcb77]/10 border border-slate-100/50">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#ffcb77]" />
                <span className="text-xs font-medium text-slate-600">Pend.</span>
              </div>
              <p className="text-sm font-bold text-[#ffcb77] text-right mt-1">{kpiData.verifactu_pendiente}</p>
            </div>
          </div>
        </MetricGroupCard>
      </div>

      {/* Menu Bar */}
      <div className="flex justify-center">
        <MenuBar items={facturacionMenuItems} activeItem={activeTab} onItemClick={setActiveTab} className="mb-6" />
      </div>

      {/* Tab Facturas */}
      {activeTab === "Facturas" && (
        <TremorCard>
          <div className="flex items-center justify-between mb-4">
            <TremorTitle>Listado de Facturas</TremorTitle>
            <span className="text-sm text-slate-500">{totalCount} facturas en total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-[#02b1c4]" />
              <span className="ml-2 text-slate-600">Cargando facturas...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Nº Factura</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Mesa</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Importe</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Método</th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">VeriFactu</th>
                      {/* Added column Ver */}
                      <th className="text-center py-3 px-4 font-medium text-slate-600">Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listado.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{formatDateES(item.fecha)}</td>
                        <td className="py-3 px-4 font-medium">{item.numero_completo}</td>
                        <td className="py-3 px-4">{item.mesa || "-"}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.importe_total)}</td>
                        <td className="py-3 px-4">{item.metodo_pago_nombre}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              item.verifactu_estado === "accepted"
                                ? "bg-[#17c3b2]/10 text-[#17c3b2]"
                                : item.verifactu_estado === "rejected"
                                  ? "bg-[#fe6d73]/10 text-[#fe6d73]"
                                  : item.verifactu_estado === "signed"
                                    ? "bg-[#227c9d]/10 text-[#227c9d]"
                                    : "bg-[#ffcb77]/10 text-[#ffcb77]"
                            }`}
                          >
                            {item.verifactu_estado === "accepted" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : item.verifactu_estado === "rejected" ? (
                              <XCircle className="w-3 h-3" />
                            ) : item.verifactu_estado === "signed" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {item.verifactu_estado_nombre}
                          </span>
                        </td>
                        {/* Added cell with Eye icon */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setFacturaDetalle(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4 text-[#02b1c4]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Mostrar</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => {
                      setPageSize(Number(v))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-slate-600">por página</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} de{" "}
                    {totalCount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-slate-600 px-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </TremorCard>
      )}

      {/* Factura Detalle Sheet */}
      <Sheet open={!!facturaDetalle} onOpenChange={(open) => !open && setFacturaDetalle(null)}>
        <SheetContent side="right" className="w-[450px] sm:w-[500px] p-0 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <SheetTitle className="text-lg font-bold text-[#364f6b]">Detalle de Factura</SheetTitle>
            {facturaDetalle && <p className="text-sm text-slate-500">{facturaDetalle.cuentica_identifier}</p>}
          </SheetHeader>

          {facturaDetalle && (
            <div className="px-6 py-4 space-y-6">
              {/* Información General */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Información General</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Fecha</p>
                    <p className="text-sm font-medium text-slate-700">{formatDateES(facturaDetalle.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Mesa</p>
                    <p className="text-sm font-medium text-slate-700">{facturaDetalle.mesa || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Método de Pago</p>
                    <p className="text-sm font-medium text-slate-700">{facturaDetalle.metodo_pago_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Nº Pedido</p>
                    <p className="text-sm font-medium text-slate-700">{facturaDetalle.order_numbers || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Importes */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Importes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Base Imponible</span>
                    <span className="text-sm font-medium text-slate-700">
                      {formatCurrencyES(facturaDetalle.base_imponible)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">IVA</span>
                    <span className="text-sm font-medium text-slate-700">{formatCurrencyES(facturaDetalle.iva)}</span>
                  </div>
                  {Number(facturaDetalle.propinas) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Propinas</span>
                      <span className="text-sm font-medium text-slate-700">
                        {formatCurrencyES(facturaDetalle.propinas)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Total</span>
                    <span className="text-sm font-bold text-[#02b1c4]">
                      {formatCurrencyES(facturaDetalle.importe_total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estado VeriFactu */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Estado VeriFactu</h4>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    facturaDetalle.verifactu_estado === "accepted"
                      ? "bg-[#17c3b2]/10 text-[#17c3b2]"
                      : facturaDetalle.verifactu_estado === "rejected"
                        ? "bg-[#fe6d73]/10 text-[#fe6d73]"
                        : facturaDetalle.verifactu_estado === "signed"
                          ? "bg-[#227c9d]/10 text-[#227c9d]"
                          : "bg-[#ffcb77]/10 text-[#ffcb77]"
                  }`}
                >
                  {facturaDetalle.verifactu_estado === "accepted" || facturaDetalle.verifactu_estado === "signed" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : facturaDetalle.verifactu_estado === "rejected" ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {facturaDetalle.verifactu_estado_nombre}
                </span>
              </div>

              {/* Cliente (si existe) */}
              {(facturaDetalle.cliente_nombre || facturaDetalle.cliente_cif) && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Cliente</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {facturaDetalle.cliente_nombre && (
                      <div>
                        <p className="text-xs text-slate-500">Nombre</p>
                        <p className="text-sm font-medium text-slate-700">{facturaDetalle.cliente_nombre}</p>
                      </div>
                    )}
                    {facturaDetalle.cliente_cif && (
                      <div>
                        <p className="text-xs text-slate-500">CIF/NIF</p>
                        <p className="text-sm font-medium text-slate-700">{facturaDetalle.cliente_cif}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detalle de Consumo */}
              {facturaDetalle.webhook_payload && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Detalle de Consumo</h4>
                  <div className="space-y-3">
                    {getConsumoItems(facturaDetalle.webhook_payload).length > 0 ? (
                      getConsumoItems(facturaDetalle.webhook_payload).map((item: any, idx: number) => (
                        <div key={idx} className="pb-2 border-b border-slate-50 last:border-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-700">
                                {item.Quantity || 1}x{" "}
                                {item.ItemData?.Localization?.es || item.ItemData?.Name || "Producto"}
                              </span>
                              {item.ItemOptions && item.ItemOptions.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.ItemOptions.map((opt: any, optIdx: number) => (
                                    <p key={optIdx} className="text-xs text-[#02b1c4]">
                                      - {opt.Localization?.es || opt.Name || "Opción"}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-700 ml-3">
                              {formatCurrencyES(item.PriceTotal || 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Sin detalle de consumo disponible</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageContent>
  )
}
