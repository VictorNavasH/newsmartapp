"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Landmark,
  TrendingUp,
  ArrowDownLeft,
  Wallet,
  Building2,
  RefreshCw,
  Plus,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { DateRangePickerExpenses } from "@/components/ui/date-range-picker-expenses"
import { ExportButton } from "@/components/ui/ExportButton"
import { MenuBar } from "@/components/ui/menu-bar"
import { exportToCSV, exportToPDF } from "@/lib/exportUtils"
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
import {
  fetchConsentStatus,
  triggerAccountSync,
  getGoCardlessAppUrl,
  fetchInstitutions,
  createRequisition,
  pollRequisitionStatus,
  fetchRequisitionAccounts,
  triggerInitialSync,
  fetchSyncStatus,
} from "@/lib/bankConnectionsService"
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
  BankConsentInfo,
  BankConnectState,
  BankInstitution,
  BankConnectedAccount,
  SyncStatus,
} from "@/types"
import { format, subMonths } from "date-fns"
import { PAGE_SIZE, calculateDelta, type TipoFilter } from "./treasury/constants"
import { TreasuryDashboardTab } from "./treasury/TreasuryDashboardTab"
import { TreasuryMovimientosTab } from "./treasury/TreasuryMovimientosTab"
import { TreasuryCategoriaTab } from "./treasury/TreasuryCategoriaTab"
import { TreasuryPoolBancarioTab } from "./treasury/TreasuryPoolBancarioTab"
import { TreasuryCuentaTab } from "./treasury/TreasuryCuentaTab"
import { BankConnectSheet } from "./bankConnections/BankConnectSheet"

// Estado inicial del flujo de conexion
const INITIAL_CONNECT_STATE: BankConnectState = {
  step: "idle",
  institutions: [],
  selectedInstitution: null,
  reference: null,
  authLink: null,
  error: null,
  connectedAccounts: [],
}

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

  // GoCardless / Bank Connections State
  const [consentInfo, setConsentInfo] = useState<BankConsentInfo | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const [connectSheetOpen, setConnectSheetOpen] = useState(false)
  const [connectState, setConnectState] = useState<BankConnectState>(INITIAL_CONNECT_STATE)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goCardlessAppUrl = getGoCardlessAppUrl()

  // Detectar si venimos de un callback de GoCardless
  useEffect(() => {
    if (typeof window === "undefined") return

    // Caso 1: Signal de activacion de tab (desde app/page.tsx)
    const activateTab = sessionStorage.getItem("gocardless_activate_tab")
    if (activateTab === "Conexiones") {
      sessionStorage.removeItem("gocardless_activate_tab")
      setActiveTab("Dashboard") // Ahora mostramos en Dashboard
    }

    // Caso 2: Referencia guardada para reanudar polling
    const savedRef = sessionStorage.getItem("gocardless_ref")
    if (savedRef) {
      setConnectState({
        ...INITIAL_CONNECT_STATE,
        step: "processing",
        reference: savedRef,
      })
      setConnectSheetOpen(true)
      startPolling(savedRef)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

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

      const [kpisData, accountsData, categoriesData, byCategData, monthlySummaryData, consentData, syncStatusData] =
        await Promise.all([
          fetchTreasuryKPIs(startStr, endStr),
          fetchTreasuryAccounts(),
          fetchTreasuryCategories(),
          fetchTreasuryByCategory(startStr, endStr),
          fetchTreasuryMonthlySummary(startStr, endStr),
          fetchConsentStatus(),
          fetchSyncStatus(),
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
      setConsentInfo(consentData)
      setSyncStatus(syncStatusData)
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

  // --- SYNC / CONNECT HANDLERS ---

  const handleSyncAccount = async (accountId: string) => {
    // Si es "all", sincronizar todas las cuentas secuencialmente
    if (accountId === "all") {
      if (accounts.length === 0) return
      setSyncingAccountId("all")
      let totalTx = 0
      let errors = 0
      try {
        for (const account of accounts) {
          try {
            const result = await triggerAccountSync(account.id)
            if (result.success && result.synced?.transactions) {
              totalTx += result.synced.transactions
            }
          } catch {
            errors++
          }
        }
        await loadData()
        toast({
          title: errors === 0 ? "Sincronización completada" : "Sincronización parcial",
          description: errors === 0
            ? `${accounts.length} cuentas sincronizadas, ${totalTx} transacciones`
            : `${accounts.length - errors}/${accounts.length} cuentas sincronizadas`,
          variant: errors > 0 ? "destructive" : "default",
        })
      } catch {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servicio de sincronización",
          variant: "destructive",
        })
      } finally {
        setSyncingAccountId(null)
      }
      return
    }

    // Sincronizar una cuenta individual
    setSyncingAccountId(accountId)
    try {
      const result = await triggerAccountSync(accountId)
      if (result.success) {
        toast({
          title: "Sincronización completada",
          description: result.synced
            ? `${result.synced.transactions} transacciones nuevas`
            : result.message,
        })
        await loadData()
      } else {
        toast({
          title: "Error al sincronizar",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servicio de sincronización",
        variant: "destructive",
      })
    } finally {
      setSyncingAccountId(null)
    }
  }

  const handleConnectBank = useCallback(async () => {
    setConnectState({
      ...INITIAL_CONNECT_STATE,
      step: "selecting",
    })
    setConnectSheetOpen(true)

    const institutions = await fetchInstitutions("ES")
    setConnectState((prev) => ({
      ...prev,
      institutions,
    }))
  }, [])

  const handleRenewConsent = useCallback(
    async (institutionId: string) => {
      if (!institutionId) {
        handleConnectBank()
        return
      }

      setConnectState({
        ...INITIAL_CONNECT_STATE,
        step: "selecting",
      })
      setConnectSheetOpen(true)

      const institutions = await fetchInstitutions("ES")
      setConnectState((prev) => ({
        ...prev,
        institutions,
      }))

      const targetInst = institutions.find(
        (inst) => inst.id === institutionId || inst.gocardless_id === institutionId,
      )
      if (targetInst) {
        handleSelectInstitution(targetInst)
      }
    },
    [handleConnectBank],
  )

  const handleSelectInstitution = async (institution: BankInstitution) => {
    setConnectState((prev) => ({
      ...prev,
      step: "creating",
      selectedInstitution: institution,
    }))

    const reference = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const redirectUrl = `${origin}/?gocardless_callback=true`

    const result = await createRequisition(
      institution.gocardless_id || institution.id,
      redirectUrl,
      reference,
    )

    if (!result.success || !result.link) {
      setConnectState((prev) => ({
        ...prev,
        step: "error",
        error: result.error || "No se pudo crear la solicitud de conexion",
      }))
      return
    }

    setConnectState((prev) => ({
      ...prev,
      step: "redirecting",
      reference: result.reference || reference,
      authLink: result.link || null,
    }))

    if (typeof window !== "undefined") {
      sessionStorage.setItem("gocardless_ref", result.reference || reference)
    }

    try {
      window.open(result.link, "_blank")
    } catch {
      console.warn("[TreasuryPage] No se pudo abrir ventana emergente")
    }
  }

  const handleManualComplete = useCallback(() => {
    const reference = connectState.reference
    if (!reference) return
    startPolling(reference)
  }, [connectState.reference])

  const startPolling = useCallback(async (reference: string) => {
    setConnectState((prev) => ({ ...prev, step: "processing" }))

    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    let attempts = 0
    const maxAttempts = 30

    const poll = async () => {
      attempts++
      const status = await pollRequisitionStatus(reference)

      if (!status) {
        if (attempts >= maxAttempts) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          pollingRef.current = null
          setConnectState((prev) => ({
            ...prev,
            step: "error",
            error: "Tiempo de espera agotado. Intenta de nuevo.",
          }))
        }
        return
      }

      if (status.status === "LN" || status.status === "GC") {
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = null

        setConnectState((prev) => ({ ...prev, step: "fetching" }))
        const accounts = await fetchRequisitionAccounts(reference)

        if (accounts.length === 0) {
          setConnectState((prev) => ({
            ...prev,
            step: "error",
            error: "No se encontraron cuentas asociadas a la autorizacion",
          }))
          return
        }

        setConnectState((prev) => ({
          ...prev,
          step: "syncing",
          connectedAccounts: accounts,
        }))

        await triggerInitialSync(accounts)
        setConnectState((prev) => ({ ...prev, step: "success" }))

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("gocardless_ref")
        }
      } else if (status.status === "RJ" || status.status === "EX") {
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = null
        setConnectState((prev) => ({
          ...prev,
          step: "error",
          error:
            status.status === "RJ"
              ? "La autorizacion fue rechazada por el banco"
              : "La solicitud de autorizacion ha expirado",
        }))
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("gocardless_ref")
        }
      } else if (attempts >= maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = null
        setConnectState((prev) => ({
          ...prev,
          step: "error",
          error: "Tiempo de espera agotado.",
        }))
      }
    }

    await poll()
    if (connectState.step !== "success" && connectState.step !== "error" && !pollingRef.current) {
      pollingRef.current = setInterval(poll, 2000)
    }
  }, [])

  const handleRetry = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setConnectState({
      ...INITIAL_CONNECT_STATE,
      step: "selecting",
      institutions: connectState.institutions,
    })
  }, [connectState.institutions])

  const handleCloseConnect = useCallback(async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    const wasSuccess = connectState.step === "success"
    setConnectSheetOpen(false)
    setConnectState(INITIAL_CONNECT_STATE)

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("gocardless_ref")
    }

    if (wasSuccess) {
      await loadData()
    }
  }, [connectState.step])

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
      gradient: "radial-gradient(circle, rgba(255,203,119,0.15) 0%, rgba(255,203,119,0) 70%)",
      iconColor: "text-[#ffcb77]",
    },
  ]

  // --- Exportación de datos ---
  const handleTreasuryExportCSV = () => {
    if (activeTab === "Movimientos" && transactions.length > 0) {
      // Exportar movimientos
      exportToCSV({
        filename: `nua-tesoreria-movimientos-${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}`,
        headers: ["Fecha", "Cuenta", "Banco", "Descripción", "Categoría", "Importe", "Moneda"],
        rows: transactions.map((tx) => [
          tx.booking_date,
          tx.account_name,
          tx.bank_name,
          tx.description,
          tx.category_name || "Sin categoría",
          tx.amount,
          tx.currency,
        ]),
      })
    } else {
      // Exportar resumen con KPIs y cuentas
      const headers = ["Concepto", "Valor"]
      const rows: (string | number)[][] = []

      if (kpis) {
        rows.push(["Saldo Total", kpis.saldo_total])
        rows.push(["Ingresos Periodo", kpis.ingresos_periodo])
        rows.push(["Gastos Periodo", kpis.gastos_periodo])
        rows.push(["Transacciones Sin Categorizar", kpis.transacciones_sin_categorizar])
      }

      rows.push(["", ""])
      rows.push(["--- Cuentas ---", ""])
      accounts.forEach((acc) => {
        rows.push([`${acc.bank_name} — ${acc.account_name}`, acc.balance])
      })

      if (categoryBreakdown.length > 0) {
        rows.push(["", ""])
        rows.push(["--- Desglose por Categoría ---", ""])
        categoryBreakdown
          .filter((c) => c.category_id !== null)
          .forEach((cat) => {
            rows.push([cat.category_name || "Sin categoría", cat.total_gastos])
          })
      }

      exportToCSV({
        filename: `nua-tesoreria-resumen-${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}`,
        headers,
        rows,
      })
    }
  }

  const handleTreasuryExportPDF = async () => {
    if (activeTab === "Movimientos" && transactions.length > 0) {
      await exportToPDF({
        filename: `nua-tesoreria-movimientos-${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}`,
        title: "Tesorería — Movimientos",
        subtitle: `Periodo: ${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`,
        headers: ["Fecha", "Cuenta", "Banco", "Descripción", "Categoría", "Importe"],
        rows: transactions.map((tx) => [
          tx.booking_date,
          tx.account_name,
          tx.bank_name,
          tx.description.length > 50 ? tx.description.substring(0, 50) + "..." : tx.description,
          tx.category_name || "Sin categoría",
          formatCurrency(tx.amount),
        ]),
        orientation: "landscape",
        summary: kpis
          ? [
            { label: "Saldo Total", value: formatCurrency(kpis.saldo_total) },
            { label: "Ingresos", value: formatCurrency(kpis.ingresos_periodo) },
            { label: "Gastos", value: formatCurrency(kpis.gastos_periodo) },
          ]
          : [],
      })
    } else {
      // Exportar resumen general
      const headers = ["Concepto", "Valor"]
      const rows: (string | number)[][] = []

      if (kpis) {
        rows.push(["Saldo Total", formatCurrency(kpis.saldo_total)])
        rows.push(["Ingresos Periodo", formatCurrency(kpis.ingresos_periodo)])
        rows.push(["Gastos Periodo", formatCurrency(kpis.gastos_periodo)])
        rows.push(["Sin Categorizar", String(kpis.transacciones_sin_categorizar)])
      }

      accounts.forEach((acc) => {
        rows.push([`${acc.bank_name} — ${acc.account_name}`, formatCurrency(acc.balance)])
      })

      await exportToPDF({
        filename: `nua-tesoreria-resumen-${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}`,
        title: "Tesorería — Resumen General",
        subtitle: `Periodo: ${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`,
        headers,
        rows,
        orientation: "portrait",
        summary: kpis
          ? [
            { label: "Saldo Total", value: formatCurrency(kpis.saldo_total) },
            { label: "Num. Cuentas", value: String(kpis.num_cuentas) },
          ]
          : [],
      })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        icon={Landmark}
        title="Tesorería"
        subtitle="Control de cuentas bancarias y movimientos"
        actions={
          <div className="flex items-center gap-3">
            <ExportButton onExportCSV={handleTreasuryExportCSV} onExportPDF={handleTreasuryExportPDF} />
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
          // GoCardless Props
          consentInfo={consentInfo}
          syncStatus={syncStatus}
          syncingAccountId={syncingAccountId}
          onSyncAccount={handleSyncAccount}
          onConnectBank={handleConnectBank}
          onRenewConsent={handleRenewConsent}
          goCardlessAppUrl={goCardlessAppUrl}
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


      {/* Sheet de conexion bancaria */}
      <BankConnectSheet
        open={connectSheetOpen}
        onOpenChange={setConnectSheetOpen}
        state={connectState}
        onSelectInstitution={handleSelectInstitution}
        onManualComplete={handleManualComplete}
        onRetry={handleRetry}
        onClose={handleCloseConnect}
      />
    </div>
  )
}
