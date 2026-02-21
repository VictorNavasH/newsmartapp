"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  TrendingUp,
  ArrowDownLeft,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { MenuBar } from "@/components/ui/menu-bar"
import { useToast } from "@/hooks/use-toast"
import {
  fetchConsolidatedBalance,
  fetchBankTransactions,
  fetchConsentStatus,
  triggerAccountSync,
  getGoCardlessAppUrl,
} from "@/lib/bankConnectionsService"
import type {
  BankConsolidatedBalance,
  BankTransaction,
  BankTransactionsResult,
  BankConsentInfo,
  BankAccount,
} from "@/types"
import { PAGE_SIZE, type TransactionTypeFilter } from "./bankConnections/constants"
import { BankResumenTab } from "./bankConnections/BankResumenTab"
import { BankMovimientosTab } from "./bankConnections/BankMovimientosTab"

export default function BankConnectionsPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("Resumen")

  // Data state
  const [consolidated, setConsolidated] = useState<BankConsolidatedBalance | null>(null)
  const [consentInfo, setConsentInfo] = useState<BankConsentInfo | null>(null)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [periodStats, setPeriodStats] = useState<BankTransactionsResult["periodStats"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [accountFilter, setAccountFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const goCardlessAppUrl = getGoCardlessAppUrl()
  const accounts: BankAccount[] = consolidated?.accounts ?? []

  const hasActiveFilters = accountFilter !== "all" || typeFilter !== "all" || searchTerm !== ""

  const clearFilters = () => {
    setSearchTerm("")
    setAccountFilter("all")
    setTypeFilter("all")
    setPage(1)
  }

  // Load initial data (resumen + consent)
  const loadResumenData = useCallback(async () => {
    setLoading(true)
    try {
      const [consolidatedData, consentData] = await Promise.all([
        fetchConsolidatedBalance(),
        fetchConsentStatus(),
      ])
      setConsolidated(consolidatedData)
      setConsentInfo(consentData)
    } catch (err) {
      console.error("[BankConnectionsPage] Error loading resumen:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load transactions (with filters)
  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    try {
      const result = await fetchBankTransactions({
        page,
        limit: PAGE_SIZE,
        search: searchTerm || "",
        accountId: accountFilter !== "all" ? accountFilter : null,
        type: typeFilter,
      })
      setTransactions(result.transactions)
      setTotalCount(result.totalCount)
      setPeriodStats(result.periodStats)
    } catch (err) {
      console.error("[BankConnectionsPage] Error loading transactions:", err)
    } finally {
      setLoadingTransactions(false)
    }
  }, [page, searchTerm, accountFilter, typeFilter])

  // Initial load
  useEffect(() => {
    loadResumenData()
  }, [loadResumenData])

  // Load transactions on tab switch or filter change
  useEffect(() => {
    if (activeTab === "Movimientos") {
      loadTransactions()
    }
  }, [activeTab, loadTransactions])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, accountFilter, typeFilter])

  // Also load periodStats for resumen tab (all transactions, no filters)
  useEffect(() => {
    if (activeTab === "Resumen" && !periodStats) {
      fetchBankTransactions({ page: 1, limit: 1 }).then((result) => {
        setPeriodStats(result.periodStats)
      })
    }
  }, [activeTab, periodStats])

  // Sync account
  const handleSyncAccount = async (accountId: string) => {
    setSyncingAccountId(accountId)
    try {
      const result = await triggerAccountSync(accountId)
      if (result.success) {
        toast({
          title: "Sincronizacion completada",
          description: result.synced
            ? `${result.synced.transactions} transacciones nuevas`
            : result.message,
        })
        // Recargar datos
        await loadResumenData()
        if (activeTab === "Movimientos") {
          await loadTransactions()
        }
      } else {
        toast({
          title: "Error al sincronizar",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error de conexion",
        description: "No se pudo conectar con el servicio de sincronizacion",
        variant: "destructive",
      })
    } finally {
      setSyncingAccountId(null)
    }
  }

  // Menu items
  const bankMenuItems = [
    {
      icon: TrendingUp,
      label: "Resumen",
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
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        icon={Building2}
        title="Conexiones Bancarias"
        subtitle="Cuentas bancarias y movimientos via Open Banking"
      />

      <div className="flex justify-center mb-6">
        <MenuBar items={bankMenuItems} activeItem={activeTab} onItemClick={(label) => setActiveTab(label)} />
      </div>

      {/* TAB 1: Resumen */}
      {activeTab === "Resumen" && (
        <BankResumenTab
          consolidated={consolidated}
          consentInfo={consentInfo}
          periodStats={periodStats}
          loading={loading}
          syncingAccountId={syncingAccountId}
          onSyncAccount={handleSyncAccount}
          goCardlessAppUrl={goCardlessAppUrl}
        />
      )}

      {/* TAB 2: Movimientos */}
      {activeTab === "Movimientos" && (
        <BankMovimientosTab
          transactions={transactions}
          accounts={accounts}
          periodStats={periodStats}
          loading={loadingTransactions}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      )}
    </div>
  )
}
