"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  PieChartIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Tag,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TremorCard } from "@/components/ui/TremorCard"
import { DateRangePickerExpenses } from "@/components/ui/date-range-picker-expenses"
import { ExportButton } from "@/components/ui/ExportButton"
import { MenuBar } from "@/components/ui/menu-bar"
import { exportToCSV, exportToPDF } from "@/lib/exportUtils"
import {
  fetchExpenseTags,
  fetchExpensesByTags,
  fetchExpenseSummaryByTags,
  fetchExpensesByDueDate,
} from "@/lib/dataService"
import { formatCurrency } from "@/lib/utils"
import type { ExpenseTag, Expense, ExpenseTagSummary, DateRange } from "@/types"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  parseISO,
} from "date-fns"

import { ExpensesCategoriaTab } from "./expenses/ExpensesCategoriaTab"
import { ExpensesProveedorTab } from "./expenses/ExpensesProveedorTab"
import { ExpensesCalendarioTab } from "./expenses/ExpensesCalendarioTab"
import { CATEGORY_COLORS, type StatusFilter, type ProviderStatusFilter, type ExpenseTab } from "./expenses/constants"

export default function ExpensesPage() {
  // State
  const [tags, setTags] = useState<ExpenseTag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseTagSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [sortColumn, setSortColumn] = useState<"fecha" | "total_amount" | "proveedor" | "due_date">("fecha")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [detailStatusFilter, setDetailStatusFilter] = useState<string>("all")
  const [detailCategoryFilter, setDetailCategoryFilter] = useState<string>("all")
  const [detailTagFilter, setDetailTagFilter] = useState<string>("all")

  const [activeTab, setActiveTab] = useState<ExpenseTab>("categoria")
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [providerStatusFilter, setProviderStatusFilter] = useState<ProviderStatusFilter>("all")

  // State for calendar
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [calendarExpenses, setCalendarExpenses] = useState<Expense[]>([])
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  // useRef para medir altura de tarjeta izquierda y aplicarla a la derecha
  const leftCardRef = useRef<HTMLDivElement>(null)
  const [rightCardHeight, setRightCardHeight] = useState<number | undefined>(undefined)

  const expenseMenuItems = [
    {
      icon: Tag,
      label: "Por Categoria",
      href: "#",
      gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(23,195,178,0) 70%)",
      iconColor: "text-[#17c3b2]",
    },
    {
      icon: Building2,
      label: "Por Proveedor",
      href: "#",
      gradient: "radial-gradient(circle, rgba(34,124,157,0.15) 0%, rgba(34,124,157,0) 70%)",
      iconColor: "text-[#227c9d]",
    },
    {
      icon: Calendar,
      label: "Calendario",
      href: "#",
      gradient: "radial-gradient(circle, rgba(255,203,119,0.15) 0%, rgba(255,203,119,0) 70%)",
      iconColor: "text-[#ffcb77]",
    },
  ]

  const handleExpenseMenuClick = (label: string) => {
    if (label === "Por Categoria") setActiveTab("categoria")
    else if (label === "Por Proveedor") setActiveTab("proveedor")
    else if (label === "Calendario") setActiveTab("calendario")
  }

  const getActiveMenuLabel = () => {
    if (activeTab === "categoria") return "Por Categoria"
    if (activeTab === "proveedor") return "Por Proveedor"
    return "Calendario"
  }

  // Data for pie chart
  const pieChartData = useMemo(() => {
    return summary.map((item, index) => ({
      name: item.tag_name,
      value: item.total,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
  }, [summary])

  const providerList = useMemo(() => {
    const providers = new Set<string>()
    expenses.forEach((expense) => {
      if (expense.proveedor) {
        providers.add(expense.proveedor)
      }
    })
    return Array.from(providers).sort()
  }, [expenses])

  const filteredProviderExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesProvider = selectedProvider === "all" || expense.proveedor === selectedProvider
      const matchesStatus = providerStatusFilter === "all" || expense.status === providerStatusFilter
      return matchesProvider && matchesStatus
    })
  }, [expenses, selectedProvider, providerStatusFilter])

  const providerSummary = useMemo(() => {
    const providerMap = new Map<
      string,
      { total: number; pagado: number; pendiente: number; vencido: number; facturas: number }
    >()

    filteredProviderExpenses.forEach((expense) => {
      const current = providerMap.get(expense.proveedor) || {
        total: 0,
        pagado: 0,
        pendiente: 0,
        vencido: 0,
        facturas: 0,
      }
      current.total += expense.total_amount
      current.facturas += 1

      if (expense.status === "partial") {
        current.pagado += expense.total_amount
      } else if (expense.status === "pending") {
        current.pendiente += expense.total_amount
      } else if (expense.status === "overdue") {
        current.vencido += expense.total_amount
      }

      providerMap.set(expense.proveedor, current)
    })

    return Array.from(providerMap.entries())
      .map(([proveedor, data]) => ({ proveedor, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [filteredProviderExpenses])

  const providerPieChartData = useMemo(() => {
    return providerSummary.map((item, index) => ({
      name: item.proveedor,
      value: item.total,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
  }, [providerSummary])

  // Medir altura de tarjeta izquierda
  useEffect(() => {
    if (!leftCardRef.current) return

    const measureHeight = () => {
      if (leftCardRef.current) {
        setRightCardHeight(leftCardRef.current.offsetHeight)
      }
    }

    measureHeight()

    const resizeObserver = new ResizeObserver(() => {
      measureHeight()
    })

    resizeObserver.observe(leftCardRef.current)
    return () => resizeObserver.disconnect()
  }, [summary, pieChartData])

  // Cargar tags al Montar
  useEffect(() => {
    const loadTags = async () => {
      const data = await fetchExpenseTags()
      setTags(data)
      setLoading(false)
    }
    loadTags()
  }, [])

  // Cargar gastos cuando cambian los filtros
  useEffect(() => {
    const loadExpenses = async () => {
      setLoadingExpenses(true)

      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      const status = statusFilter === "all" ? undefined : (statusFilter as "paid" | "pending" | "overdue")

      const [expensesData, summaryData] = await Promise.all([
        fetchExpensesByTags(selectedTags.length > 0 ? selectedTags : undefined, startDate, endDate, status),
        fetchExpenseSummaryByTags(selectedTags.length > 0 ? selectedTags : undefined, startDate, endDate),
      ])

      setExpenses(expensesData)
      setSummary(summaryData)
      setLoadingExpenses(false)
    }

    loadExpenses()
  }, [selectedTags, dateRange, statusFilter])

  // Cargar gastos para el calendario
  useEffect(() => {
    if (activeTab !== "calendario") return

    const loadCalendarExpenses = async () => {
      setLoadingCalendar(true)
      const startDate = format(startOfMonth(calendarMonth), "yyyy-MM-dd")
      const endDate = format(endOfMonth(calendarMonth), "yyyy-MM-dd")

      const data = await fetchExpensesByDueDate(startDate, endDate)
      setCalendarExpenses(data)
      setLoadingCalendar(false)
    }

    loadCalendarExpenses()
  }, [activeTab, calendarMonth])

  // Toggle tag selection
  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) => (prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]))
  }

  // Clear all tags
  const clearTags = () => {
    setSelectedTags([])
  }

  // Calculate totals from expenses
  const totals = useMemo(() => {
    const result = expenses.reduce(
      (acc, expense) => {
        acc.total += expense.total_amount
        if (expense.status === "partial") {
          acc.pagado += expense.total_amount
        } else if (expense.status === "pending") {
          acc.pendiente += expense.total_amount
        } else if (expense.status === "overdue") {
          acc.vencido += expense.total_amount
        }
        return acc
      },
      { total: 0, pagado: 0, pendiente: 0, vencido: 0, facturas: expenses.length },
    )
    return result
  }, [expenses])

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let comparison = 0
      switch (sortColumn) {
        case "fecha":
          comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          break
        case "total_amount":
          comparison = a.total_amount - b.total_amount
          break
        case "proveedor":
          comparison = a.proveedor.localeCompare(b.proveedor)
          break
        case "due_date":
          comparison = new Date(a.due_date || "").getTime() - new Date(b.due_date || "").getTime()
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [expenses, sortColumn, sortDirection])

  const filteredExpenses = useMemo(() => {
    return sortedExpenses.filter((expense) => {
      if (detailStatusFilter !== "all" && expense.status !== detailStatusFilter) {
        return false
      }
      if (detailCategoryFilter !== "all" && expense.categoria_nombre !== detailCategoryFilter) {
        return false
      }
      if (detailTagFilter !== "all") {
        const hasTag = expense.tags?.some((tag) => {
          let tagName = ""
          if (typeof tag === "string") {
            try {
              const parsed = JSON.parse(tag)
              tagName = parsed.name || tag
            } catch {
              tagName = tag
            }
          } else if (typeof tag === "object" && tag !== null) {
            tagName = (tag as { name: string }).name
          }
          return tagName === detailTagFilter
        })
        if (!hasTag) return false
      }
      return true
    })
  }, [sortedExpenses, detailStatusFilter, detailCategoryFilter, detailTagFilter])

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.total_amount, 0)
  }, [filteredExpenses])

  const hasActiveFilters = detailStatusFilter !== "all" || detailCategoryFilter !== "all" || detailTagFilter !== "all"

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    expenses.forEach((e) => {
      if (e.categoria_nombre) cats.add(e.categoria_nombre)
    })
    return Array.from(cats).sort()
  }, [expenses])

  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>()
    expenses.forEach((e) => {
      e.tags?.forEach((tag) => {
        let tagName = ""
        if (typeof tag === "string") {
          try {
            const parsed = JSON.parse(tag)
            tagName = parsed.name || tag
          } catch {
            tagName = tag
          }
        } else if (typeof tag === "object" && tag !== null) {
          tagName = (tag as { name: string }).name
        }
        if (tagName) tagsSet.add(tagName)
      })
    })
    return Array.from(tagsSet).sort()
  }, [expenses])

  // Handle sort
  const handleSort = (column: "fecha" | "total_amount" | "proveedor" | "due_date") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  // Handle date change
  const handleDateChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
  }

  // Function to get expenses for a specific day
  const getExpensesForDay = (day: Date): Expense[] => {
    return calendarExpenses.filter((expense) => {
      if (!expense.due_date) return false
      const dueDate = parseISO(expense.due_date)
      return isSameDay(dueDate, day)
    })
  }

  // Function to get the predominant status of a day
  const getDayStatus = (dayExpenses: Expense[]): "partial" | "pending" | "overdue" | null => {
    if (dayExpenses.length === 0) return null
    if (dayExpenses.some((e) => e.status === "overdue")) return "overdue"
    if (dayExpenses.some((e) => e.status === "pending")) return "pending"
    return "partial"
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days: Date[] = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [calendarMonth])

  // Calendar KPIs
  const calendarKPIs = useMemo(() => {
    const total = calendarExpenses.reduce((sum, e) => sum + e.total_amount, 0)
    const pagado = calendarExpenses.filter((e) => e.status === "partial").reduce((sum, e) => sum + e.total_amount, 0)
    const pendiente = calendarExpenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.total_amount, 0)
    const vencido = calendarExpenses.filter((e) => e.status === "overdue").reduce((sum, e) => sum + e.total_amount, 0)
    return { total, pagado, pendiente, vencido }
  }, [calendarExpenses])

  // Expenses for the selected day
  const selectedDayExpenses = useMemo(() => {
    if (!selectedDay) return []
    return getExpensesForDay(selectedDay)
  }, [selectedDay, calendarExpenses])

  // --- Exportación de datos ---
  const handleExpensesExportCSV = () => {
    const startStr = format(dateRange.from, "yyyy-MM-dd")
    const endStr = format(dateRange.to, "yyyy-MM-dd")

    if (activeTab === "proveedor") {
      // Exportar resumen por proveedor
      exportToCSV({
        filename: `nua-gastos-proveedores-${startStr}_${endStr}`,
        headers: ["Proveedor", "Total", "Pagado", "Pendiente", "Vencido", "Facturas"],
        rows: providerSummary.map((p) => [
          p.proveedor,
          p.total,
          p.pagado,
          p.pendiente,
          p.vencido,
          p.facturas,
        ]),
      })
    } else {
      // Exportar detalle de facturas
      exportToCSV({
        filename: `nua-gastos-detalle-${startStr}_${endStr}`,
        headers: ["Fecha", "Proveedor", "Categoría", "Estado", "Importe", "Base", "IVA", "Vencimiento"],
        rows: filteredExpenses.map((e) => [
          e.fecha,
          e.proveedor,
          e.categoria_nombre,
          e.status === "partial" ? "Pagado" : e.status === "pending" ? "Pendiente" : "Vencido",
          e.total_amount,
          e.base_amount,
          e.tax_amount,
          e.due_date || "",
        ]),
      })
    }
  }

  const handleExpensesExportPDF = async () => {
    const startStr = format(dateRange.from, "yyyy-MM-dd")
    const endStr = format(dateRange.to, "yyyy-MM-dd")

    if (activeTab === "proveedor") {
      await exportToPDF({
        filename: `nua-gastos-proveedores-${startStr}_${endStr}`,
        title: "Gastos — Por Proveedor",
        subtitle: `Periodo: ${dateRange.from.toLocaleDateString("es-ES")} - ${dateRange.to.toLocaleDateString("es-ES")}`,
        headers: ["Proveedor", "Total", "Pagado", "Pendiente", "Vencido", "Facturas"],
        rows: providerSummary.map((p) => [
          p.proveedor,
          formatCurrency(p.total),
          formatCurrency(p.pagado),
          formatCurrency(p.pendiente),
          formatCurrency(p.vencido),
          p.facturas,
        ]),
        orientation: "landscape",
        summary: [
          { label: "Total Gastos", value: formatCurrency(totals.total) },
          { label: "Pagado", value: formatCurrency(totals.pagado) },
          { label: "Pendiente", value: formatCurrency(totals.pendiente) },
          { label: "Vencido", value: formatCurrency(totals.vencido) },
        ],
      })
    } else {
      await exportToPDF({
        filename: `nua-gastos-detalle-${startStr}_${endStr}`,
        title: "Gastos — Detalle de Facturas",
        subtitle: `Periodo: ${dateRange.from.toLocaleDateString("es-ES")} - ${dateRange.to.toLocaleDateString("es-ES")}`,
        headers: ["Fecha", "Proveedor", "Categoría", "Estado", "Importe", "Vencimiento"],
        rows: filteredExpenses.map((e) => [
          e.fecha,
          e.proveedor.length > 30 ? e.proveedor.substring(0, 30) + "..." : e.proveedor,
          e.categoria_nombre,
          e.status === "partial" ? "Pagado" : e.status === "pending" ? "Pendiente" : "Vencido",
          formatCurrency(e.total_amount),
          e.due_date || "-",
        ]),
        orientation: "landscape",
        summary: [
          { label: "Total Gastos", value: formatCurrency(totals.total) },
          { label: "Facturas", value: String(totals.facturas) },
          { label: "Pagado", value: formatCurrency(totals.pagado) },
          { label: "Vencido", value: formatCurrency(totals.vencido) },
        ],
      })
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={PieChartIcon}
        title="Gastos"
        subtitle={`Analisis de gastos: ${dateRange.from.toLocaleDateString("es-ES")} - ${dateRange.to.toLocaleDateString("es-ES")}`}
        actions={
          <div className="flex items-center gap-3">
            <ExportButton onExportCSV={handleExpensesExportCSV} onExportPDF={handleExpensesExportPDF} />
            <DateRangePickerExpenses from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />
          </div>
        }
      />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Gastos */}
          <TremorCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#02b1c4]" />
                <h3 className="font-bold text-[#364f6b] text-base">Total Gastos</h3>
              </div>
              <div className="px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap bg-[#02b1c4]/20 text-[#02b1c4] border-[#02b1c4]/40">
                FACTURAS {totals.facturas}
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-[#364f6b]">{formatCurrency(totals.total)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-[#17c3b2]/10 border border-[#17c3b2]/20">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3 text-[#17c3b2]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Pagado</span>
                  <span className="text-[10px] font-bold text-slate-500 ml-auto">
                    {totals.total > 0 ? Math.round((totals.pagado / totals.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-sm font-bold text-[#364f6b] text-right">{formatCurrency(totals.pagado)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#ffcb77]/10 border border-[#ffcb77]/20">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-[#ffcb77]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Pendiente</span>
                  <span className="text-[10px] font-bold text-slate-500 ml-auto">
                    {totals.total > 0 ? Math.round((totals.pendiente / totals.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-sm font-bold text-[#364f6b] text-right">{formatCurrency(totals.pendiente)}</p>
              </div>
            </div>
          </TremorCard>

          {/* Pagado */}
          <TremorCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#17c3b2]" />
                <h3 className="font-bold text-[#364f6b] text-base">Pagado</h3>
              </div>
              <div className="px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap bg-[#17c3b2]/20 text-[#17c3b2] border-[#17c3b2]/40">
                {totals.total > 0 ? ((totals.pagado / totals.total) * 100).toFixed(1) : 0}% TOTAL
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-[#17c3b2]">{formatCurrency(totals.pagado)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3 text-[#17c3b2]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Facturas</span>
                </div>
                <p className="text-sm font-bold text-[#364f6b] text-right">
                  {expenses.filter((e) => e.status === "partial").length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-[#17c3b2]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Promedio</span>
                </div>
                <p className="text-sm font-bold text-[#364f6b] text-right">
                  {formatCurrency(
                    expenses.filter((e) => e.status === "partial").length > 0
                      ? totals.pagado / expenses.filter((e) => e.status === "partial").length
                      : 0,
                  )}
                </p>
              </div>
            </div>
          </TremorCard>

          {/* Vencido */}
          <TremorCard className={totals.vencido > 0 ? "border-l-4 border-l-[#fe6d73]" : ""}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#fe6d73]" />
                <h3 className="font-bold text-[#364f6b] text-base">Vencido</h3>
              </div>
              {totals.vencido > 0 ? (
                <div className="px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap bg-[#fe6d73]/20 text-[#fe6d73] border-[#fe6d73]/40">
                  ATENCION
                </div>
              ) : (
                <div className="px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap bg-[#17c3b2]/20 text-[#17c3b2] border-[#17c3b2]/40">
                  OK
                </div>
              )}
            </div>
            <div className="mb-4">
              <span className={`text-3xl font-bold ${totals.vencido > 0 ? "text-[#fe6d73]" : "text-[#364f6b]"}`}>
                {formatCurrency(totals.vencido)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-[#fe6d73]/10 border border-[#fe6d73]/20">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3 text-[#fe6d73]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Facturas</span>
                </div>
                <p className="text-sm font-bold text-[#364f6b] text-right">
                  {expenses.filter((e) => e.status === "overdue").length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[#ffcb77]/10 border border-[#ffcb77]/20">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-[#ffcb77]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Pendiente</span>
                </div>
                <p className="text-sm font-bold text-[#364f6b] text-right">{formatCurrency(totals.pendiente)}</p>
              </div>
            </div>
          </TremorCard>
        </div>

        <div className="flex justify-center mb-6">
          <MenuBar items={expenseMenuItems} activeItem={getActiveMenuLabel()} onItemClick={handleExpenseMenuClick} />
        </div>

        {activeTab === "categoria" && (
          <ExpensesCategoriaTab
            tags={tags}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
            clearTags={clearTags}
            loading={loading}
            loadingExpenses={loadingExpenses}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            pieChartData={pieChartData}
            summary={summary}
            totals={totals}
            leftCardRef={leftCardRef}
            rightCardHeight={rightCardHeight}
            filteredExpenses={filteredExpenses}
            filteredTotal={filteredTotal}
            hasActiveFilters={hasActiveFilters}
            detailStatusFilter={detailStatusFilter}
            setDetailStatusFilter={setDetailStatusFilter}
            detailCategoryFilter={detailCategoryFilter}
            setDetailCategoryFilter={setDetailCategoryFilter}
            detailTagFilter={detailTagFilter}
            setDetailTagFilter={setDetailTagFilter}
            uniqueCategories={uniqueCategories}
            uniqueTags={uniqueTags}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            expenses={expenses}
          />
        )}

        {activeTab === "proveedor" && (
          <ExpensesProveedorTab
            providerList={providerList}
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            providerStatusFilter={providerStatusFilter}
            setProviderStatusFilter={setProviderStatusFilter}
            filteredProviderExpenses={filteredProviderExpenses}
            providerPieChartData={providerPieChartData}
            providerSummary={providerSummary}
            totals={totals}
            rightCardHeight={rightCardHeight}
            loadingExpenses={loadingExpenses}
          />
        )}

        {activeTab === "calendario" && (
          <ExpensesCalendarioTab
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            calendarDays={calendarDays}
            calendarKPIs={calendarKPIs}
            loadingCalendar={loadingCalendar}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            selectedDayExpenses={selectedDayExpenses}
            getExpensesForDay={getExpensesForDay}
            getDayStatus={getDayStatus}
          />
        )}
      </div>
    </div>
  )
}
