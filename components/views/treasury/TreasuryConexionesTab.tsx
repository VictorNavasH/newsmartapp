"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Building2,
  TrendingUp,
  ArrowDownLeft,
} from "lucide-react"
import { MenuBar } from "@/components/ui/menu-bar"
import { useToast } from "@/hooks/use-toast"
import {
  fetchConsolidatedBalance,
  fetchBankTransactions,
  fetchConsentStatus,
  triggerAccountSync,
  getGoCardlessAppUrl,
  fetchInstitutions,
  createRequisition,
  pollRequisitionStatus,
  fetchRequisitionAccounts,
  triggerInitialSync,
} from "@/lib/bankConnectionsService"
import type {
  BankConsolidatedBalance,
  BankTransaction,
  BankTransactionsResult,
  BankConsentInfo,
  BankAccount,
  BankConnectState,
  BankInstitution,
} from "@/types"
import { PAGE_SIZE, type TransactionTypeFilter } from "../bankConnections/constants"
import { BankResumenTab } from "../bankConnections/BankResumenTab"
import { BankMovimientosTab } from "../bankConnections/BankMovimientosTab"
import { BankConnectSheet } from "../bankConnections/BankConnectSheet"

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

/**
 * TreasuryConexionesTab — Tab de Conexiones Bancarias embebida en Tesoreria.
 * Encapsula toda la funcionalidad de BankConnectionsPage como un tab auto-contenido.
 * Incluye sub-tabs internas (Resumen, Movimientos) y el flujo de conexion GoCardless.
 */
export function TreasuryConexionesTab() {
  const { toast } = useToast()

  const [activeSubTab, setActiveSubTab] = useState("Resumen")

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

  // Connect flow state
  const [connectSheetOpen, setConnectSheetOpen] = useState(false)
  const [connectState, setConnectState] = useState<BankConnectState>(INITIAL_CONNECT_STATE)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // --- DATA LOADING ---

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
      console.error("[TreasuryConexionesTab] Error loading resumen:", err)
    } finally {
      setLoading(false)
    }
  }, [])

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
      console.error("[TreasuryConexionesTab] Error loading transactions:", err)
    } finally {
      setLoadingTransactions(false)
    }
  }, [page, searchTerm, accountFilter, typeFilter])

  // Initial load
  useEffect(() => {
    loadResumenData()
  }, [loadResumenData])

  // Load transactions on sub-tab switch or filter change
  useEffect(() => {
    if (activeSubTab === "Movimientos") {
      loadTransactions()
    }
  }, [activeSubTab, loadTransactions])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, accountFilter, typeFilter])

  // Also load periodStats for resumen sub-tab (all transactions, no filters)
  useEffect(() => {
    if (activeSubTab === "Resumen" && !periodStats) {
      fetchBankTransactions({ page: 1, limit: 1 }).then((result) => {
        setPeriodStats(result.periodStats)
      })
    }
  }, [activeSubTab, periodStats])

  // --- SYNC HANDLER ---

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
        await loadResumenData()
        if (activeSubTab === "Movimientos") {
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

  // --- CONNECT / RENEW FLOW ---

  /** Abre el Sheet con la lista de instituciones */
  const handleConnectBank = useCallback(async () => {
    setConnectState({
      ...INITIAL_CONNECT_STATE,
      step: "selecting",
    })
    setConnectSheetOpen(true)

    // Cargar instituciones en background
    const institutions = await fetchInstitutions("ES")
    setConnectState((prev) => ({
      ...prev,
      institutions,
    }))
  }, [])

  /** Abre el Sheet y pre-selecciona una institucion para renovar */
  const handleRenewConsent = useCallback(async (institutionId: string) => {
    if (!institutionId) {
      // Si no hay institution_id, abrir selector normal
      handleConnectBank()
      return
    }

    setConnectState({
      ...INITIAL_CONNECT_STATE,
      step: "selecting",
    })
    setConnectSheetOpen(true)

    // Cargar instituciones y pre-seleccionar
    const institutions = await fetchInstitutions("ES")
    setConnectState((prev) => ({
      ...prev,
      institutions,
    }))

    // Buscar la institucion por ID y auto-seleccionar
    const targetInst = institutions.find(
      (inst) => inst.id === institutionId || inst.gocardless_id === institutionId
    )
    if (targetInst) {
      // Iniciar automaticamente el flujo de conexion
      handleSelectInstitution(targetInst)
    }
  }, [])

  /** Genera la URL de callback para GoCardless */
  const buildCallbackUrl = (): string => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/?gocardless_callback=true`
  }

  /** Selecciona una institucion y crea la requisition */
  const handleSelectInstitution = async (institution: BankInstitution) => {
    setConnectState((prev) => ({
      ...prev,
      step: "creating",
      selectedInstitution: institution,
    }))

    const reference = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    const redirectUrl = buildCallbackUrl()

    const result = await createRequisition(
      institution.gocardless_id || institution.id,
      redirectUrl,
      reference
    )

    if (!result.success || !result.link) {
      setConnectState((prev) => ({
        ...prev,
        step: "error",
        error: result.error || "No se pudo crear la solicitud de conexion",
      }))
      return
    }

    // Guardar referencia para polling posterior
    setConnectState((prev) => ({
      ...prev,
      step: "redirecting",
      reference: result.reference || reference,
      authLink: result.link || null,
    }))

    // Guardar la referencia en sessionStorage para detectar callback
    if (typeof window !== "undefined") {
      sessionStorage.setItem("gocardless_ref", result.reference || reference)
    }

    // Abrir ventana del banco
    try {
      window.open(result.link, "_blank")
    } catch {
      // Si no se puede abrir, el usuario usara el enlace de fallback
      console.warn("[TreasuryConexionesTab] No se pudo abrir ventana emergente")
    }
  }

  /** Inicia el polling de estado despues de que el usuario complete la autorizacion */
  const handleManualComplete = useCallback(() => {
    const reference = connectState.reference
    if (!reference) {
      setConnectState((prev) => ({
        ...prev,
        step: "error",
        error: "No se encontro referencia de conexion",
      }))
      return
    }
    startPolling(reference)
  }, [connectState.reference])

  /** Polling del estado de la requisition + fetch de cuentas + sync inicial */
  const startPolling = useCallback(async (reference: string) => {
    setConnectState((prev) => ({ ...prev, step: "processing" }))

    // Limpiar polling anterior si existe
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    let attempts = 0
    const maxAttempts = 30 // ~60 segundos con intervalo de 2s

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

      // Estados de GoCardless: CR=created, GC=gave_consent, LN=linked, RJ=rejected, EX=expired
      if (status.status === "LN" || status.status === "GC") {
        // Conexion exitosa — detener polling
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = null

        // Fetch cuentas conectadas
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

        // Sincronizacion inicial
        setConnectState((prev) => ({
          ...prev,
          step: "syncing",
          connectedAccounts: accounts,
        }))

        await triggerInitialSync(accounts)

        // Exito
        setConnectState((prev) => ({
          ...prev,
          step: "success",
        }))

        // Limpiar sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("gocardless_ref")
        }
      } else if (status.status === "RJ" || status.status === "EX") {
        // Rechazado o expirado
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
        // Timeout
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = null
        setConnectState((prev) => ({
          ...prev,
          step: "error",
          error: "Tiempo de espera agotado. Si ya has completado la autorizacion, intenta de nuevo.",
        }))
      }
      // Si estado es CR (creado), seguir esperando
    }

    // Primera llamada inmediata
    await poll()

    // Si no se resolvio, iniciar intervalo
    if (
      connectState.step !== "success" &&
      connectState.step !== "error" &&
      !pollingRef.current
    ) {
      pollingRef.current = setInterval(poll, 2000)
    }
  }, [])

  /** Reintentar conexion desde el estado de error */
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

  /** Cerrar el Sheet y recargar datos si hubo exito */
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

    // Si la conexion fue exitosa, recargar datos
    if (wasSuccess) {
      await loadResumenData()
      if (activeSubTab === "Movimientos") {
        await loadTransactions()
      }
    }
  }, [connectState.step, activeSubTab, loadResumenData, loadTransactions])

  // --- CALLBACK DETECTION ---
  // Detecta si venimos de un callback de GoCardless (via sessionStorage)
  useEffect(() => {
    if (typeof window === "undefined") return

    const savedRef = sessionStorage.getItem("gocardless_ref")
    if (savedRef) {
      // Abrir Sheet y empezar polling automaticamente
      setConnectState({
        ...INITIAL_CONNECT_STATE,
        step: "processing",
        reference: savedRef,
      })
      setConnectSheetOpen(true)
      startPolling(savedRef)
    }
  }, [startPolling])

  // Sub-tab menu items
  const bankSubMenuItems = [
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
    <div className="space-y-6">
      {/* Sub-tabs internas: Resumen / Movimientos */}
      <div className="flex justify-center">
        <MenuBar
          items={bankSubMenuItems}
          activeItem={activeSubTab}
          onItemClick={(label) => setActiveSubTab(label)}
        />
      </div>

      {/* SUB-TAB 1: Resumen */}
      {activeSubTab === "Resumen" && (
        <BankResumenTab
          consolidated={consolidated}
          consentInfo={consentInfo}
          periodStats={periodStats}
          loading={loading}
          syncingAccountId={syncingAccountId}
          onSyncAccount={handleSyncAccount}
          goCardlessAppUrl={goCardlessAppUrl}
          onConnectBank={handleConnectBank}
          onRenewConsent={handleRenewConsent}
        />
      )}

      {/* SUB-TAB 2: Movimientos */}
      {activeSubTab === "Movimientos" && (
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
