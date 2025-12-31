"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  PieChartIcon,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Receipt,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { DateRangePickerExpenses } from "@/components/ui/date-range-picker-expenses"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MenuBar } from "@/components/ui/menu-bar"
import { fetchExpenseTags, fetchExpensesByTags, fetchExpenseSummaryByTags } from "@/lib/dataService"
import { BRAND_COLORS } from "@/constants"
import type { ExpenseTag, Expense, ExpenseTagSummary, DateRange } from "@/types"
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Tooltip as RechartsTooltip } from "recharts"
import { format, startOfMonth } from "date-fns"

type StatusFilter = "all" | "partial" | "pending" | "overdue"
type ProviderStatusFilter = "all" | "partial" | "pending" | "overdue"

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  partial: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
}

const STATUS_COLORS: Record<string, string> = {
  partial: "#17c3b2",
  pending: BRAND_COLORS.warning,
  overdue: BRAND_COLORS.error,
}

// Colores para el gráfico de categorías
const CATEGORY_COLORS = [
  BRAND_COLORS.primary,
  BRAND_COLORS.accent,
  "#49eada",
  BRAND_COLORS.lunch,
  BRAND_COLORS.error,
  "#8b5cf6",
  "#ec4899",
  "#f97316",
]

type ExpenseTab = "categoria" | "proveedor"

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

  // useRef para medir altura de tarjeta izquierda y aplicarla a la derecha
  const leftCardRef = useRef<HTMLDivElement>(null)
  const [rightCardHeight, setRightCardHeight] = useState<number | undefined>(undefined)

  const expenseMenuItems = [
    {
      icon: Tag,
      label: "Por Categoría",
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
  ]

  const handleExpenseMenuClick = (label: string) => {
    if (label === "Por Categoría") setActiveTab("categoria")
    else if (label === "Por Proveedor") setActiveTab("proveedor")
  }

  const getActiveMenuLabel = () => {
    if (activeTab === "categoria") return "Por Categoría"
    return "Por Proveedor"
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
      const status = statusFilter === "all" ? undefined : statusFilter

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
      // Filtro por estado
      if (detailStatusFilter !== "all" && expense.status !== detailStatusFilter) {
        return false
      }
      // Filtro por categoría
      if (detailCategoryFilter !== "all" && expense.categoria_nombre !== detailCategoryFilter) {
        return false
      }
      // Filtro por tag
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

  // Format currency
  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = value ?? 0
    return safeValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
  }

  // Handle date change
  const handleDateChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={PieChartIcon}
        title="Gastos"
        subtitle={`Análisis de gastos: ${dateRange.from.toLocaleDateString("es-ES")} - ${dateRange.to.toLocaleDateString("es-ES")}`}
        actions={<DateRangePickerExpenses from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />}
      />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Gastos con desglose por estado */}
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

          {/* Pagado - destacado */}
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

          {/* Vencido - con alerta */}
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

        {/* TAB: Por Categoría */}
        {activeTab === "categoria" && (
          <div className="space-y-6">
            {/* Selector de Tags */}
            <TremorCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#17c3b2]" />
                  <TremorTitle>Filtrar por Categorías</TremorTitle>
                </div>
                {selectedTags.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearTags} className="text-slate-500 hover:text-slate-700">
                    <X className="w-4 h-4 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex gap-2 flex-wrap">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.tag_name)
                    return (
                      <button
                        key={tag.tag_name}
                        onClick={() => toggleTag(tag.tag_name)}
                        className={`
                          px-4 py-2 rounded-full text-sm font-medium transition-all
                          flex items-center gap-2
                          ${isSelected ? "bg-[#17c3b2] text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}
                        `}
                      >
                        {tag.tag_name}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}
                        >
                          {tag.num_gastos}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </TremorCard>

            {/* Filtro de Estado */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Estado:</span>
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gráficos de Categoría */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div ref={leftCardRef}>
                <TremorCard>
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartIcon className="h-5 w-5 text-[#17c3b2]" />
                    <TremorTitle>Distribución por Categoría</TremorTitle>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieChartData}
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
                            const total = pieChartData.reduce((sum, d) => sum + d.value, 0)
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
                    {pieChartData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-600">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </TremorCard>
              </div>

              <div style={{ height: rightCardHeight ? `${rightCardHeight}px` : "auto" }} className="overflow-hidden">
                <TremorCard className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                    <Tag className="h-5 w-5 text-[#17c3b2]" />
                    <TremorTitle>Resumen por Categoría</TremorTitle>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
                    {summary.map((cat, index) => {
                      const percentage = totals.total > 0 ? (cat.total / totals.total) * 100 : 0
                      const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                      return (
                        <div key={cat.tag_name} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                              <span className="font-medium text-slate-700">{cat.tag_name}</span>
                            </div>
                            <span className="font-bold text-slate-800">{formatCurrency(cat.total)}</span>
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
                            <span>{cat.num_facturas} facturas</span>
                            <span className="text-[#17c3b2]">Pagado: {formatCurrency(cat.pagado)}</span>
                            <span className="text-[#ffcb77]">Pendiente: {formatCurrency(cat.pendiente)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TremorCard>
              </div>
            </div>

            {/* Tabla de Gastos */}
            <TremorCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#17c3b2]" />
                  <TremorTitle>Detalle de Gastos</TremorTitle>
                </div>
                <div className="flex items-center gap-4">
                  {hasActiveFilters && (
                    <span className="text-sm font-medium text-[#02b1c4]">Total: {formatCurrency(filteredTotal)}</span>
                  )}
                  <span className="text-sm text-slate-500">{filteredExpenses.length} resultados</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Filtros:</span>
                </div>

                {/* Filtro Estado */}
                <Select value={detailStatusFilter} onValueChange={setDetailStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="partial">Pagado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro Categoría */}
                <Select value={detailCategoryFilter} onValueChange={setDetailCategoryFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro Tag */}
                <Select value={detailTagFilter} onValueChange={setDetailTagFilter}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tags</SelectItem>
                    {uniqueTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Botón limpiar filtros */}
                {(detailStatusFilter !== "all" || detailCategoryFilter !== "all" || detailTagFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDetailStatusFilter("all")
                      setDetailCategoryFilter("all")
                      setDetailTagFilter("all")
                    }}
                    className="text-slate-500 hover:text-slate-700 h-9"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>

              {loadingExpenses ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded" />
                  ))}
                </div>
              ) : filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th
                          className="text-left p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort("fecha")}
                        >
                          <div className="flex items-center gap-1">
                            Fecha
                            {sortColumn === "fecha" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort("proveedor")}
                        >
                          <div className="flex items-center gap-1">
                            Proveedor
                            {sortColumn === "proveedor" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th className="text-left p-3 font-semibold text-slate-600">Documento</th>
                        <th className="text-left p-3 font-semibold text-slate-600">Categoría</th>
                        <th className="text-left p-3 font-semibold text-slate-600">Tags</th>
                        <th
                          className="text-right p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort("total_amount")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Importe
                            {sortColumn === "total_amount" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort("due_date")}
                        >
                          <div className="flex items-center gap-1">
                            Vencimiento
                            {sortColumn === "due_date" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold text-slate-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-700">
                            {new Date(expense.fecha).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-700">{expense.proveedor}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">{expense.document_number || "-"}</td>
                          <td className="p-3 text-slate-600">{expense.categoria_nombre}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {expense.tags?.map((tag, index) => {
                                let tagObj: { name: string; normalized_name: string } | null = null
                                if (typeof tag === "string") {
                                  try {
                                    tagObj = JSON.parse(tag)
                                  } catch {
                                    tagObj = null
                                  }
                                } else if (typeof tag === "object" && tag !== null) {
                                  tagObj = tag as { name: string; normalized_name: string }
                                }
                                const tagName = tagObj?.name || String(tag)
                                return (
                                  <Badge
                                    key={tagObj?.normalized_name || index}
                                    variant="secondary"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: `${BRAND_COLORS.primary}20`,
                                      color: BRAND_COLORS.primary,
                                    }}
                                  >
                                    {tagName}
                                  </Badge>
                                )
                              })}
                            </div>
                          </td>
                          <td className="p-3 text-right font-semibold text-[#364f6b]">
                            {formatCurrency(expense.total_amount)}
                          </td>
                          <td className="p-3 text-slate-600">
                            {expense.due_date ? (
                              <span
                                className={
                                  new Date(expense.due_date) < new Date() && expense.status !== "partial"
                                    ? "text-red-500 font-medium"
                                    : ""
                                }
                              >
                                {new Date(expense.due_date).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              style={{
                                backgroundColor: `${STATUS_COLORS[expense.status]}20`,
                                color: STATUS_COLORS[expense.status],
                              }}
                            >
                              {STATUS_LABELS[expense.status] || expense.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay gastos que coincidan con los filtros seleccionados</p>
                </div>
              )}
            </TremorCard>
          </div>
        )}

        {/* TAB: Por Proveedor */}
        {activeTab === "proveedor" && (
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

              {/* Resumen de filtros activos */}
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
              {/* Distribución por Proveedor */}
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
                                <span className="text-lg">🥇</span>
                              ) : index === 1 ? (
                                <span className="text-lg">🥈</span>
                              ) : index === 2 ? (
                                <span className="text-lg">🥉</span>
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
        )}
      </div>
    </div>
  )
}
