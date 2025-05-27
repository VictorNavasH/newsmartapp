"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { MenuBar } from "@/components/menu-bar"
import { BankContent } from "@/components/banking/bank-content"

// Componente para Insights generales
const InsightsContent = () => (
  <div>
    <h2 className="text-[14px] font-medium text-nua-title mb-4">Insights Bancarios</h2>
    <p className="text-[12px] text-nua-dark">Análisis general y tendencias bancarias aquí.</p>
  </div>
)

export default function AnalisisBancario() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState("insights")

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case "insights":
        return <InsightsContent />
      case "caixabank":
        return <BankContent bankName="CaixaBank" />
      case "bbva":
        return <BankContent bankName="BBVA" />
      case "sabadell":
        return <BankContent bankName="Banc Sabadell" />
      case "pool":
        return <BankContent bankName="Pool" />
      default:
        return <InsightsContent />
    }
  }

  return (
    <>
      <PageHeader title="Análisis Bancario" />

      {/* MenuBar con la pestaña activa - centrado */}
      <div className="flex justify-center mb-6">
        <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Contenido de la subpestaña activa */}
      <div className="mt-6">{renderContent()}</div>
    </>
  )
}
