"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { MenuBar } from "@/components/menu-bar"
// Importar el componente de Datos Base
import { DatosBaseContent } from "@/components/configuracion/datos-base-content"
// Importar el componente de Conexiones
import { ConexionesContent } from "@/components/configuracion/conexiones-content"

// Componentes para cada subpágina
const GeneralContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Configuración General</h2>
    <p>
      Contenido de la subpágina <strong>Configuración General</strong> aquí. Esta sección permite configurar los
      parámetros generales de la aplicación.
    </p>
  </div>
)

const DatosOperativosContent = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Datos Operativos</h2>
    <p>
      Contenido de la subpágina <strong>Datos Operativos</strong> aquí. Esta sección permite gestionar los datos
      operativos del negocio.
    </p>
  </div>
)

// Reemplazar la función DatosBaseContent existente con:
const DatosBaseContentWrapper = () => <DatosBaseContent />

// Reemplazar la función ConexionesContent existente con:
const ConexionesContentWrapper = () => <ConexionesContent />

export default function Configuracion() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState("general")

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralContent />
      case "operativos":
        return <DatosOperativosContent />
      case "base":
        return <DatosBaseContentWrapper />
      case "conexiones":
        return <ConexionesContentWrapper />
      default:
        return <GeneralContent />
    }
  }

  return (
    <>
      <PageHeader title="Configuración" />

      {/* MenuBar con la pestaña activa - centrado */}
      <div className="flex justify-center mb-6">
        <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Contenido de la subpágina activa */}
      <div className="mt-6">{renderContent()}</div>
    </>
  )
}
