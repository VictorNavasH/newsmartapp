"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import DashboardPage from "@/components/views/DashboardPage"
import ReservationsPage from "@/components/views/ReservationsPage"
import IncomePage from "@/components/views/IncomePage"
import ExpensesPage from "@/components/views/ExpensesPage"
import OperationsPage from "@/components/views/OperationsPage"
import ProductsPage from "@/components/views/ProductsPage"
import ForecastingPage from "@/components/views/ForecastingPage"
import TreasuryPage from "@/components/views/TreasuryPage"
import WhatIfPage from "@/components/views/WhatIfPage"
import BankConnectionsPage from "@/components/views/BankConnectionsPage"
import FacturacionPage from "@/components/views/FacturacionPage"
import SmartAssistantPage from "@/components/views/SmartAssistantPage"
import { SmartAssistant } from "@/components/features/SmartAssistant"

export default function App() {
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
