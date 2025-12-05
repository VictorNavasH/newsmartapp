"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import DashboardPage from "@/pages/DashboardPage"
import ReservationsPage from "@/pages/ReservationsPage"
import IncomePage from "@/pages/IncomePage"
import ExpensesPage from "@/pages/ExpensesPage"
import OperationsPage from "@/pages/OperationsPage"
import ProductsPage from "@/pages/ProductsPage"
import ForecastingPage from "@/pages/ForecastingPage"
// import TreasuryPage from "@/pages/TreasuryPage"
import WhatIfPage from "@/pages/WhatIfPage"

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
      // case "/treasury":
      //   return <TreasuryPage />
      case "/what-if":
        return <WhatIfPage />
      default:
        // Placeholder for other pages
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
    </div>
  )
}
