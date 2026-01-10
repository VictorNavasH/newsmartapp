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
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowRightLeft,
  Pause,
  Check,
  Trash2,
  Filter,
  RefreshCw,
  ChevronLeft,
} from "lucide-react"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MenuBar } from "@/components/ui/menu-bar"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import { formatCurrency } from "@/lib/utils"
import {
  fetchFacturacionListado,
  fetchFacturacionKPIs,
  fetchTiposIngreso,
  fetchFacturacionAlertas,
  fetchFacturacionMensual,
  fetchCuadreListado,
  fetchFacturasZReport,
  fetchZReportsDisponibles,
  fetchFacturasHuerfanas,
  fetchFacturasAdyacentes,
  fetchAjustes,
  moverFactura,
  crearAjuste,
  eliminarAjuste,
  confirmarCuadre,
  marcarPendiente,
} from "@/lib/facturacionService"
import type {
  FacturacionListadoItem,
  FacturacionTipoIngreso,
  FacturacionAlerta,
  FacturacionMensual,
  CuadreListadoItem,
  FacturaZReport,
  ZReportDisponible,
  FacturaHuerfana,
  FacturaAdyacente,
  AjusteCuadre,
  CuadreEstadoFilter,
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
    icon: CheckCircle,
    label: "Cuadre",
    href: "#cuadre",
    gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(23,195,178,0) 70%)",
    iconColor: "text-[#17c3b2]",
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

const CUADRE_ESTADOS = {
  cuadrado_auto: {
    label: "Cuadrado Auto",
    bg: "bg-[#17c3b2]/10",
    text: "text-[#17c3b2]",
    border: "border-[#17c3b2]/20",
  },
  cuadrado_manual: {
    label: "Cuadrado Manual",
    bg: "bg-[#02b1c4]/10",
    text: "text-[#02b1c4]",
    border: "border-[#02b1c4]/20",
  },
  propuesta: { label: "Propuesta", bg: "bg-[#ffcb77]/10", text: "text-[#ffcb77]", border: "border-[#ffcb77]/20" },
  descuadre: { label: "Descuadre", bg: "bg-[#fe6d73]/10", text: "text-[#fe6d73]", border: "border-[#fe6d73]/20" },
  pendiente: { label: "Pendiente", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
}

const AJUSTE_TIPOS = [
  { value: "ajuste_positivo", label: "Ajuste Positivo (+)" },
  { value: "ajuste_negativo", label: "Ajuste Negativo (-)" },
  { value: "comentario", label: "Comentario" },
]

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

  // Estados para Cuadre Manual
  const [cuadreListado, setCuadreListado] = useState<CuadreListadoItem[]>([])
  const [cuadreEstadoFilter, setCuadreEstadoFilter] = useState<CuadreEstadoFilter>("todos")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [loadingCuadre, setLoadingCuadre] = useState(false)

  // Estados para panel expandido
  const [facturasZReport, setFacturasZReport] = useState<Record<string, FacturaZReport[]>>({})
  const [ajustesZReport, setAjustesZReport] = useState<Record<string, AjusteCuadre[]>>({})

  // Estados para modales
  const [modalAjuste, setModalAjuste] = useState<{ open: boolean; item: CuadreListadoItem | null }>({
    open: false,
    item: null,
  })
  const [modalPendiente, setModalPendiente] = useState<{ open: boolean; item: CuadreListadoItem | null }>({
    open: false,
    item: null,
  })
  const [modalMoverFactura, setModalMoverFactura] = useState<{
    open: boolean
    item: CuadreListadoItem | null
    factura: FacturaZReport | null
  }>({ open: false, item: null, factura: null })
  const [modalAnadirFactura, setModalAnadirFactura] = useState<{ open: boolean; item: CuadreListadoItem | null }>({
    open: false,
    item: null,
  })

  // Estados para formularios
  const [nuevoAjuste, setNuevoAjuste] = useState({ tipo: "ajuste_positivo", importe: "", descripcion: "" })
  const [motivoPendiente, setMotivoPendiente] = useState("")
  const [facturasHuerfanas, setFacturasHuerfanas] = useState<FacturaHuerfana[]>([])
  const [facturasAdyacentes, setFacturasAdyacentes] = useState<FacturaAdyacente[]>([])
  const [zreportsDisponibles, setZreportsDisponibles] = useState<ZReportDisponible[]>([])
  const [selectedFacturas, setSelectedFacturas] = useState<Set<string>>(new Set())
  const [selectedZReport, setSelectedZReport] = useState<string>("")

  const [actionLoading, setActionLoading] = useState(false)

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

  // Carga de datos de Cuadre cuando se cambia a esa pestaña
  useEffect(() => {
    if (activeTab === "Cuadre") {
      loadCuadreData()
    }
  }, [activeTab, dateRange])

  const loadCuadreData = async () => {
    setLoadingCuadre(true)
    const startDateStr = format(dateRange.from, "yyyy-MM-dd")
    const endDateStr = format(dateRange.to, "yyyy-MM-dd")

    const data = await fetchCuadreListado(startDateStr, endDateStr)
    setCuadreListado(data)

    // Auto-expandir filas con descuadre o propuesta
    const autoExpand = new Set<string>()
    data.forEach((item) => {
      if (item.estado === "descuadre" || item.estado === "propuesta") {
        autoExpand.add(item.zreport_id)
      }
    })
    setExpandedRows(autoExpand)

    // Cargar facturas y ajustes para filas auto-expandidas
    for (const id of autoExpand) {
      const item = data.find((d) => d.zreport_id === id)
      if (item) {
        await loadRowDetails(item)
      }
    }

    setLoadingCuadre(false)
  }

  const loadRowDetails = async (item: CuadreListadoItem) => {
    const [facturas, ajustes] = await Promise.all([
      fetchFacturasZReport(item.zreport_id),
      fetchAjustes(item.fecha, item.zreport_id),
    ])

    setFacturasZReport((prev) => ({ ...prev, [item.zreport_id]: facturas }))
    setAjustesZReport((prev) => ({ ...prev, [item.zreport_id]: ajustes }))
  }

  const toggleRow = async (item: CuadreListadoItem) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(item.zreport_id)) {
      newExpanded.delete(item.zreport_id)
    } else {
      newExpanded.add(item.zreport_id)
      if (!facturasZReport[item.zreport_id]) {
        await loadRowDetails(item)
      }
    }
    setExpandedRows(newExpanded)
  }

  // Filtrar cuadre por estado
  const cuadreListadoFiltrado =
    cuadreEstadoFilter === "todos"
      ? cuadreListado
      : cuadreEstadoFilter === "pendientes"
        ? cuadreListado.filter((item) => ["descuadre", "propuesta", "pendiente"].includes(item.estado))
        : cuadreEstadoFilter === "cuadrados"
          ? cuadreListado.filter((item) => ["cuadrado_auto", "cuadrado_manual"].includes(item.estado))
          : cuadreEstadoFilter === "descuadres"
            ? cuadreListado.filter((item) => item.estado === "descuadre")
            : cuadreListado

  const alertas_error = alertas.filter((a) => a.severidad === "error").length
  const alertas_warning = alertas.filter((a) => a.severidad === "warning").length

  const totalPages = Math.ceil(totalCount / pageSize)

  // Acciones de Cuadre
  const handleConfirmarCuadre = async (item: CuadreListadoItem) => {
    if (!confirm("¿Confirmar el cuadre de este Z-Report?")) return
    setActionLoading(true)
    const result = await confirmarCuadre(item.fecha, item.zreport_id)
    if (result.success) {
      await loadCuadreData()
    } else {
      alert("Error al confirmar: " + result.error)
    }
    setActionLoading(false)
  }

  const handleMarcarPendiente = async () => {
    if (!modalPendiente.item || !motivoPendiente.trim()) return
    setActionLoading(true)
    const result = await marcarPendiente(modalPendiente.item.fecha, modalPendiente.item.zreport_id, motivoPendiente)
    if (result.success) {
      setModalPendiente({ open: false, item: null })
      setMotivoPendiente("")
      await loadCuadreData()
    } else {
      alert("Error: " + result.error)
    }
    setActionLoading(false)
  }

  const handleCrearAjuste = async () => {
    if (!modalAjuste.item || !nuevoAjuste.importe) return
    setActionLoading(true)
    const result = await crearAjuste({
      fecha: modalAjuste.item.fecha,
      zreport_id: modalAjuste.item.zreport_id,
      tipo: nuevoAjuste.tipo as "ajuste_positivo" | "ajuste_negativo" | "comentario",
      importe: Number.parseFloat(nuevoAjuste.importe),
      descripcion: nuevoAjuste.descripcion,
    })
    if (result.success) {
      setModalAjuste({ open: false, item: null })
      setNuevoAjuste({ tipo: "ajuste_positivo", importe: "", descripcion: "" })
      await loadCuadreData()
      if (modalAjuste.item) {
        await loadRowDetails(modalAjuste.item)
      }
    } else {
      alert("Error: " + result.error)
    }
    setActionLoading(false)
  }

  const handleEliminarAjuste = async (ajusteId: number, item: CuadreListadoItem) => {
    if (!confirm("¿Eliminar este ajuste?")) return
    setActionLoading(true)
    const result = await eliminarAjuste(ajusteId)
    if (result.success) {
      await loadCuadreData()
      await loadRowDetails(item)
    } else {
      alert("Error: " + result.error)
    }
    setActionLoading(false)
  }

  const openModalAnadirFactura = async (item: CuadreListadoItem) => {
    setModalAnadirFactura({ open: true, item })
    setSelectedFacturas(new Set())
    const [huerfanas, adyacentes] = await Promise.all([
      fetchFacturasHuerfanas(item.fecha),
      fetchFacturasAdyacentes(item.fecha, item.zreport_id),
    ])
    setFacturasHuerfanas(huerfanas)
    setFacturasAdyacentes(adyacentes)
  }

  const openModalMoverFactura = async (item: CuadreListadoItem, factura: FacturaZReport) => {
    setModalMoverFactura({ open: true, item, factura })
    setSelectedZReport("")
    const zreports = await fetchZReportsDisponibles(item.fecha)
    setZreportsDisponibles(zreports.filter((z) => z.zreport_id !== item.zreport_id))
  }

  const handleMoverFactura = async () => {
    if (!modalMoverFactura.factura || !selectedZReport) return
    setActionLoading(true)
    const result = await moverFactura(modalMoverFactura.factura.factura_id, selectedZReport)
    if (result.success) {
      setModalMoverFactura({ open: false, item: null, factura: null })
      setSelectedZReport("")
      await loadCuadreData()
    } else {
      alert("Error: " + result.error)
    }
    setActionLoading(false)
  }

  const handleAnadirFacturas = async () => {
    if (!modalAnadirFactura.item || selectedFacturas.size === 0) return
    setActionLoading(true)

    for (const facturaId of selectedFacturas) {
      await moverFactura(Number.parseInt(facturaId), modalAnadirFactura.item.zreport_id)
    }

    setModalAnadirFactura({ open: false, item: null })
    setSelectedFacturas(new Set())
    await loadCuadreData()
    setActionLoading(false)
  }

  const toggleFacturaSelection = (id: string) => {
    const newSelection = new Set(selectedFacturas)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedFacturas(newSelection)
  }

  const formatDateES = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      const date = new Date(dateStr)
      if (!isValid(date)) return dateStr
      return format(date, "dd/MM/yyyy", { locale: es })
    } catch {
      return dateStr
    }
  }

  const formatCurrencyES = (value: string | number) => {
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
          icon={<Euro className="w-5 h-5 text-[#02b1c4]" />}
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
      <MenuBar items={facturacionMenuItems} activeItem={activeTab} onItemClick={setActiveTab} className="mb-6" />

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
                                  : "bg-[#ffcb77]/10 text-[#ffcb77]"
                            }`}
                          >
                            {item.verifactu_estado === "accepted" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : item.verifactu_estado === "rejected" ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {item.verifactu_estado_nombre}
                          </span>
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

      {/* Tab Cuadre */}
      {activeTab === "Cuadre" && (
        <TremorCard>
          <div className="flex items-center justify-between mb-4">
            <TremorTitle>Cuadre de Caja</TremorTitle>
            <div className="flex items-center gap-3">
              <Select value={cuadreEstadoFilter} onValueChange={(v) => setCuadreEstadoFilter(v as CuadreEstadoFilter)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendientes">Pendientes de revisión</SelectItem>
                  <SelectItem value="cuadrados">Cuadrados</SelectItem>
                  <SelectItem value="descuadres">Solo descuadres</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadCuadreData} disabled={loadingCuadre}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingCuadre ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {loadingCuadre ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-[#02b1c4]" />
              <span className="ml-2 text-slate-600">Cargando cuadre...</span>
            </div>
          ) : cuadreListadoFiltrado.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No hay datos de cuadre para el período seleccionado</div>
          ) : (
            <div className="space-y-2">
              {cuadreListadoFiltrado.map((item) => {
                const estado = CUADRE_ESTADOS[item.estado] || CUADRE_ESTADOS.pendiente
                const isExpanded = expandedRows.has(item.zreport_id)
                const diferencia = Number.parseFloat(item.diferencia) || 0

                return (
                  <Collapsible key={item.zreport_id} open={isExpanded} onOpenChange={() => toggleRow(item)}>
                    <div
                      className={`border rounded-lg ${estado.border} ${isExpanded ? "border-b-0 rounded-b-none" : ""}`}
                    >
                      <CollapsibleTrigger asChild>
                        <div
                          className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${estado.bg}`}
                        >
                          <div className="flex items-center gap-4">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            )}
                            <div>
                              <p className="font-medium text-[#364f6b]">{formatDateES(item.fecha)}</p>
                              <p className="text-xs text-slate-500">{item.zreport_nombre}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Z-Report</p>
                              <p className="font-medium">{formatCurrencyES(item.total_zreport)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Facturas</p>
                              <p className="font-medium">{formatCurrencyES(item.total_facturas)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Diferencia</p>
                              <p
                                className={`font-medium ${diferencia === 0 ? "text-[#17c3b2]" : diferencia > 0 ? "text-[#fe6d73]" : "text-[#ffcb77]"}`}
                              >
                                {formatCurrencyES(diferencia)}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.text}`}>
                              {estado.label}
                            </span>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      <div className={`border border-t-0 rounded-b-lg p-4 ${estado.border} bg-white`}>
                        {/* Facturas del Z-Report */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-700">Facturas incluidas</h4>
                            <Button variant="outline" size="sm" onClick={() => openModalAnadirFactura(item)}>
                              <Plus className="w-4 h-4 mr-1" />
                              Añadir factura
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="text-left py-2 px-3 font-medium text-slate-600">Nº Factura</th>
                                  <th className="text-left py-2 px-3 font-medium text-slate-600">Hora</th>
                                  <th className="text-right py-2 px-3 font-medium text-slate-600">Importe</th>
                                  <th className="text-left py-2 px-3 font-medium text-slate-600">Método</th>
                                  <th className="text-center py-2 px-3 font-medium text-slate-600">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(facturasZReport[item.zreport_id] || []).map((factura) => (
                                  <tr key={factura.factura_id} className="border-b border-slate-100">
                                    <td className="py-2 px-3">{factura.numero_completo}</td>
                                    <td className="py-2 px-3">{factura.hora}</td>
                                    <td className="py-2 px-3 text-right font-medium">
                                      {formatCurrencyES(factura.importe)}
                                    </td>
                                    <td className="py-2 px-3">{factura.metodo_pago}</td>
                                    <td className="py-2 px-3 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModalMoverFactura(item, factura)}
                                      >
                                        <ArrowRightLeft className="w-4 h-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Ajustes */}
                        {(ajustesZReport[item.zreport_id] || []).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Ajustes aplicados</h4>
                            <div className="space-y-2">
                              {(ajustesZReport[item.zreport_id] || []).map((ajuste) => (
                                <div
                                  key={ajuste.ajuste_id}
                                  className="flex items-center justify-between p-2 bg-slate-50 rounded"
                                >
                                  <div>
                                    <span
                                      className={`text-sm font-medium ${ajuste.tipo === "ajuste_positivo" ? "text-[#17c3b2]" : ajuste.tipo === "ajuste_negativo" ? "text-[#fe6d73]" : "text-slate-600"}`}
                                    >
                                      {ajuste.tipo === "ajuste_positivo"
                                        ? "+"
                                        : ajuste.tipo === "ajuste_negativo"
                                          ? "-"
                                          : ""}
                                      {formatCurrencyES(Math.abs(ajuste.importe))}
                                    </span>
                                    {ajuste.descripcion && (
                                      <span className="text-xs text-slate-500 ml-2">{ajuste.descripcion}</span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEliminarAjuste(ajuste.ajuste_id, item)}
                                  >
                                    <Trash2 className="w-4 h-4 text-slate-400" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalAjuste({ open: true, item })}
                            disabled={actionLoading}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Añadir ajuste
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalPendiente({ open: true, item })}
                            disabled={actionLoading}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Marcar pendiente
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#17c3b2] hover:bg-[#14a89a] text-white ml-auto"
                            onClick={() => handleConfirmarCuadre(item)}
                            disabled={actionLoading || diferencia !== 0}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirmar cuadre
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </TremorCard>
      )}

      {/* Tab Ingresos */}
      {activeTab === "Ingresos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TremorCard>
            <TremorTitle>Ingresos por Categoría</TremorTitle>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tiposIngreso}
                    dataKey="total"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tiposIngreso.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TremorCard>

          <TremorCard>
            <TremorTitle>Evolución Mensual</TremorTitle>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dataMensual}>
                  <XAxis dataKey="mes_nombre" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="total_facturado" fill="#02b1c4" name="Facturado" />
                  <Line type="monotone" dataKey="ticket_medio" stroke="#ffcb77" name="Ticket Medio" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TremorCard>
        </div>
      )}

      {/* Tab Alertas */}
      {activeTab === "Alertas" && (
        <TremorCard>
          <div className="flex items-center justify-between mb-4">
            <TremorTitle>Alertas de Facturación</TremorTitle>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-[#fe6d73]/10 text-[#fe6d73] rounded text-sm font-medium">
                {alertas_error} errores
              </span>
              <span className="px-2 py-1 bg-[#ffcb77]/10 text-[#ffcb77] rounded text-sm font-medium">
                {alertas_warning} avisos
              </span>
            </div>
          </div>

          {alertas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#17c3b2]" />
              <p>No hay alertas activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <div
                  key={alerta.alerta_id}
                  className={`p-4 rounded-lg border ${
                    alerta.severidad === "error"
                      ? "bg-[#fe6d73]/5 border-[#fe6d73]/20"
                      : "bg-[#ffcb77]/5 border-[#ffcb77]/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 ${alerta.severidad === "error" ? "text-[#fe6d73]" : "text-[#ffcb77]"}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#364f6b]">{alerta.mensaje}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDateES(alerta.fecha_alerta)} · {alerta.tipo_alerta}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TremorCard>
      )}

      {/* Modal Añadir Ajuste */}
      <Dialog open={modalAjuste.open} onOpenChange={(open) => !open && setModalAjuste({ open: false, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Ajuste</DialogTitle>
            <DialogDescription>
              Añade un ajuste para cuadrar el Z-Report del {modalAjuste.item && formatDateES(modalAjuste.item.fecha)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <Select value={nuevoAjuste.tipo} onValueChange={(v) => setNuevoAjuste((prev) => ({ ...prev, tipo: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AJUSTE_TIPOS.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Importe (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={nuevoAjuste.importe}
                onChange={(e) => setNuevoAjuste((prev) => ({ ...prev, importe: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={nuevoAjuste.descripcion}
                onChange={(e) => setNuevoAjuste((prev) => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Motivo del ajuste..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAjuste({ open: false, item: null })}>
              Cancelar
            </Button>
            <Button onClick={handleCrearAjuste} disabled={actionLoading || !nuevoAjuste.importe}>
              {actionLoading ? "Guardando..." : "Guardar ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Marcar Pendiente */}
      <Dialog
        open={modalPendiente.open}
        onOpenChange={(open) => !open && setModalPendiente({ open: false, item: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Pendiente</DialogTitle>
            <DialogDescription>Indica el motivo por el que este Z-Report queda pendiente de revisión</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={motivoPendiente}
              onChange={(e) => setMotivoPendiente(e.target.value)}
              placeholder="Motivo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPendiente({ open: false, item: null })}>
              Cancelar
            </Button>
            <Button onClick={handleMarcarPendiente} disabled={actionLoading || !motivoPendiente.trim()}>
              {actionLoading ? "Guardando..." : "Marcar pendiente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Mover Factura */}
      <Dialog
        open={modalMoverFactura.open}
        onOpenChange={(open) => !open && setModalMoverFactura({ open: false, item: null, factura: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Factura</DialogTitle>
            <DialogDescription>
              Selecciona el Z-Report destino para la factura {modalMoverFactura.factura?.numero_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedZReport} onValueChange={setSelectedZReport}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Z-Report destino" />
              </SelectTrigger>
              <SelectContent>
                {zreportsDisponibles.map((zr) => (
                  <SelectItem key={zr.zreport_id} value={zr.zreport_id}>
                    {zr.nombre} - {formatCurrencyES(zr.total)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalMoverFactura({ open: false, item: null, factura: null })}>
              Cancelar
            </Button>
            <Button onClick={handleMoverFactura} disabled={actionLoading || !selectedZReport}>
              {actionLoading ? "Moviendo..." : "Mover factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Añadir Factura */}
      <Dialog
        open={modalAnadirFactura.open}
        onOpenChange={(open) => !open && setModalAnadirFactura({ open: false, item: null })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Añadir Facturas al Z-Report</DialogTitle>
            <DialogDescription>Selecciona las facturas que quieres añadir a este Z-Report</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {facturasHuerfanas.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Facturas sin asignar (huérfanas)</h4>
                <div className="space-y-2">
                  {facturasHuerfanas.map((f) => (
                    <div
                      key={f.factura_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFacturas.has(f.factura_id.toString())
                          ? "border-[#02b1c4] bg-[#02b1c4]/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => toggleFacturaSelection(f.factura_id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{f.numero_completo}</p>
                          <p className="text-sm text-slate-500">{f.hora}</p>
                        </div>
                        <p className="font-medium">{formatCurrencyES(f.importe)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {facturasAdyacentes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Facturas de otros Z-Reports</h4>
                <div className="space-y-2">
                  {facturasAdyacentes.map((f) => (
                    <div
                      key={f.factura_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFacturas.has(f.factura_id.toString())
                          ? "border-[#02b1c4] bg-[#02b1c4]/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => toggleFacturaSelection(f.factura_id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{f.numero_completo}</p>
                          <p className="text-sm text-slate-500">
                            {f.hora} · Origen: {f.zreport_origen}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrencyES(f.importe)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {facturasHuerfanas.length === 0 && facturasAdyacentes.length === 0 && (
              <p className="text-center text-slate-500 py-8">No hay facturas disponibles para añadir</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAnadirFactura({ open: false, item: null })}>
              Cancelar
            </Button>
            <Button onClick={handleAnadirFacturas} disabled={actionLoading || selectedFacturas.size === 0}>
              {actionLoading ? "Añadiendo..." : `Añadir ${selectedFacturas.size} factura(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
