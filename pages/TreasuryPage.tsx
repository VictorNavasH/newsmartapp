"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Search,
  AlertCircle,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { DateRangePickerExpenses } from "@/components/ui/date-range-picker-expenses"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  fetchTreasuryKPIs,
  fetchTreasuryAccounts,
  fetchTreasuryTransactions,
  fetchTreasuryTransactionsSummary,
  fetchTreasuryCategories,
  updateTransactionCategory,
  fetchTreasuryByCategory,
} from "@/lib/treasuryService"
import { BRAND_COLORS } from "@/constants"
import type {
  TreasuryKPIs,
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryTransactionsSummary,
  TreasuryCategory,
  TreasuryCategoryBreakdown,
  DateRange,
} from "@/types"
import { format, parseISO, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const PAGE_SIZE = 50

type TipoFilter = "all" | "ingreso" | "gasto" | "sin_categorizar"

const TIPO_LABELS: Record<TipoFilter, string> = {
  all: "Todos",
  ingreso: "Ingresos",
  gasto: "Gastos",
  sin_categorizar: "Sin categorizar",
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value)
}

const formatCurrencyCompact = (value: number): string => {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`
  }
  return `${value.toFixed(0)}€`
}

const formatIBAN = (iban: string): string => {
  if (!iban) return ""
  return `****${iban.slice(-4)}`
}

const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export default function TreasuryPage() {
  const { toast } = useToast()

  // State
  const [kpis, setKpis] = useState<TreasuryKPIs | null>(null)
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([])
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([])
  const [transactionsSummary, setTransactionsSummary] = useState<TreasuryTransactionsSummary | null>(null)
  const [categories, setCategories] = useState<TreasuryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [categoryBreakdown, setCategoryBreakdown] = useState<TreasuryCategoryBreakdown[]>([])

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const flattenedCategories = useMemo(() => {
    const result: { id: string; name: string; parentId?: string }[] = []
    categories.forEach((cat) => {
      result.push({ id: cat.id, name: cat.name })
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach((sub) => {
          result.push({ id: sub.id, name: `${cat.name} > ${sub.name}`, parentId: cat.id })
        })
      }
    })
    return result
  }, [categories])

  // Filters
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  })
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const hasActiveFilters =
    accountFilter !== "all" || categoryFilter !== "all" || tipoFilter !== "all" || searchTerm !== ""

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")

      const [kpisData, accountsData, categoriesData, categoryBreakdownData] = await Promise.all([
        fetchTreasuryKPIs(startDate, endDate),
        fetchTreasuryAccounts(),
        fetchTreasuryCategories(),
        fetchTreasuryByCategory(startDate, endDate),
      ])

      setKpis(kpisData)
      setAccounts(accountsData)
      setCategories(categoriesData)
      setCategoryBreakdown(categoryBreakdownData)
      setLoading(false)
    }

    loadInitialData()
  }, [dateRange])

  useEffect(() => {
    setPage(1)
  }, [dateRange, accountFilter, categoryFilter, tipoFilter, searchTerm])

  // Load KPIs and transactions when filters or page change
  useEffect(() => {
    const loadData = async () => {
      setLoadingTransactions(true)

      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      const offset = (page - 1) * PAGE_SIZE

      const [kpisData, transactionsData, summaryData] = await Promise.all([
        fetchTreasuryKPIs(startDate, endDate),
        fetchTreasuryTransactions(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          categoryFilter !== "all" ? categoryFilter : undefined,
          tipoFilter !== "all" ? tipoFilter : undefined,
          searchTerm || undefined,
          PAGE_SIZE,
          offset,
        ),
        fetchTreasuryTransactionsSummary(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          categoryFilter !== "all" ? categoryFilter : undefined,
          tipoFilter !== "all" ? tipoFilter : undefined,
          searchTerm || undefined,
        ),
      ])

      setKpis(kpisData)
      setTransactions(transactionsData)
      setTransactionsSummary(summaryData)
      setTotalCount(summaryData?.num_transacciones || 0)
      setLoadingTransactions(false)
    }

    loadData()
  }, [dateRange, accountFilter, categoryFilter, tipoFilter, searchTerm, page])

  const handleCategoryUpdate = async (transactionId: string, categoryId: string, subcategoryId?: string) => {
    const success = await updateTransactionCategory(transactionId, categoryId, subcategoryId)

    if (success) {
      toast({
        title: "Categoría actualizada",
        description: "La transacción ha sido categorizada correctamente.",
      })

      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      const offset = (page - 1) * PAGE_SIZE

      const [transactionsData, summaryData, kpisData, categoryBreakdownData] = await Promise.all([
        fetchTreasuryTransactions(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          categoryFilter !== "all" ? categoryFilter : undefined,
          tipoFilter !== "all" ? tipoFilter : undefined,
          searchTerm || undefined,
          PAGE_SIZE,
          offset,
        ),
        fetchTreasuryTransactionsSummary(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          categoryFilter !== "all" ? categoryFilter : undefined,
          tipoFilter !== "all" ? tipoFilter : undefined,
          searchTerm || undefined,
        ),
        fetchTreasuryKPIs(startDate, endDate),
        fetchTreasuryByCategory(startDate, endDate),
      ])
      setTransactions(transactionsData)
      setTransactionsSummary(summaryData)
      setTotalCount(summaryData?.num_transacciones || 0)
      setKpis(kpisData)
      setCategoryBreakdown(categoryBreakdownData)
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setAccountFilter("all")
    setCategoryFilter("all")
    setTipoFilter("all")
    setSearchTerm("")
    setPage(1)
  }

  const ingresosDelta = calculateDelta(kpis?.ingresos_periodo || 0, kpis?.ingresos_anterior || 0)
  const gastosDelta = calculateDelta(kpis?.gastos_periodo || 0, kpis?.gastos_anterior || 0)

  const balanceEvolutionData = useMemo(() => {
    if (transactions.length === 0) return []

    const dailyTotals: Record<string, number> = {}

    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime(),
    )

    sortedTx.forEach((tx) => {
      const date = tx.booking_date
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0
      }
      dailyTotals[date] += tx.amount
    })

    let cumulative = kpis?.saldo_total || 0
    const dates = Object.keys(dailyTotals).sort().reverse()
    const result: { date: string; saldo: number }[] = []

    dates.forEach((date) => {
      result.unshift({ date, saldo: cumulative })
      cumulative -= dailyTotals[date]
    })

    return result.slice(-30)
  }, [transactions, kpis])

  const monthlyData = useMemo(() => {
    if (transactions.length === 0) return []

    const monthlyTotals: Record<string, { ingresos: number; gastos: number }> = {}

    transactions.forEach((tx) => {
      const month = tx.booking_date.substring(0, 7)
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { ingresos: 0, gastos: 0 }
      }
      if (tx.amount > 0) {
        monthlyTotals[month].ingresos += tx.amount
      } else {
        monthlyTotals[month].gastos += Math.abs(tx.amount)
      }
    })

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        monthLabel: format(parseISO(`${month}-01`), "MMM", { locale: es }),
        ...data,
      }))
  }, [transactions])

  const topCategoriesData = useMemo(() => {
    console.log("[v0] categoryBreakdown raw:", JSON.stringify(categoryBreakdown))
    console.log("[v0] categoryBreakdown length:", categoryBreakdown.length)

    const filtered = categoryBreakdown.filter((cat) => cat.category_id !== null && cat.total_gastos > 0)
    console.log("[v0] After filter (category_id !== null && total_gastos > 0):", JSON.stringify(filtered))

    const sorted = filtered
      .sort((a, b) => b.total_gastos - a.total_gastos)
      .slice(0, 10)
      .map((cat) => ({
        name: cat.category_name || "Sin categoría",
        value: cat.total_gastos,
        percentage: cat.porcentaje_gastos || 0,
      }))

    console.log("[v0] topCategoriesData final:", JSON.stringify(sorted))
    return sorted
  }, [categoryBreakdown])

  const uncategorizedData = useMemo(() => {
    const uncategorized = categoryBreakdown.find((cat) => cat.category_id === null)
    return {
      totalGastos: uncategorized?.total_gastos || 0,
      totalIngresos: uncategorized?.total_ingresos || 0,
      numTransacciones: uncategorized?.num_transacciones || 0,
    }
  }, [categoryBreakdown])

  const topCategoriesWithPercentage = useMemo(() => {
    const total = topCategoriesData.reduce((sum, cat) => sum + cat.value, 0)
    return topCategoriesData.map((cat) => ({
      ...cat,
      percentage: total > 0 ? (cat.value / total) * 100 : 0,
    }))
  }, [topCategoriesData])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader icon={Landmark} title="Tesorería" subtitle="Control de cuentas bancarias y movimientos" />

      {/* Date Range Picker */}
      <div className="flex justify-end">
        <DateRangePickerExpenses
          from={dateRange.from}
          to={dateRange.to}
          onChange={(range) => {
            if (range.from && range.to) {
              setDateRange({ from: range.from, to: range.to })
            }
          }}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Saldo Total</p>
              <p className="text-2xl font-bold text-slate-800">
                {loading ? "..." : formatCurrency(kpis?.saldo_total || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {kpis?.num_cuentas || 0} cuenta{kpis?.num_cuentas !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
              <Landmark className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
            </div>
          </div>
        </TremorCard>

        {/* Ingresos */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Ingresos</p>
              <p className="text-2xl font-bold text-slate-800">
                {loading ? "..." : formatCurrency(kpis?.ingresos_periodo || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {ingresosDelta >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${ingresosDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {ingresosDelta >= 0 ? "+" : ""}
                  {ingresosDelta.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">vs periodo anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.success}15` }}>
              <TrendingUp className="h-5 w-5" style={{ color: BRAND_COLORS.success }} />
            </div>
          </div>
        </TremorCard>

        {/* Gastos */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Gastos</p>
              <p className="text-2xl font-bold text-slate-800">
                {loading ? "..." : formatCurrency(kpis?.gastos_periodo || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {gastosDelta <= 0 ? (
                  <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${gastosDelta <= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {gastosDelta >= 0 ? "+" : ""}
                  {gastosDelta.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">vs periodo anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.error}15` }}>
              <TrendingDown className="h-5 w-5" style={{ color: BRAND_COLORS.error }} />
            </div>
          </div>
        </TremorCard>

        {/* Sin Categorizar */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Sin Categorizar</p>
              <p className="text-2xl font-bold text-slate-800">
                {loading ? "..." : uncategorizedData.numTransacciones}
              </p>
              <p className="text-xs text-slate-400 mt-1">transacciones pendientes</p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.warning}15` }}>
              <Minus className="h-5 w-5 text-slate-400" />
            </div>
          </div>
          {uncategorizedData.numTransacciones > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-xs bg-transparent"
              style={{ borderColor: BRAND_COLORS.warning, color: BRAND_COLORS.warning }}
              onClick={() => setTipoFilter("sin_categorizar")}
            >
              Categorizar pendientes
            </Button>
          )}
        </TremorCard>
      </div>

      {/* Cuentas Bancarias */}
      <TremorCard title="Cuentas Bancarias" icon={<Building2 className="h-5 w-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {loading ? (
            <p className="text-slate-400 col-span-full text-center py-8">Cargando cuentas...</p>
          ) : accounts.length === 0 ? (
            <p className="text-slate-400 col-span-full text-center py-8">No hay cuentas configuradas</p>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {account.bank_logo ? (
                      <img
                        src={account.bank_logo || "/placeholder.svg"}
                        alt={account.bank_name}
                        className="h-8 w-8 object-contain rounded"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-slate-400" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{account.bank_name}</p>
                      <p className="text-xs text-slate-500">{formatIBAN(account.iban)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xl font-bold text-slate-800">{formatCurrency(account.balance)}</p>
                  {account.last_sync && (
                    <p className="text-xs text-slate-400 mt-1">
                      Sync: {format(new Date(account.last_sync), "dd MMM HH:mm", { locale: es })}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </TremorCard>

      {uncategorizedData.numTransacciones > 0 && (
        <TremorCard className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {uncategorizedData.numTransacciones.toLocaleString("es-ES")} transacciones pendientes de categorizar
                </h3>
                <p className="text-sm text-gray-600">
                  {formatCurrency(uncategorizedData.totalGastos)} en gastos ·{" "}
                  {formatCurrency(uncategorizedData.totalIngresos)} en ingresos
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-100 bg-transparent"
              onClick={() => {
                setTipoFilter("sin_categorizar")
                setPage(1)
              }}
            >
              Ver pendientes
            </Button>
          </div>
        </TremorCard>
      )}

      {/* Graficos */}
      {/* Evolución del Saldo */}
      <TremorCard>
        <TremorTitle>Evolución del Saldo</TremorTitle>
        <div className="h-[300px] mt-4">
          {balanceEvolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(parseISO(v), "dd MMM", { locale: es })}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tickFormatter={formatCurrencyCompact}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null
                    return (
                      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                        <p className="text-sm font-bold text-slate-700 mb-2">
                          {format(parseISO(label), "EEEE, d MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-sm">
                          Saldo:{" "}
                          <span className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                            {formatCurrency(payload[0]?.value as number)}
                          </span>
                        </p>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke={BRAND_COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: BRAND_COLORS.primary, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              No hay datos suficientes para mostrar el gráfico
            </div>
          )}
        </div>
      </TremorCard>

      {/* Ingresos vs Gastos + Top Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Gastos por Mes */}
        <TremorCard>
          <TremorTitle>Ingresos vs Gastos por Mes</TremorTitle>
          <div className="h-[300px] mt-4">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tickFormatter={formatCurrencyCompact}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-2 capitalize">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm">
                              <span
                                className="inline-block w-3 h-3 rounded mr-2"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}: <span className="font-bold">{formatCurrency(entry.value)}</span>
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" fill={BRAND_COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill={BRAND_COLORS.error} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No hay datos para mostrar</div>
            )}
          </div>
        </TremorCard>

        {/* Top Categorías de Gasto */}
        <TremorCard>
          <TremorTitle>Top Categorías de Gasto</TremorTitle>
          <div className="h-[300px] mt-4">
            {topCategoriesWithPercentage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategoriesWithPercentage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatCurrencyCompact}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    width={120}
                    tickFormatter={(v) => (v.length > 15 ? `${v.substring(0, 15)}...` : v)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                          <p className="text-sm font-bold text-slate-700 mb-1">{data.name}</p>
                          <p className="text-sm">
                            Total: <span className="font-bold">{formatCurrency(data.value)}</span>
                          </p>
                          <p className="text-xs text-slate-500">{data.percentage.toFixed(1)}% del total</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="value" fill={BRAND_COLORS.primary} radius={[0, 4, 4, 0]}>
                    {topCategoriesWithPercentage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? BRAND_COLORS.success : BRAND_COLORS.error} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No hay datos para mostrar</div>
            )}
          </div>
        </TremorCard>
      </div>

      {/* Tabla de Transacciones */}
      <TremorCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TremorTitle>Movimientos</TremorTitle>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Busqueda */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-[180px]"
              />
            </div>

            {/* Cuenta */}
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.bank_name} {formatIBAN(account.iban)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Categoria */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {flattenedCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
              <SelectTrigger className="h-9 w-[150px]">
                <ChevronDown className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Resumen filtrado */}
        {transactionsSummary && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Transacciones:</span>
              <span className="font-medium">{transactionsSummary.num_transacciones}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Ingresos:</span>
              <span className="font-medium text-emerald-600">{formatCurrency(transactionsSummary.total_ingresos)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Gastos:</span>
              <span className="font-medium text-red-600">{formatCurrency(transactionsSummary.total_gastos)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Balance:</span>
              <span
                className={`font-medium ${(transactionsSummary.total_ingresos - transactionsSummary.total_gastos) >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {formatCurrency(transactionsSummary.total_ingresos - transactionsSummary.total_gastos)}
              </span>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-500">Fecha</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Cuenta</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Descripción</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Categoría</th>
                <th className="text-right py-3 px-2 font-medium text-slate-500">Importe</th>
              </tr>
            </thead>
            <tbody>
              {loadingTransactions ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No hay movimientos en el periodo seleccionado
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <span className="text-slate-600">
                        {format(new Date(tx.booking_date), "dd MMM yyyy", { locale: es })}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {tx.bank_logo ? (
                          <img
                            src={tx.bank_logo || "/placeholder.svg"}
                            alt={tx.bank_name}
                            className="h-6 w-6 object-contain rounded"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-slate-400" />
                        )}
                        <span className="text-sm">{tx.account_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 max-w-[300px]">
                      <p className="text-slate-800 truncate">{tx.description}</p>
                      {tx.counterparty_name && (
                        <p className="text-xs text-slate-400 truncate">{tx.counterparty_name}</p>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {tx.category_name ? (
                        <Badge variant="outline" className="text-xs">
                          {tx.category_name}
                          {tx.subcategory_name && ` / ${tx.subcategory_name}`}
                        </Badge>
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            const cat = flattenedCategories.find((c) => c.id === value)
                            if (cat) {
                              handleCategoryUpdate(tx.id, cat.parentId || cat.id, cat.parentId ? cat.id : undefined)
                            }
                          }}
                        >
                          <SelectTrigger
                            className="h-7 w-[140px] text-xs"
                            style={{ borderColor: BRAND_COLORS.warning, color: BRAND_COLORS.warning }}
                          >
                            <SelectValue placeholder="Categorizar" />
                          </SelectTrigger>
                          <SelectContent>
                            {flattenedCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-medium ${tx.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {tx.amount >= 0 ? "+" : ""}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-slate-600 px-2">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </TremorCard>
    </div>
  )
}
