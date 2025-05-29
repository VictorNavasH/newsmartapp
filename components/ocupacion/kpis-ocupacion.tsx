"use client"
import StarBorder from "@/components/ui/star-border"
import type { OcupacionMetrics } from "@/hooks/use-ocupacion-metrics"

interface KPIsOcupacionProps {
  data: OcupacionMetrics
  periodo: string
}

export function KPIsOcupacion({ data, periodo }: KPIsOcupacionProps) {
  // COLORES SEGÚN ESPECIFICACIÓN DEL README
  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#364f6b",
  }

  // CALCULAR MÉTRICAS
  const ocupacionMediaDiaria = data.comensales / data.dias_count
  const ratioComensalesReserva = data.reservas_atendidas > 0 ? data.comensales / data.reservas_atendidas : 0

  // REGLAS KPI SEGÚN README Y ESTÁNDARES
  const getKPIStatus = (valor: number, tipo: "ocupacion" | "cumplimiento" | "tendencia" | "ratio") => {
    if (tipo === "ocupacion") {
      if (valor >= 85) return "positive"
      if (valor >= 60) return "neutral"
      return "negative"
    }
    if (tipo === "cumplimiento") {
      if (valor >= 90) return "positive"
      if (valor >= 70) return "neutral"
      return "negative"
    }
    if (tipo === "tendencia") {
      if (valor > 5) return "positive"
      if (valor >= -5) return "neutral"
      return "negative"
    }
    if (tipo === "ratio") {
      if (valor >= 3.5) return "positive"
      if (valor >= 2.5) return "neutral"
      return "negative"
    }
    return "neutral"
  }

  const getKPIColor = (status: string) => {
    switch (status) {
      case "positive":
        return colors.positive
      case "negative":
        return colors.negative
      default:
        return colors.neutral
    }
  }

  return (
    <>
      {/* Tasa de Ocupación */}
      <StarBorder status={getKPIStatus(data.ocupacion_total, "ocupacion")}>
        <h3 className="text-[14px] font-medium text-nua-title">Tasa de Ocupación</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{ color: getKPIColor(getKPIStatus(data.ocupacion_total, "ocupacion")) }}
          >
            {data.ocupacion_total.toFixed(1)}%
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{periodo}</p>
      </StarBorder>

      {/* Ocupación Media Diaria */}
      <StarBorder status={getKPIStatus(ocupacionMediaDiaria, "ocupacion")}>
        <h3 className="text-[14px] font-medium text-nua-title">Ocupación Media Diaria</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{ color: getKPIColor(getKPIStatus(ocupacionMediaDiaria, "ocupacion")) }}
          >
            {ocupacionMediaDiaria.toFixed(0)}
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">comensales/día</p>
      </StarBorder>

      {/* Ratio Comensales/Reserva */}
      <StarBorder status={getKPIStatus(ratioComensalesReserva, "ratio")}>
        <h3 className="text-[14px] font-medium text-nua-title">Ratio Comensales/Reserva</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{ color: getKPIColor(getKPIStatus(ratioComensalesReserva, "ratio")) }}
          >
            {ratioComensalesReserva.toFixed(1)}
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">personas/reserva</p>
      </StarBorder>

      {/* Capacidad Perdida */}
      <StarBorder status="neutral">
        <h3 className="text-[14px] font-medium text-nua-title">Capacidad Perdida</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-xl font-bold" style={{ color: colors.neutral }}>
            {data.capacidad_perdida.toLocaleString()}
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">plazas no ocupadas</p>
      </StarBorder>
    </>
  )
}
