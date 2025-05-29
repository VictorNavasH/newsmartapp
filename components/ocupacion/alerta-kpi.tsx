"use client"

import { AlertTriangle, TrendingUp, CheckCircle, AlertCircle } from "lucide-react"
import StarBorder from "@/components/ui/star-border"
import type { OcupacionMetrics } from "@/hooks/use-ocupacion-metrics"

interface AlertaKPIProps {
  data: OcupacionMetrics
  objetivoOcupacion: number
}

export function AlertaKPI({ data, objetivoOcupacion }: AlertaKPIProps) {
  // Determinar el estado principal
  let estado = "neutral"
  let titulo = "Normal"
  let mensaje = "Dentro de parámetros"
  let icon = CheckCircle

  // Prioridad: Récord > Por debajo objetivo > Tendencia negativa > Normal
  if (data.ocupacion_total >= 95) {
    estado = "positive"
    titulo = "¡Récord!"
    mensaje = `${data.ocupacion_total.toFixed(1)}% ocupación`
    icon = TrendingUp
  } else if (data.ocupacion_total < objetivoOcupacion) {
    estado = "negative"
    titulo = "Bajo Objetivo"
    mensaje = `${(objetivoOcupacion - data.ocupacion_total).toFixed(1)}% por debajo`
    icon = AlertTriangle
  } else if (data.tendencia && data.tendencia < -15) {
    estado = "negative"
    titulo = "Tendencia Negativa"
    mensaje = `${Math.abs(data.tendencia).toFixed(1)}% menos`
    icon = AlertTriangle
  } else if (data.ocupacion_total >= objetivoOcupacion) {
    estado = "positive"
    titulo = "Objetivo Cumplido"
    mensaje = `${data.ocupacion_total.toFixed(1)}% ocupación`
    icon = CheckCircle
  }

  // Verificar días sin actividad
  const diasSinActividad = data.detalle_por_dia.filter((dia) => dia.comensales === 0).length
  if (diasSinActividad > 0 && estado === "neutral") {
    estado = "negative"
    titulo = "Días Inactivos"
    mensaje = `${diasSinActividad} día(s) sin comensales`
    icon = AlertCircle
  }

  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#364f6b",
  }

  const getColor = () => colors[estado as keyof typeof colors]
  const Icon = icon

  return (
    <StarBorder status={estado}>
      <h3 className="text-[14px] font-medium text-nua-title">Estado Ocupación</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-xl font-bold" style={{ color: getColor() }}>
          {titulo}
        </p>
      </div>
      <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">{mensaje}</p>
    </StarBorder>
  )
}
