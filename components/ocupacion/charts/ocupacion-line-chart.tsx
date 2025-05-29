"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface OcupacionLineChartProps {
  data: Array<{
    fecha: string
    comensales: number
    reservas: number
  }>
  detallePorTurno?: {
    mediodia: { comensales: number; reservas: number }
    noche: { comensales: number; reservas: number }
  }
}

export function OcupacionLineChart({ data, detallePorTurno }: OcupacionLineChartProps) {
  const chartData = data.map((item) => {
    let proporcionMediodia = 0.5
    let proporcionNoche = 0.5

    if (detallePorTurno && detallePorTurno.mediodia && detallePorTurno.noche) {
      const totalComensales = detallePorTurno.mediodia.comensales + detallePorTurno.noche.comensales
      if (totalComensales > 0) {
        proporcionMediodia = detallePorTurno.mediodia.comensales / totalComensales
        proporcionNoche = detallePorTurno.noche.comensales / totalComensales
      }
    }

    const comensalesMediodia = Math.round(item.comensales * proporcionMediodia)
    const comensalesNoche = Math.round(item.comensales * proporcionNoche)
    const total = comensalesMediodia + comensalesNoche

    const fecha = new Date(item.fecha)
    const fechaFormateada = fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    })

    return {
      fecha: item.fecha,
      fechaFormateada,
      "Comensales mediodía": comensalesMediodia,
      "Comensales noche": comensalesNoche,
      "Comensales totales": total,
    }
  })

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="fechaFormateada"
            tick={{ fontSize: 12, fill: "#666" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12, fill: "#666" }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Comensales mediodía"
            stroke="#47b0d7"
            strokeWidth={3}
            dot={{ fill: "#47b0d7", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#47b0d7", strokeWidth: 3, stroke: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="Comensales noche"
            stroke="#edadff"
            strokeWidth={3}
            dot={{ fill: "#edadff", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#edadff", strokeWidth: 3, stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
