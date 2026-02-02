"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { LoginScreen } from "@/components/features/LoginScreen"
import { Sidebar } from "@/components/layout/Sidebar"
import DashboardPage from "@/components/views/DashboardPage"
import ReservationsPage from "@/components/views/ReservationsPage"
import IncomePage from "@/components/views/IncomePage"
import ExpensesPage from "@/components/views/ExpensesPage"
import CostesPage from "@/components/views/CostesPage"
import ComprasPage from "@/components/views/ComprasPage"
import OperationsPage from "@/components/views/OperationsPage"
import ProductsPage from "@/components/views/ProductsPage"
import ForecastingPage from "@/components/views/ForecastingPage"
import TreasuryPage from "@/components/views/TreasuryPage"
import WhatIfPage from "@/components/views/WhatIfPage"
import BankConnectionsPage from "@/components/views/BankConnectionsPage"
import FacturacionPage from "@/components/views/FacturacionPage"
import SmartAssistantPage from "@/components/views/SmartAssistantPage"
import TabletUsagePage from "@/components/views/TabletUsagePage"
import { SmartAssistant } from "@/components/features/SmartAssistant"

export default function App() {
  const { user, loading, error, signIn, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [currentPath, setCurrentPath] = useState("/")

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
      case "/forecasting":
        return <ForecastingPage />
      case "/treasury":
        return <TreasuryPage />
      case "/what-if":
        return <WhatIfPage />
      case "/bank-connections":
        return <BankConnectionsPage />
      case "/invoices":
        return <FacturacionPage />
      case "/tablet-usage":
        return <TabletUsagePage />
      case "/ai-assistant":
        return <SmartAssistantPage />
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#02b1c4] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando...</p>
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
        onNavigate={setCurrentPath}
      />
      <main className="flex-1 overflow-auto h-full w-full">{renderContent()}</main>

      <SmartAssistant currentPath={currentPath} />
    </div>
  )
}
