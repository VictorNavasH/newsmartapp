"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Landmark,
  TrendingUp,
  ArrowDownLeft,
  Wallet,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { DateRangePickerExpenses } from "@/components/ui/date-range-picker-expenses"
import { MenuBar } from "@/components/ui/menu-bar"
import { useToast } from "@/hooks/use-toast"
import {
  fetchTreasuryKPIs,
  fetchTreasuryAccounts,
  fetchTreasuryTransactions,
  fetchTreasuryTransactionsSummary,
  fetchTreasuryCategories,
  updateTransactionCategory,
  fetchTreasuryByCategory,
  fetchPoolBancarioResumen,
  fetchPoolBancarioPrestamos,
  fetchPoolBancarioVencimientos,
  fetchPoolBancarioPorBanco,
  fetchPoolBancarioCalendario,
  fetchTreasuryMonthlySummary,
} from "@/lib/treasuryService"
import { formatCurrency } from "@/lib/utils"
import type {
  TreasuryKPIs,
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryTransactionsSummary,
  TreasuryCategory,
  TreasuryCategoryBreakdown,
  DateRange,
  PoolBancarioResumen,
  PoolBancarioPrestamo,
  PoolBancarioVencimiento,
  PoolBancarioPorBanco,
  PoolBancarioCalendarioMes,
  TreasuryMonthlySummary,
} from "@/types"
import { format, subMonths } from "date-fns"
import { PAGE_SIZE, calculateDelta, type TipoFilter } from "./treasury/constants"
import { TreasuryDashboardTab } from "./treasury/TreasuryDashboardTab"
import { TreasuryMovimientosTab } from "./treasury/TreasuryMovimientosTab"
import { TreasuryCategoriaTab } from "./treasury/TreasuryCategoriaTab"
import { TreasuryPoolBancarioTab } from "./treasury/TreasuryPoolBancarioTab"
import { TreasuryCuentaTab } from "./treasury/TreasuryCuentaTab"

export default function TreasuryPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("Dashboard")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // State
  const [kpis, setKpis] = useState<TreasuryKPIs | null>(null)
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([])
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([])
  const [transactionsSummary, setTransactionsSummary] = useState<TreasuryTransactionsSummary | null>(null)
  const [categories, setCategories] = useState<TreasuryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [categoryBreakdown, setCategoryBreakdown] = useState<TreasuryCategoryBreakdown[]>([])

  const [categoryTransactions, setCategoryTransactions] = useState<TreasuryTransaction[]>([])
  const [loadingCategoryTx, setLoadingCategoryTx] = useState(false)

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const [poolResumen, setPoolResumen] = useState<PoolBancarioResumen | null>(null)
  const [poolPrestamos, setPoolPrestamos] = useState<PoolBancarioPrestamo[]>([])
  const [poolVencimientos, setPoolVencimientos] = useState<PoolBancarioVencimiento[]>([])
  const [poolPorBanco, setPoolPorBanco] = useState<PoolBancarioPorBanco[]>([])
  const [poolCalendario, setPoolCalendario] = useState<PoolBancarioCalendarioMes[]>([])
  const [monthlySummaries, setMonthlySummaries] = useState<TreasuryMonthlySummary[]>([])

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
  const loadData = async () => {
    setLoading(true)
    try {
      const startStr = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
      const endStr = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

      const [kpisData, accountsData, categoriesData, byCategData, monthlySummaryData] = await Promise.all([
        fetchTreasuryKPIs(startStr, endStr),
        fetchTreasuryAccounts(),
        fetchTreasuryCategories(),
        fetchTreasuryByCategory(startStr, endStr),
        fetchTreasuryMonthlySummary(startStr, endStr),
      ])

      // Pool Bancario - cargar por separado para no bloquear si las vistas no existen
      let poolResumenData = null
      let poolPrestamosData: PoolBancarioPrestamo[] = []
      let poolVencimientosData: PoolBancarioVencimiento[] = []
      let poolPorBancoData: PoolBancarioPorBanco[] = []
      let poolCalendarioData: PoolBancarioCalendarioMes[] = []

      try {
        const poolResults = await Promise.all([
          fetchPoolBancarioResumen(),
          fetchPoolBancarioPrestamos(),
          fetchPoolBancarioVencimientos(10),
          fetchPoolBancarioPorBanco(),
          fetchPoolBancarioCalendario(12),
        ])
        poolResumenData = poolResults[0]
        poolPrestamosData = poolResults[1]
        poolVencimientosData = poolResults[2]
        poolPorBancoData = poolResults[3]
        poolCalendarioData = poolResults[4]
      } catch (poolErr) {
        console.warn("[v0] Pool Bancario views not available yet:", poolErr)
      }

      if (kpisData) setKpis(kpisData)
      setAccounts(accountsData)
      setCategories(categoriesData)
      setCategoryBreakdown(byCategData)
      setMonthlySummaries(monthlySummaryData || [])
      // Pool Bancario
      setPoolResumen(poolResumenData)
      setPoolPrestamos(poolPrestamosData)
      setPoolVencimientos(poolVencimientosData)
      setPoolPorBanco(poolPorBancoData)
      setPoolCalendario(poolCalendarioData)
    } catch (err) {
      console.error("[v0] Error loading treasury data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateRange])

  useEffect(() => {
    setPage(1)
  }, [dateRange, accountFilter, categoryFilter, tipoFilter, searchTerm])

  // Load KPIs and transactions when filters or page change
  useEffect(() => {
    const loadTransactionsData = async () => {
      setLoadingTransactions(true)

      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      const offset = (page - 1) * PAGE_SIZE

      const isUncategorized = categoryFilter === "uncategorized"
      const effectiveCategoryId = categoryFilter !== "all" && !isUncategorized ? categoryFilter : undefined
      const effectiveTipo = isUncategorized ? "sin_categorizar" : tipoFilter !== "all" ? tipoFilter : undefined

      const [kpisData, transactionsData, summaryData] = await Promise.all([
        fetchTreasuryKPIs(startDate, endDate),
        fetchTreasuryTransactions(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          effectiveCategoryId,
          effectiveTipo,
          searchTerm || undefined,
          PAGE_SIZE,
          offset,
        ),
        fetchTreasuryTransactionsSummary(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          effectiveCategoryId,
          effectiveTipo,
          searchTerm || undefined,
        ),
      ])

      setKpis(kpisData)
      setTransactions(transactionsData)
      setTransactionsSummary(summaryData)
      setTotalCount(summaryData?.num_transacciones || 0)
      setLoadingTransactions(false)
    }

    loadTransactionsData()
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

  const handleViewUncategorized = () => {
    setTipoFilter("sin_categorizar")
    setAccountFilter("all")
    setCategoryFilter("uncategorized")
    setSearchTerm("")
    setPage(1)
    setActiveTab("Movimientos")
    // Scroll to table after state update
    setTimeout(() => {
      const tableElement = document.getElementById("transactions-table")
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
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
    if (monthlySummaries.length === 0) return []

    return monthlySummaries.map((item) => ({
      month: item.mes,
      monthLabel: item.mes_label,
      ingresos: item.ingresos,
      gastos: item.gastos,
    }))
  }, [monthlySummaries])

  const topCategoriesData = useMemo(() => {
    const filtered = categoryBreakdown.filter((cat) => cat.category_id !== null && cat.total_gastos > 0)
    const sorted = filtered
      .sort((a, b) => b.total_gastos - a.total_gastos)
      .slice(0, 10)
      .map((cat) => ({
        name: cat.category_name || "Sin categoría",
        value: cat.total_gastos,
        percentage: cat.porcentaje_gastos || 0,
      }))
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

  const treasuryMenuItems = [
    {
      icon: TrendingUp,
      label: "Dashboard",
      href: "#",
      gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(23,195,178,0) 70%)",
      iconColor: "text-[#17c3b2]",
    },
    {
      icon: ArrowDownLeft,
      label: "Movimientos",
      href: "#",
      gradient: "radial-gradient(circle, rgba(34,124,157,0.15) 0%, rgba(34,124,157,0) 70%)",
      iconColor: "text-[#227c9d]",
    },
    {
      icon: Wallet,
      label: "Por Categoría",
      href: "#",
      gradient: "radial-gradient(circle, rgba(54,79,107,0.15) 0%, rgba(54,79,107,0) 70%)",
      iconColor: "text-[#364f6b]",
    },
    {
      icon: Landmark,
      label: "Pool Bancario",
      href: "#",
      gradient: "radial-gradient(circle, rgba(254,200,105,0.15) 0%, rgba(254,200,105,0) 70%)",
      iconColor: "text-[#fec869]",
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        icon={Landmark}
        title="Tesorería"
        subtitle="Control de cuentas bancarias y movimientos"
        actions={
          <DateRangePickerExpenses
            from={dateRange.from}
            to={dateRange.to}
            onChange={(range) => {
              if (range.from && range.to) {
                setDateRange({ from: range.from, to: range.to })
              }
            }}
          />
        }
      />

      <div className="flex justify-center mb-6">
        <MenuBar items={treasuryMenuItems} activeItem={activeTab} onItemClick={(label) => setActiveTab(label)} />
      </div>

      {/* TAB 1: Dashboard */}
      {activeTab === "Dashboard" && (
        <TreasuryDashboardTab
          kpis={kpis}
          accounts={accounts}
          loading={loading}
          ingresosDelta={ingresosDelta}
          gastosDelta={gastosDelta}
          balanceEvolutionData={balanceEvolutionData}
          monthlyData={monthlyData}
          topCategoriesWithPercentage={topCategoriesWithPercentage}
          uncategorizedData={uncategorizedData}
          onViewUncategorized={handleViewUncategorized}
        />
      )}

      {/* TAB 2: Movimientos */}
      {activeTab === "Movimientos" && (
        <TreasuryMovimientosTab
          transactions={transactions}
          transactionsSummary={transactionsSummary}
          accounts={accounts}
          flattenedCategories={flattenedCategories}
          loading={loading}
          loadingTransactions={loadingTransactions}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          tipoFilter={tipoFilter}
          setTipoFilter={setTipoFilter}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onCategoryUpdate={handleCategoryUpdate}
        />
      )}

      {/* TAB 3: Por Categoría */}
      {activeTab === "Por Categoría" && (
        <TreasuryCategoriaTab
          categoryBreakdown={categoryBreakdown}
          loading={loading}
          onNavigateToMovimientos={(categoryId) => {
            setCategoryFilter(categoryId)
            setActiveTab("Movimientos")
          }}
          onViewUncategorized={handleViewUncategorized}
        />
      )}

      {/* TAB 4: Pool Bancario */}
      {activeTab === "Pool Bancario" && (
        <TreasuryPoolBancarioTab
          poolResumen={poolResumen}
          poolPrestamos={poolPrestamos}
          poolVencimientos={poolVencimientos}
          poolPorBanco={poolPorBanco}
          poolCalendario={poolCalendario}
          loading={loading}
        />
      )}

      {/* TAB 5: Por Cuenta (accesible desde Dashboard) */}
      {activeTab === "Por Cuenta" && (
        <TreasuryCuentaTab
          accounts={accounts}
          loading={loading}
          onViewAccountMovements={(accountId) => {
            setAccountFilter(accountId)
            setActiveTab("Movimientos")
          }}
        />
      )}
    </div>
  )
}
