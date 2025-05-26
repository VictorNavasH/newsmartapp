"use client"

import PageHeader from "@/components/page-header"
import StarBorder from "@/components/ui/star-border"
import { ArrowUp, ArrowDown } from "lucide-react"

export default function Dashboard() {
  // Definimos los colores según el estado para usarlos en todo el componente
  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#364f6b",
  }

  return (
    <>
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StarBorder status="positive">
          {/* Título del KPI - Ahora con el mismo color que el título de Dashboard */}
          <h3 className="text-[14px] font-medium text-nua-title transition-colors duration-300">Ventas Acumuladas</h3>

          <div className="mt-2 flex items-baseline">
            {/* Valor Principal - Ahora con color condicional */}
            <p className="text-xl font-bold transition-all duration-300" style={{ color: colors.positive }}>
              €42,850
            </p>

            {/* Cambio/Tendencia */}
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.positive }}>
              <ArrowUp size={14} className="mr-0.5" />
              +7.5% vs mes anterior
            </span>
          </div>

          {/* Texto Descriptivo/Footer - Ahora con el color que tenía el título */}
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Proyección: €68,540</p>
        </StarBorder>

        <StarBorder status="negative">
          <h3 className="text-[14px] font-medium text-nua-title transition-colors duration-300">Ocupación Media</h3>

          <div className="mt-2 flex items-baseline">
            {/* Valor Principal - Ahora con color condicional */}
            <p className="text-xl font-bold transition-all duration-300" style={{ color: colors.negative }}>
              68%
            </p>

            {/* Cambio/Tendencia */}
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.negative }}>
              <ArrowDown size={14} className="mr-0.5" />
              -1.5% vs objetivo
            </span>
          </div>

          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Meta mensual: 75%</p>
        </StarBorder>

        <StarBorder status="positive">
          <h3 className="text-[14px] font-medium text-nua-title transition-colors duration-300">Ticket Medio</h3>

          <div className="mt-2 flex items-baseline">
            {/* Valor Principal - Ahora con color condicional */}
            <p className="text-xl font-bold transition-all duration-300" style={{ color: colors.positive }}>
              €39.75
            </p>

            {/* Cambio/Tendencia */}
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.positive }}>
              <ArrowUp size={14} className="mr-0.5" />
              +3.2% vs mes anterior
            </span>
          </div>

          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Tendencia: €41.20</p>
        </StarBorder>

        <StarBorder status="positive">
          <h3 className="text-[14px] font-medium text-nua-title transition-colors duration-300">Reservas Acumuladas</h3>

          <div className="mt-2 flex items-baseline">
            {/* Valor Principal - Ahora con color condicional */}
            <p className="text-xl font-bold transition-all duration-300" style={{ color: colors.positive }}>
              342
            </p>

            {/* Cambio/Tendencia */}
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.positive }}>
              <ArrowUp size={14} className="mr-0.5" />
              +4.8% vs mes anterior
            </span>
          </div>

          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Proyección: 520</p>
        </StarBorder>
      </div>
    </>
  )
}
