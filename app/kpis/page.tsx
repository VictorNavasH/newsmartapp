"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { MenuBar } from "@/components/menu-bar"

// Componentes para cada subpágina
const EconomicosContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">KPIs Económicos</h2>
    <p>
      Contenido de la subpágina <strong>KPIs Económicos</strong> aquí. Esta sección muestra los indicadores clave de
      rendimiento relacionados con las finanzas y la rentabilidad del negocio.
    </p>
  </div>
)

const OperativosContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">KPIs Operativos</h2>
    <p>
      Contenido de la subpágina <strong>KPIs Operativos</strong> aquí. Esta sección muestra los indicadores clave de
      rendimiento relacionados con la operación diaria del restaurante.
    </p>
  </div>
)

const SmartKitchenContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">KPIs Smart Kitchen</h2>
    <p>
      Contenido de la subpágina <strong>KPIs Smart Kitchen</strong> aquí. Esta sección muestra los indicadores clave de
      rendimiento relacionados con la cocina inteligente y su eficiencia.
    </p>
  </div>
)

const SalaContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">KPIs de Sala</h2>
    <p>
      Contenido de la subpágina <strong>KPIs de Sala</strong> aquí. Esta sección muestra los indicadores clave de
      rendimiento relacionados con el servicio en sala y la experiencia del cliente.
    </p>
  </div>
)

export default function KPIs() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState("economicos")

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case "economicos":
        return <EconomicosContent />
      case "operativos":
        return <OperativosContent />
      case "kitchen":
        return <SmartKitchenContent />
      case "sala":
        return <SalaContent />
      default:
        return <EconomicosContent />
    }
  }

  return (
    <>
      <PageHeader title="Análisis de KPI's" />

      {/* MenuBar con la pestaña activa - centrado */}
      <div className="flex justify-center mb-6">
        <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Contenido de la subpágina activa */}
      <div className="mt-6">{renderContent()}</div>
    </>
  )
}
