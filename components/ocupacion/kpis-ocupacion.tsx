"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import StarBorder from "@/components/ui/star-border"
import type { KPIOcupacion } from "@/app/actions/ocupacion-actions"

interface KPIsOcupacionProps {
  kpis: KPIOcupacion
  periodo: string
}

export function KPIsOcupacion({ kpis, periodo }: KPIsOcupacionProps) {
  // COLORES SEGÚN ESPECIFICACIÓN DEL README
  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#364f6b",
  }

  // REGLAS KPI SEGÚN README Y ESTÁNDARES
  const getKPIStatus = (valor: number, tipo: "ocupacion" | "cumplimiento" | "tendencia") => {
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
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {/* Tasa de Ocupación Promedio - USANDO STARBORDER SEGÚN README */}
      <StarBorder status={getKPIStatus(kpis.tasaOcupacionPromedio, "ocupacion")}>
        <h3 className="text-[14px] font-medium text-nua-title">Tasa de Ocupación</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{ color: getKPIColor(getKPIStatus(kpis.tasaOcupacionPromedio, "ocupacion")) }}
          >
            {kpis.tasaOcupacionPromedio.toFixed(1)}%
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{periodo}</p>
      </StarBorder>

      {/* Reservas Atendidas Totales */}
      <StarBorder status="neutral">
        <h3 className="text-[14px] font-medium text-nua-title">Reservas Atendidas</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-xl font-bold" style={{ color: colors.neutral }}>
            {kpis.reservasAtendidasTotales.toLocaleString()}
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{periodo}</p>
      </StarBorder>

      {/* Cumplimiento del Objetivo */}
      <StarBorder status={getKPIStatus(kpis.cumplimientoObjetivo, "cumplimiento")}>
        <h3 className="text-[14px] font-medium text-nua-title">Cumplimiento Objetivo</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{ color: getKPIColor(getKPIStatus(kpis.cumplimientoObjetivo, "cumplimiento")) }}
          >
            {kpis.cumplimientoObjetivo.toFixed(1)}%
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">del objetivo</p>
      </StarBorder>

      {/* Tendencia */}
      <StarBorder status={getKPIStatus(kpis.tendenciaOcupacion, "tendencia")}>
        <h3 className="text-[14px] font-medium text-nua-title">Tendencia</h3>
        <div className="mt-2 flex items-baseline">
          <p
            className="text-xl font-bold"
            style={{ color: getKPIColor(getKPIStatus(kpis.tendenciaOcupacion, "tendencia")) }}
          >
            {kpis.tendenciaOcupacion >= 0 ? "+" : ""}
            {kpis.tendenciaOcupacion.toFixed(1)}%
          </p>
          <span
            className="ml-2 text-[10px] flex items-center"
            style={{ color: getKPIColor(getKPIStatus(kpis.tendenciaOcupacion, "tendencia")) }}
          >
            {kpis.tendenciaOcupacion >= 0 ? (
              <ArrowUp size={14} className="mr-0.5" />
            ) : (
              <ArrowDown size={14} className="mr-0.5" />
            )}
            vs período anterior
          </span>
        </div>
      </StarBorder>

      {/* Capacidad No Utilizada */}
      <StarBorder status="neutral">
        <h3 className="text-[14px] font-medium text-nua-title">Capacidad Perdida</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-xl font-bold" style={{ color: colors.neutral }}>
            {kpis.capacidadNoUtilizada.toLocaleString()}
          </p>
        </div>
        <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">plazas no ocupadas</p>
      </StarBorder>
    </div>
  )
}
