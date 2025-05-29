"use client"

import StarBorder from "@/components/ui/star-border"
import type { OcupacionMetrics } from "@/hooks/use-ocupacion-metrics"

interface MetricasExtraProps {
  data: OcupacionMetrics
}

export function MetricasExtra({ data }: MetricasExtraProps) {
  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#364f6b",
  }

  // Calcular mejor día de la semana
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const comensalesPorDia = Array(7).fill(0)

  data.detalle_por_dia.forEach((dia) => {
    const fecha = new Date(dia.fecha)
    const diaSemana = fecha.getDay()
    comensalesPorDia[diaSemana] += dia.comensales
  })

  const mejorDiaIndex = comensalesPorDia.indexOf(Math.max(...comensalesPorDia))
  const mejorDia = diasSemana[mejorDiaIndex]
  const comensalesMejorDia = comensalesPorDia[mejorDiaIndex]

  // Calcular turno principal
  const comensalesMediodia = data.detalle_por_turno.mediodia?.comensales || 0
  const comensalesNoche = data.detalle_por_turno.noche?.comensales || 0
  const turnoPrincipal = comensalesMediodia > comensalesNoche ? "Mediodía" : "Noche"
  const porcentajeTurnoPrincipal = (Math.max(comensalesMediodia, comensalesNoche) / data.comensales) * 100

  // Calcular ocupación por turno
  const capacidadTotalTurno = (data.periodo.capacidad_max * data.dias_count) / 2
  const ocupacionMediodia = (comensalesMediodia / capacidadTotalTurno) * 100
  const ocupacionNoche = (comensalesNoche / capacidadTotalTurno) * 100

  return (
    <>
      {/* Mejor Día de la Semana */}
      <StarBorder status="neutral">
        <h3 className="text-[14px] font-medium text-nua-title">Mejor Día</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-xl font-bold" style={{ color: colors.neutral }}>
            {mejorDia}
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{comensalesMejorDia} comensales</p>
      </StarBorder>

      {/* Turno Principal */}
      <StarBorder status="neutral">
        <h3 className="text-[14px] font-medium text-nua-title">Turno Principal</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-xl font-bold" style={{ color: colors.neutral }}>
            {turnoPrincipal}
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{porcentajeTurnoPrincipal.toFixed(1)}% del total</p>
      </StarBorder>

      {/* Ocupación Mediodía */}
      <StarBorder status={ocupacionMediodia >= 75 ? "positive" : ocupacionMediodia >= 50 ? "neutral" : "negative"}>
        <h3 className="text-[14px] font-medium text-nua-title">Ocupación Mediodía</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{
              color:
                ocupacionMediodia >= 75 ? colors.positive : ocupacionMediodia >= 50 ? colors.neutral : colors.negative,
            }}
          >
            {ocupacionMediodia.toFixed(1)}%
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{comensalesMediodia} comensales</p>
      </StarBorder>

      {/* Ocupación Noche */}
      <StarBorder status={ocupacionNoche >= 75 ? "positive" : ocupacionNoche >= 50 ? "neutral" : "negative"}>
        <h3 className="text-[14px] font-medium text-nua-title">Ocupación Noche</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{
              color: ocupacionNoche >= 75 ? colors.positive : ocupacionNoche >= 50 ? colors.neutral : colors.negative,
            }}
          >
            {ocupacionNoche.toFixed(1)}%
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{comensalesNoche} comensales</p>
      </StarBorder>
    </>
  )
}
