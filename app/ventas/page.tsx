"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { MenuBar } from "@/components/menu-bar"

// Componentes para cada subpágina
const ResumenContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Resumen de Ventas</h2>
    <p>
      Contenido de la subpágina <strong>Resumen</strong> aquí. Esta sección muestra un resumen general de las ventas,
      incluyendo métricas clave y tendencias principales.
    </p>
  </div>
)

const EvolucionContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Evolución de Ventas</h2>
    <p>
      Contenido de la subpágina <strong>Evolución</strong> aquí. Esta sección muestra la evolución temporal de las
      ventas, con gráficos de tendencias y análisis comparativos.
    </p>
  </div>
)

const ProductosContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Análisis de Productos</h2>
    <p>
      Contenido de la subpágina <strong>Productos</strong> aquí. Esta sección muestra el rendimiento de ventas por
      producto, categorías más vendidas y análisis de rentabilidad.
    </p>
  </div>
)

const TicketsContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Análisis de Tickets</h2>
    <p>
      Contenido de la subpágina <strong>Tickets</strong> aquí. Esta sección muestra información sobre tickets de venta,
      incluyendo ticket medio, composición y distribución.
    </p>
  </div>
)

const PatronesContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Patrones de Venta</h2>
    <p>
      Contenido de la subpágina <strong>Patrones</strong> aquí. Esta sección muestra patrones y comportamientos de
      compra, estacionalidad y análisis predictivo.
    </p>
  </div>
)

export default function Ventas() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState("resumen")

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case "resumen":
        return <ResumenContent />
      case "evolucion":
        return <EvolucionContent />
      case "productos":
        return <ProductosContent />
      case "tickets":
        return <TicketsContent />
      case "patrones":
        return <PatronesContent />
      default:
        return <ResumenContent />
    }
  }

  return (
    <>
      <PageHeader title="Análisis de Ventas" />

      {/* MenuBar con la pestaña activa - centrado */}
      <div className="flex justify-center mb-6">
        <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Contenido de la subpágina activa */}
      <div className="mt-6">{renderContent()}</div>
    </>
  )
}
