"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { FiltrosOcupacionComponent } from "@/components/ocupacion/filtros-ocupacion"
import { KPIsOcupacion } from "@/components/ocupacion/kpis-ocupacion"
import { AlertaKPI } from "@/components/ocupacion/alerta-kpi"
import { MetricasExtra } from "@/components/ocupacion/metricas-extra"
import { OcupacionBarChart } from "@/components/ocupacion/charts/ocupacion-bar-chart"
import { OcupacionLineChart } from "@/components/ocupacion/charts/ocupacion-line-chart"
import { OcupacionPieChart } from "@/components/ocupacion/charts/ocupacion-pie-chart"
import { DetallePorDiaTable } from "@/components/ocupacion/tables/detalle-por-dia-table"
import { TopBottomDiasTable } from "@/components/ocupacion/tables/top-bottom-dias-table"
import { ResumenPorTurnoTable } from "@/components/ocupacion/tables/resumen-por-turno-table"
import { useOcupacionMetrics } from "@/hooks/use-ocupacion-metrics"
import StarBorder from "@/components/ui/star-border"

export default function OcupacionPage() {
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    turno: "todos" as const,
    diaSemana: "todos" as const,
    capacidadMax: 65,
  })

  const { data, loading, error } = useOcupacionMetrics(filtros)

  const colors = {
    neutral: "#364f6b",
  }

  return (
    <>
      <PageHeader title="Análisis de Ocupación" />

      <div className="mt-6">
        <div className="space-y-6">
          {/* FILTROS */}
          <FiltrosOcupacionComponent filtros={filtros} onFiltrosChange={setFiltros} />

          {/* LOADING Y ERROR */}
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

          {/* CONTENIDO PRINCIPAL */}
          {!loading && !error && data && (
            <>
              {/* PRIMERA FILA: 5 KPIs CON DIMENSIONES IDÉNTICAS */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <KPIsOcupacion data={data} periodo={`${filtros.fechaInicio} - ${filtros.fechaFin}`} />
                <AlertaKPI data={data} objetivoOcupacion={75} />
              </div>

              {/* SEGUNDA FILA: 5 KPIs CON DIMENSIONES IDÉNTICAS */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {/* Reservas Atendidas */}
                <StarBorder status="neutral">
                  <h3 className="text-[14px] font-medium text-nua-title">Reservas Atendidas</h3>
                  <div className="mt-2 flex items-baseline">
                    <p className="text-xl font-bold" style={{ color: colors.neutral }}>
                      {data.reservas_atendidas.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{`${filtros.fechaInicio} - ${filtros.fechaFin}`}</p>
                </StarBorder>

                {/* Métricas Extra */}
                <MetricasExtra data={data} />
              </div>

              {/* GRÁFICOS SUPERIORES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-[14px] font-medium text-nua-title mb-4">Comensales por Día de la Semana</h3>
                  <OcupacionBarChart data={data.detalle_por_dia} detallePorTurno={data.detalle_por_turno} />
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-[14px] font-medium text-nua-title mb-4">Distribución por Turno</h3>
                  <OcupacionPieChart data={data.detalle_por_turno} />
                </div>
              </div>

              {/* GRÁFICO DE EVOLUCIÓN - ANCHO COMPLETO */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-[14px] font-medium text-nua-title mb-4">Evolución Diaria de Comensales</h3>
                <OcupacionLineChart data={data.detalle_por_dia} detallePorTurno={data.detalle_por_turno} />
              </div>

              {/* TOP/BOTTOM DÍAS */}
              <TopBottomDiasTable data={data.detalle_por_dia} capacidadMax={filtros.capacidadMax} />

              {/* TABLAS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResumenPorTurnoTable
                  data={data.detalle_por_turno}
                  capacidadMax={filtros.capacidadMax}
                  diasCount={data.dias_count}
                />
                <DetallePorDiaTable data={data.detalle_por_dia} capacidadMax={filtros.capacidadMax} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
