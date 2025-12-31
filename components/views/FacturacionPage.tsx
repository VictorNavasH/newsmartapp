"use client"

import { useState, useEffect, useMemo } from "react"
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
} from "lucide-react"
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { TremorCard } from "@/components/ui/TremorCard"
import { Title as TremorTitle } from "@tremor/react"
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
  }

  const handleDateChange = (range: { from: Date; to: Date }) => {
    setDateRange({ from: range.from, to: range.to })
    setSelectedPeriod("custom")
  }

  // Carga de datos principales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const startDateStr = format(dateRange.from, "yyyy-MM-dd")
      const endDateStr = format(dateRange.to, "yyyy-MM-dd")

      const [listadoData, tiposData, alertasData, mensualData] = await Promise.all([
        fetchFacturacionListado(startDateStr, endDateStr),
        fetchTiposIngreso(),
        fetchFacturacionAlertas(),
        fetchFacturacionMensual(),
      ])

      setListado(listadoData)
      setTiposIngreso(tiposData)
      setAlertas(alertasData)
      setDataMensual(mensualData)
      setLoading(false)
    }

    loadData()
  }, [dateRange])

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
  const cuadreListadoFiltrado = useMemo(() => {
    if (cuadreEstadoFilter === "todos") return cuadreListado
    if (cuadreEstadoFilter === "pendientes") {
      return cuadreListado.filter((item) => ["descuadre", "propuesta", "pendiente"].includes(item.estado))
    }
    if (cuadreEstadoFilter === "cuadrados") {
      return cuadreListado.filter((item) => ["cuadrado_auto", "cuadrado_manual"].includes(item.estado))
    }
    if (cuadreEstadoFilter === "descuadres") {
      return cuadreListado.filter((item) => item.estado === "descuadre")
    }
    return cuadreListado
  }, [cuadreListado, cuadreEstadoFilter])

  // Calcular KPIs desde listado
  const kpiData = useMemo(() => {
    const total_facturado = listado.reduce((sum, f) => sum + (f.importe_total || 0), 0)
    const base_imponible = listado.reduce((sum, f) => sum + (f.base_imponible || 0), 0)
    const iva_total = listado.reduce((sum, f) => sum + (f.iva || 0), 0)
    const total_tarjeta = listado
      .filter(
        (f) =>
          f.metodo_pago === "card" ||
          f.metodo_pago === "tarjeta" ||
          f.metodo_pago_nombre?.toLowerCase().includes("tarjeta"),
      )
      .reduce((sum, f) => sum + (f.importe_total || 0), 0)
    const total_efectivo = listado
      .filter(
        (f) =>
          f.metodo_pago === "cash" ||
          f.metodo_pago === "efectivo" ||
          f.metodo_pago_nombre?.toLowerCase().includes("efectivo"),
      )
      .reduce((sum, f) => sum + (f.importe_total || 0), 0)
    const verifactu_ok = listado.filter((f) => f.verifactu_estado === "accepted").length
    const verifactu_error = listado.filter((f) => f.verifactu_estado === "rejected").length
    const verifactu_pendiente = listado.filter(
      (f) => f.verifactu_estado === "waiting_for_response" || f.verifactu_estado === "not_sent",
    ).length
    const num_facturas = listado.length
    const ticket_medio = num_facturas > 0 ? total_facturado / num_facturas : 0
    const alertas_error = alertas.filter((a) => a.severidad === "error").length
    const alertas_warning = alertas.filter((a) => a.severidad === "warning").length

    return {
      total_facturado,
      base_imponible,
      iva_total,
      total_tarjeta,
      total_efectivo,
      verifactu_ok,
      verifactu_error,
      verifactu_pendiente,
      num_facturas,
      ticket_medio,
      alertas_error,
      alertas_warning,
    }
  }, [listado, alertas])

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
          valuePrefix=""
          valueSuffix=""
        >
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 rounded-lg bg-[#ffcb77]/10 border border-slate-100/50">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-3 h-3 text-[#ffcb77]" />
                <span className="text-xs font-medium text-slate-600 uppercase">Ticket Medio</span>
              </div>
              <p className="text-sm font-bold text-[#364f6b] text-right mt-1">{formatCurrency(kpiData.ticket_medio)}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#02b1c4]/10 border border-slate-100/50">
              <div className="flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-[#02b1c4]" />
                <span className="text-xs font-medium text-slate-600 uppercase">IVA (10%)</span>
              </div>
              <p className="text-sm font-bold text-[#364f6b] text-right mt-1">{formatCurrency(kpiData.iva_total)}</p>
            </div>
          </div>
        </MetricGroupCard>

        {/* VeriFactu + Alertas */}
        <MetricGroupCard
          title="VeriFactu"
          icon={<CheckCircle className="w-5 h-5 text-[#17c3b2]" />}
          total={{ value: kpiData.verifactu_ok, previous: 0, delta: 0, trend: "neutral" }}
          valuePrefix=""
          valueSuffix=" OK"
        >
          <div className="space-y-2 mt-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-[#17c3b2]/10 border border-slate-100/50 text-center">
                <CheckCircle className="w-3 h-3 text-[#17c3b2] mx-auto" />
                <p className="text-xs font-medium text-slate-600 mt-1">OK</p>
                <p className="text-sm font-bold text-[#364f6b]">{kpiData.verifactu_ok}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#ffcb77]/10 border border-slate-100/50 text-center">
                <Clock className="w-3 h-3 text-[#ffcb77] mx-auto" />
                <p className="text-xs font-medium text-slate-600 mt-1">Pend.</p>
                <p className="text-sm font-bold text-[#364f6b]">{kpiData.verifactu_pendiente}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#fe6d73]/10 border border-slate-100/50 text-center">
                <XCircle className="w-3 h-3 text-[#fe6d73] mx-auto" />
                <p className="text-xs font-medium text-slate-600 mt-1">Error</p>
                <p className="text-sm font-bold text-[#364f6b]">{kpiData.verifactu_error}</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[#fe6d73]/10 border border-slate-100/50">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-[#fe6d73]" />
                    <span className="text-xs font-medium text-slate-600 uppercase">Errores</span>
                  </div>
                  <p className="text-sm font-bold text-[#364f6b] text-right mt-1">{kpiData.alertas_error}</p>
                </div>
                <div className="p-2 rounded-lg bg-[#ffcb77]/10 border border-slate-100/50">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-[#ffcb77]" />
                    <span className="text-xs font-medium text-slate-600 uppercase">Avisos</span>
                  </div>
                  <p className="text-sm font-bold text-[#364f6b] text-right mt-1">{kpiData.alertas_warning}</p>
                </div>
              </div>
            </div>
          </div>
        </MetricGroupCard>
      </div>

      {/* Tabs de contenido */}
      <div className="flex justify-center mb-6">
        <MenuBar items={facturacionMenuItems} activeItem={activeTab} onItemClick={setActiveTab} />
      </div>

      {/* Tab Facturas */}
      {activeTab === "Facturas" && (
        <TremorCard>
          <TremorTitle>Listado de Facturas</TremorTitle>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Nº Factura</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Mesa</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Importe</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Método</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">VeriFactu</th>
                </tr>
              </thead>
              <tbody>
                {listado.slice(0, 50).map((item) => (
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
                  <Collapsible key={item.zreport_id} open={isExpanded}>
                    <div
                      className={`border rounded-lg ${estado.border} ${
                        item.estado === "descuadre"
                          ? "bg-[#fe6d73]/5"
                          : item.estado === "propuesta"
                            ? "bg-[#ffcb77]/5"
                            : "bg-white"
                      }`}
                    >
                      <CollapsibleTrigger asChild>
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50"
                          onClick={() => toggleRow(item)}
                        >
                          <div className="flex items-center gap-4">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            )}
                            <div>
                              <p className="font-medium text-[#364f6b]">{formatDateES(item.fecha)}</p>
                              <p className="text-sm text-slate-500">{item.zreport_documento}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.text}`}>
                              {estado.label}
                            </span>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">Facturas</p>
                              <p className="font-medium">{item.num_facturas}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">Total Facturas</p>
                              <p className="font-medium">{formatCurrencyES(item.total_facturas)}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">Total Z-Report</p>
                              <p className="font-medium">{formatCurrencyES(item.total_zreport)}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">Ajustes</p>
                              <p className="font-medium">{formatCurrencyES(item.total_ajustes)}</p>
                            </div>

                            <div className="text-right min-w-[100px]">
                              <p className="text-xs text-slate-500">Diferencia</p>
                              <p
                                className={`font-bold ${
                                  diferencia === 0
                                    ? "text-[#17c3b2]"
                                    : diferencia > 0
                                      ? "text-[#02b1c4]"
                                      : "text-[#fe6d73]"
                                }`}
                              >
                                {formatCurrencyES(diferencia)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-slate-100 p-4 space-y-4">
                          {/* Sección 1: Facturas asociadas */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-slate-700">Facturas asociadas</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openModalAnadirFactura(item)}
                                disabled={actionLoading}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Añadir factura
                              </Button>
                            </div>
                            {facturasZReport[item.zreport_id]?.length > 0 ? (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                                    <th className="text-left py-2 px-2">Hora</th>
                                    <th className="text-left py-2 px-2">Mesa</th>
                                    <th className="text-left py-2 px-2">Factura</th>
                                    <th className="text-right py-2 px-2">Importe</th>
                                    <th className="text-left py-2 px-2">Método</th>
                                    <th className="text-center py-2 px-2">Tipo</th>
                                    <th className="text-right py-2 px-2">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {facturasZReport[item.zreport_id].map((factura) => (
                                    <tr key={factura.factura_id} className="border-b border-slate-50">
                                      <td className="py-2 px-2">{factura.hora?.substring(0, 5) || "-"}</td>
                                      <td className="py-2 px-2">{factura.table_name || "-"}</td>
                                      <td className="py-2 px-2 font-medium">{factura.cuentica_identifier}</td>
                                      <td className="py-2 px-2 text-right">{formatCurrencyES(factura.total_amount)}</td>
                                      <td className="py-2 px-2 capitalize">{factura.payment_method}</td>
                                      <td className="py-2 px-2 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-xs ${
                                            factura.tipo_asociacion === "auto"
                                              ? "bg-[#17c3b2]/10 text-[#17c3b2]"
                                              : factura.tipo_asociacion === "manual"
                                                ? "bg-[#02b1c4]/10 text-[#02b1c4]"
                                                : "bg-[#ffcb77]/10 text-[#ffcb77]"
                                          }`}
                                        >
                                          {factura.tipo_asociacion}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openModalMoverFactura(item, factura)}
                                          disabled={actionLoading}
                                        >
                                          <ArrowRightLeft className="w-4 h-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-sm text-slate-500 italic">No hay facturas asociadas</p>
                            )}
                          </div>

                          {/* Sección 2: Ajustes */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-slate-700">Ajustes</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setModalAjuste({ open: true, item })}
                                disabled={actionLoading}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Añadir ajuste
                              </Button>
                            </div>
                            {ajustesZReport[item.zreport_id]?.length > 0 ? (
                              <div className="space-y-1">
                                {ajustesZReport[item.zreport_id].map((ajuste) => (
                                  <div
                                    key={ajuste.id}
                                    className="flex items-center justify-between p-2 bg-slate-50 rounded"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          ajuste.tipo === "ajuste_positivo"
                                            ? "bg-[#17c3b2]/10 text-[#17c3b2]"
                                            : ajuste.tipo === "ajuste_negativo"
                                              ? "bg-[#fe6d73]/10 text-[#fe6d73]"
                                              : "bg-slate-200 text-slate-600"
                                        }`}
                                      >
                                        {ajuste.tipo === "ajuste_positivo"
                                          ? "+"
                                          : ajuste.tipo === "ajuste_negativo"
                                            ? "-"
                                            : "📝"}
                                      </span>
                                      <span className="font-medium">{formatCurrencyES(ajuste.importe)}</span>
                                      {ajuste.descripcion && (
                                        <span className="text-slate-500 text-sm">{ajuste.descripcion}</span>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEliminarAjuste(ajuste.id, item)}
                                      disabled={actionLoading}
                                    >
                                      <Trash2 className="w-4 h-4 text-[#fe6d73]" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">No hay ajustes</p>
                            )}
                          </div>

                          {/* Sección 3: Resumen y acciones */}
                          <div className="border-t border-slate-200 pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6 text-sm">
                                <div>
                                  <span className="text-slate-500">Total Facturas:</span>{" "}
                                  <span className="font-medium">{formatCurrencyES(item.total_facturas)}</span>
                                </div>
                                <span className="text-slate-300">+</span>
                                <div>
                                  <span className="text-slate-500">Ajustes:</span>{" "}
                                  <span className="font-medium">{formatCurrencyES(item.total_ajustes)}</span>
                                </div>
                                <span className="text-slate-300">=</span>
                                <div>
                                  <span className="text-slate-500">Total:</span>{" "}
                                  <span className="font-medium">
                                    {formatCurrencyES(
                                      (Number.parseFloat(item.total_facturas) || 0) +
                                        (Number.parseFloat(item.total_ajustes) || 0),
                                    )}
                                  </span>
                                </div>
                                <span className="text-slate-300">vs</span>
                                <div>
                                  <span className="text-slate-500">Z-Report:</span>{" "}
                                  <span className="font-medium">{formatCurrencyES(item.total_zreport)}</span>
                                </div>
                                <span className="text-slate-300">→</span>
                                <div>
                                  <span className="text-slate-500">Diferencia:</span>{" "}
                                  <span
                                    className={`font-bold ${diferencia === 0 ? "text-[#17c3b2]" : "text-[#fe6d73]"}`}
                                  >
                                    {formatCurrencyES(diferencia)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {item.estado === "propuesta" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConfirmarCuadre(item)}
                                      disabled={actionLoading}
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Confirmar
                                    </Button>
                                  </>
                                )}
                                {item.estado === "descuadre" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setModalPendiente({ open: true, item })}
                                      disabled={actionLoading}
                                    >
                                      <Pause className="w-4 h-4 mr-1" />
                                      Marcar pendiente
                                    </Button>
                                    {diferencia === 0 && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleConfirmarCuadre(item)}
                                        disabled={actionLoading}
                                        className="bg-[#17c3b2] hover:bg-[#17c3b2]/90"
                                      >
                                        <Check className="w-4 h-4 mr-1" />
                                        Confirmar cuadre
                                      </Button>
                                    )}
                                  </>
                                )}
                                {item.estado === "pendiente" && item.motivo_pendiente && (
                                  <div className="text-sm text-slate-500 italic">Motivo: {item.motivo_pendiente}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </TremorCard>
      )}

      {/* Tab Ingresos */}
      {activeTab === "Ingresos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TremorCard>
            <TremorTitle>Ingresos por Categoría</TremorTitle>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tiposIngreso}
                    dataKey="total"
                    nameKey="categoria_nombre"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                  >
                    {tiposIngreso.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                          <p className="font-medium text-[#364f6b]">{data.categoria_nombre}</p>
                          <p className="text-sm text-slate-600">{formatCurrency(data.total)}</p>
                          <p className="text-xs text-slate-500">{data.pct_total?.toFixed(1)}% del total</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {tiposIngreso.map((cat, index) => (
                <div key={cat.categoria} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span>{cat.categoria_nombre}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(cat.total)}</span>
                </div>
              ))}
            </div>
          </TremorCard>

          <TremorCard>
            <TremorTitle>Evolución Mensual</TremorTitle>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dataMensual.slice().reverse()}>
                  <XAxis
                    dataKey="mes"
                    tickFormatter={(val) => {
                      if (!val) return ""
                      try {
                        const date = new Date(val)
                        return isValid(date) ? format(date, "MMM yy", { locale: es }) : ""
                      } catch {
                        return ""
                      }
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                          <p className="font-medium text-[#364f6b] mb-2">
                            {label && isValid(new Date(label))
                              ? format(new Date(label), "MMMM yyyy", { locale: es })
                              : "Fecha desconocida"}
                          </p>
                          {payload.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="text-slate-600">{p.name}:</span>
                              <span className="font-medium">
                                {p.name === "Facturas" ? p.value : formatCurrency(p.value as number)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="total_facturado"
                    fill="#17c3b2"
                    name="Facturación"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="num_facturas"
                    stroke="#ffcb77"
                    strokeWidth={2}
                    dot={{ fill: "#ffcb77", r: 4 }}
                    name="Facturas"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TremorCard>
        </div>
      )}

      {/* Tab Alertas */}
      {activeTab === "Alertas" && (
        <TremorCard>
          <TremorTitle>Alertas de Facturación</TremorTitle>
          <div className="space-y-3 mt-4">
            {alertas.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No hay alertas activas</p>
            ) : (
              alertas.map((alerta, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    alerta.severidad === "error"
                      ? "bg-[#fe6d73]/5 border-[#fe6d73]/20"
                      : "bg-[#ffcb77]/5 border-[#ffcb77]/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {alerta.severidad === "error" ? (
                        <XCircle className="w-5 h-5 text-[#fe6d73] mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-[#ffcb77] mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-[#364f6b]">{alerta.mensaje}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {formatDateES(alerta.fecha_alerta)} · {alerta.tipo_alerta}
                        </p>
                        {alerta.referencia && <p className="text-sm text-slate-600 mt-1">Ref: {alerta.referencia}</p>}
                      </div>
                    </div>
                    {alerta.importe > 0 && (
                      <span className="font-medium text-[#364f6b]">{formatCurrency(alerta.importe)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TremorCard>
      )}

      {/* Modal Crear Ajuste */}
      <Dialog
        open={modalAjuste.open}
        onOpenChange={(open) => setModalAjuste({ open, item: open ? modalAjuste.item : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Ajuste</DialogTitle>
            <DialogDescription>
              Añadir un ajuste al cuadre del {modalAjuste.item && formatDateES(modalAjuste.item.fecha)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de ajuste</Label>
              <Select value={nuevoAjuste.tipo} onValueChange={(v) => setNuevoAjuste({ ...nuevoAjuste, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AJUSTE_TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Importe (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={nuevoAjuste.importe}
                onChange={(e) => setNuevoAjuste({ ...nuevoAjuste, importe: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={nuevoAjuste.descripcion}
                onChange={(e) => setNuevoAjuste({ ...nuevoAjuste, descripcion: e.target.value })}
                placeholder="Motivo del ajuste..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAjuste({ open: false, item: null })}>
              Cancelar
            </Button>
            <Button onClick={handleCrearAjuste} disabled={actionLoading || !nuevoAjuste.importe}>
              Crear ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Marcar Pendiente */}
      <Dialog
        open={modalPendiente.open}
        onOpenChange={(open) => setModalPendiente({ open, item: open ? modalPendiente.item : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Pendiente</DialogTitle>
            <DialogDescription>Indica el motivo por el que este cuadre queda pendiente de revisión.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo</Label>
            <Textarea
              value={motivoPendiente}
              onChange={(e) => setMotivoPendiente(e.target.value)}
              placeholder="Ej: Esperando ticket físico, revisar con encargado..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPendiente({ open: false, item: null })}>
              Cancelar
            </Button>
            <Button onClick={handleMarcarPendiente} disabled={actionLoading || !motivoPendiente.trim()}>
              Marcar pendiente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Mover Factura */}
      <Dialog
        open={modalMoverFactura.open}
        onOpenChange={(open) =>
          setModalMoverFactura({
            open,
            item: open ? modalMoverFactura.item : null,
            factura: open ? modalMoverFactura.factura : null,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Factura</DialogTitle>
            <DialogDescription>
              Selecciona el Z-Report de destino para la factura {modalMoverFactura.factura?.cuentica_identifier}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {zreportsDisponibles.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay Z-Reports disponibles</p>
            ) : (
              zreportsDisponibles.map((z) => (
                <div
                  key={z.zreport_id}
                  onClick={() => setSelectedZReport(z.zreport_id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedZReport === z.zreport_id
                      ? "border-[#02b1c4] bg-[#02b1c4]/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{z.document_number}</p>
                      <p className="text-sm text-slate-500">{formatDateES(z.fecha_real)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatCurrencyES(z.total_amount)}</p>
                      <p className="text-xs text-slate-500">Dif: {formatCurrencyES(z.diferencia_actual)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalMoverFactura({ open: false, item: null, factura: null })}>
              Cancelar
            </Button>
            <Button onClick={handleMoverFactura} disabled={actionLoading || !selectedZReport}>
              Mover factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Añadir Factura */}
      <Dialog
        open={modalAnadirFactura.open}
        onOpenChange={(open) => setModalAnadirFactura({ open, item: open ? modalAnadirFactura.item : null })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Añadir Facturas</DialogTitle>
            <DialogDescription>
              Selecciona las facturas que quieres asociar al Z-Report {modalAnadirFactura.item?.zreport_documento}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {facturasHuerfanas.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Facturas sin asignar</h4>
                <div className="space-y-1">
                  {facturasHuerfanas.map((f) => (
                    <div
                      key={f.factura_id}
                      onClick={() => toggleFacturaSelection(f.factura_id)}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        selectedFacturas.has(f.factura_id)
                          ? "border-[#02b1c4] bg-[#02b1c4]/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedFacturas.has(f.factura_id)}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <div>
                            <p className="font-medium text-sm">{f.cuentica_identifier}</p>
                            <p className="text-xs text-slate-500">
                              {f.table_name || "Sin mesa"} · {formatDateES(f.invoice_date)}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">{formatCurrencyES(f.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {facturasAdyacentes.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Facturas de otros Z-Reports</h4>
                <div className="space-y-1">
                  {facturasAdyacentes.map((f) => (
                    <div
                      key={f.factura_id}
                      onClick={() => toggleFacturaSelection(f.factura_id)}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        selectedFacturas.has(f.factura_id)
                          ? "border-[#02b1c4] bg-[#02b1c4]/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedFacturas.has(f.factura_id)}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <div>
                            <p className="font-medium text-sm">{f.cuentica_identifier}</p>
                            <p className="text-xs text-slate-500">
                              {f.table_name || "Sin mesa"} · Actual: {f.zreport_actual_doc}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">{formatCurrencyES(f.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {facturasHuerfanas.length === 0 && facturasAdyacentes.length === 0 && (
              <p className="text-center py-8 text-slate-500">No hay facturas disponibles para añadir</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAnadirFactura({ open: false, item: null })}>
              Cancelar
            </Button>
            <Button onClick={handleAnadirFacturas} disabled={actionLoading || selectedFacturas.size === 0}>
              Añadir {selectedFacturas.size} factura{selectedFacturas.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
