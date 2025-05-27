"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { MenuBar } from "@/components/menu-bar"
import { FiltrosOcupacionComponent } from "@/components/ocupacion/filtros-ocupacion"
import { KPIsOcupacion } from "@/components/ocupacion/kpis-ocupacion"
import { useOcupacionData } from "@/hooks/use-ocupacion-data"

export default function OcupacionPage() {
  const [activeTab, setActiveTab] = useState("general")

  // FILTROS POR DEFECTO - ÚLTIMOS 7 DÍAS
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    turno: "todos" as const,
    diaSemana: "todos" as const,
  })

  // USAR HOOK PARA OBTENER DATOS REALES
  const { kpis, ocupacionPorDia, evolucionOcupacion, ocupacionPorTurno, loading, error } = useOcupacionData(filtros)

  console.log("🔍 Datos obtenidos:", { kpis, loading, error })

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            {/* FILTROS */}
            <FiltrosOcupacionComponent filtros={filtros} onFiltrosChange={setFiltros} />

            {/* MOSTRAR LOADING O ERROR */}
            {loading && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Cargando datos de ocupación...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-sm text-red-500">Error: {error}</p>
              </div>
            )}

            {/* KPIS CON DATOS REALES */}
            {!loading && !error && (
              <>
                <KPIsOcupacion kpis={kpis} periodo={`${filtros.fechaInicio} - ${filtros.fechaFin}`} />

                {/* PLACEHOLDER PARA GRÁFICOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-[14px] font-medium text-nua-title mb-4">Ocupación por Día de la Semana</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      Gráfico de barras (próximamente)
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-[14px] font-medium text-nua-title mb-4">Evolución de Ocupación</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      Gráfico de líneas (próximamente)
                    </div>
                  </div>
                </div>

                {/* TABLA DE DETALLE PLACEHOLDER */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-[14px] font-medium text-nua-title mb-4">Detalle por Día y Turno</h3>
                  <div className="text-center py-8 text-gray-400">Tabla de detalle (próximamente)</div>
                </div>
              </>
            )}
          </div>
        )
      default:
        return (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Contenido de {activeTab} próximamente</p>
          </div>
        )
    }
  }

  return (
    <>
      <PageHeader title="Análisis de Ocupación" />

      <div className="flex justify-center mb-6">
        <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="mt-6">{renderContent()}</div>
    </>
  )
}
