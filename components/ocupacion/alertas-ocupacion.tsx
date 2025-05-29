"use client"

import { AlertTriangle, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import type { OcupacionMetrics } from "@/hooks/use-ocupacion-metrics"

interface AlertasOcupacionProps {
  data: OcupacionMetrics
  objetivoOcupacion: number
}

export function AlertasOcupacion({ data, objetivoOcupacion }: AlertasOcupacionProps) {
  const alertas = []

  // Alerta por debajo del objetivo
  if (data.ocupacion_total < objetivoOcupacion) {
    const diferencia = objetivoOcupacion - data.ocupacion_total
    alertas.push({
      tipo: "warning",
      icon: AlertTriangle,
      titulo: "Por debajo del objetivo",
      mensaje: `La ocupación está ${diferencia.toFixed(1)}% por debajo del objetivo (${objetivoOcupacion}%)`,
      color: "#fe6d73",
    })
  }

  // Alerta récord de ocupación
  if (data.ocupacion_total >= 95) {
    alertas.push({
      tipo: "success",
      icon: TrendingUp,
      titulo: "¡Récord de ocupación!",
      mensaje: `Excelente ocupación del ${data.ocupacion_total.toFixed(1)}%. ¡Felicidades!`,
      color: "#17c3b2",
    })
  }

  // Alerta tendencia negativa
  if (data.tendencia && data.tendencia < -15) {
    alertas.push({
      tipo: "danger",
      icon: TrendingDown,
      titulo: "Tendencia negativa",
      mensaje: `La ocupación ha bajado ${Math.abs(data.tendencia).toFixed(1)}% respecto al período anterior`,
      color: "#fe6d73",
    })
  }

  // Alerta días sin actividad
  const diasSinActividad = data.detalle_por_dia.filter((dia) => dia.comensales === 0).length
  if (diasSinActividad > 0) {
    alertas.push({
      tipo: "info",
      icon: AlertCircle,
      titulo: "Días sin actividad",
      mensaje: `Se detectaron ${diasSinActividad} día(s) sin comensales en el período`,
      color: "#364f6b",
    })
  }

  if (alertas.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      {alertas.map((alerta, index) => {
        const Icon = alerta.icon
        return (
          <div
            key={index}
            className="flex items-start p-4 rounded-lg border-l-4"
            style={{
              borderLeftColor: alerta.color,
              backgroundColor: `${alerta.color}10`,
            }}
          >
            <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: alerta.color }} />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">{alerta.titulo}</h4>
              <p className="text-sm text-gray-600 mt-1">{alerta.mensaje}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
