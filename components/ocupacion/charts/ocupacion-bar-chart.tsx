"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface OcupacionBarChartProps {
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

export function OcupacionBarChart({ data, detallePorTurno }: OcupacionBarChartProps) {
  // Agrupar por día de la semana
  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const dataAgrupada = diasSemana.map((dia, index) => {
    const datosDelDia = data.filter((item) => {
      const fecha = new Date(item.fecha)
      const diaSemanaIndex = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1
      return diaSemanaIndex === index
    })

    const comensalesDelDia = datosDelDia.reduce((sum, item) => sum + item.comensales, 0)

    let proporcionMediodia = 0.5
    let proporcionNoche = 0.5

    if (detallePorTurno && detallePorTurno.mediodia && detallePorTurno.noche) {
      const totalComensales = detallePorTurno.mediodia.comensales + detallePorTurno.noche.comensales
      if (totalComensales > 0) {
        proporcionMediodia = detallePorTurno.mediodia.comensales / totalComensales
        proporcionNoche = detallePorTurno.noche.comensales / totalComensales
      }
    }

    const comensalesMediodia = Math.round(comensalesDelDia * proporcionMediodia)
    const comensalesNoche = Math.round(comensalesDelDia * proporcionNoche)

    return {
      dia,
      "Comensales mediodía": comensalesMediodia,
      "Comensales noche": comensalesNoche,
      "Comensales totales": comensalesMediodia + comensalesNoche,
    }
  })

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dataAgrupada} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#666" }} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12, fill: "#666" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Comensales mediodía" fill="#47b0d7" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar dataKey="Comensales noche" fill="#edadff" radius={[4, 4, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
