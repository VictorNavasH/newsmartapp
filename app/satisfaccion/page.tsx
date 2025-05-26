"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { MenuBar } from "@/components/menu-bar"
import ReviewsGoogleContent from "@/components/reviews/reviews-google-content"

// Componentes para cada subpágina
const SatisfaccionGeneralContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Satisfacción General</h2>
    <p>
      Contenido de la subpágina <strong>Satisfacción General</strong> aquí. Esta sección muestra un resumen de todos los
      indicadores de satisfacción del cliente.
    </p>
  </div>
)

const EncuestaInternaContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Encuesta Interna</h2>
    <p>
      Contenido de la subpágina <strong>Encuesta Interna</strong> aquí. Esta sección muestra los resultados de las
      encuestas internas realizadas a los clientes.
    </p>
  </div>
)

export default function Satisfaccion() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState("general")

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <SatisfaccionGeneralContent />
      case "google":
        return <ReviewsGoogleContent />
      case "encuesta":
        return <EncuestaInternaContent />
      default:
        return <SatisfaccionGeneralContent />
    }
  }

  return (
    <>
      <PageHeader title="Análisis de Satisfacción" />

      {/* MenuBar con la pestaña activa - centrado */}
      <div className="flex justify-center mb-6">
        <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Contenido de la subpágina activa */}
      <div className="mt-6">{renderContent()}</div>
    </>
  )
}
