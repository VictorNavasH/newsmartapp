"use client"

import { lazy, Suspense, useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAppRouter } from "@/hooks/useAppRouter"
import { LoginScreen } from "@/components/features/LoginScreen"
import { Sidebar } from "@/components/layout/Sidebar"
import { SmartAssistant } from "@/components/features/SmartAssistant"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const DashboardPage = lazy(() => import("@/components/views/DashboardPage"))
const ReservationsPage = lazy(() => import("@/components/views/ReservationsPage"))
const IncomePage = lazy(() => import("@/components/views/IncomePage"))
const ExpensesPage = lazy(() => import("@/components/views/ExpensesPage"))
const CostesPage = lazy(() => import("@/components/views/CostesPage"))
const ComprasPage = lazy(() => import("@/components/views/ComprasPage"))
const OperationsPage = lazy(() => import("@/components/views/OperationsPage"))
const ProductsPage = lazy(() => import("@/components/views/ProductsPage"))
const TreasuryPage = lazy(() => import("@/components/views/TreasuryPage"))
const FacturacionPage = lazy(() => import("@/components/views/FacturacionPage"))
const TabletUsagePage = lazy(() => import("@/components/views/TabletUsagePage"))
const SmartAssistantPage = lazy(() => import("@/components/views/SmartAssistantPage"))
const SettingsPage = lazy(() => import("@/components/views/SettingsPage"))

function ViewLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02b1c4]" />
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading, error, signIn, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const { currentPath, navigate } = useAppRouter()

  // Detectar callback de GoCardless al montar
  // GoCardless redirige a: https://domain.com/?gocardless_callback=true&ref=req_xxx
  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const isCallback = params.get("gocardless_callback")
    const ref = params.get("ref")

    if (isCallback === "true" && ref) {
      // Guardar referencia para que TreasuryConexionesTab la detecte
      sessionStorage.setItem("gocardless_ref", ref)
      // Señal para que TreasuryPage active la tab Conexiones al montar
      sessionStorage.setItem("gocardless_activate_tab", "Conexiones")

      // Limpiar la URL (quitar query params, mantener hash)
      const cleanUrl = window.location.pathname + (window.location.hash || "#/treasury")
      window.history.replaceState({}, "", cleanUrl)

      // Navegar a treasury si no estamos ya ahi
      if (currentPath !== "/treasury") {
        navigate("/treasury")
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const renderContent = () => {
    switch (currentPath) {
      case "/":
        return <DashboardPage />
      case "/reservations":
        return <ReservationsPage />
      case "/revenue":
        return <IncomePage />
      case "/expenses":
        return <ExpensesPage />
      case "/costs":
        return <CostesPage />
      case "/purchases":
        return <ComprasPage />
      case "/operations":
        return <OperationsPage />
      case "/products":
        return <ProductsPage />
      case "/treasury":
        return <TreasuryPage />
      case "/invoices":
        return <FacturacionPage />
      case "/tablet-usage":
        return <TabletUsagePage />
      case "/ai-assistant":
        return <SmartAssistantPage />
      case "/settings":
        return <SettingsPage userName={user?.user_metadata?.full_name} userEmail={user?.email} />
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <h2 className="text-2xl font-bold mb-2">Próximamente</h2>
            <p>La sección {currentPath} está en construcción.</p>
          </div>
        )
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#02b1c4] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!user) {
    return <LoginScreen onLogin={signIn} error={error} />
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans text-slate-600">
      <Sidebar
        collapsed={collapsed}
        toggle={() => setCollapsed(!collapsed)}
        currentPath={currentPath}
        onNavigate={navigate}
        userName={user?.user_metadata?.full_name}
        userEmail={user?.email}
        onSignOut={signOut}
      />
      <ErrorBoundary onReset={() => navigate("/")}>
        <Suspense fallback={<ViewLoadingFallback />}>
          <main className="flex-1 overflow-auto h-full w-full relative">
            {renderContent()}
          </main>
        </Suspense>
      </ErrorBoundary>

      <SmartAssistant currentPath={currentPath} />
    </div>
  )
}
