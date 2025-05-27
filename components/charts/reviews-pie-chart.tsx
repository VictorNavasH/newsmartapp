"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface ReviewsPieChartProps {
  data: Array<{
    estrellas: number
    cantidad: number
    porcentaje: number
  }>
}

export function ReviewsPieChart({ data }: ReviewsPieChartProps) {
  const getColor = (estrellas: number) => {
    switch (estrellas) {
      case 5:
        return "#10b981"
      case 4:
        return "#3b82f6"
      case 3:
        return "#f59e0b"
      case 2:
        return "#f97316"
      case 1:
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const pieData = data.map((item) => ({
    name: `${item.estrellas}★`,
    value: item.porcentaje,
    cantidad: item.cantidad,
    color: getColor(item.estrellas),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, props: any) => [
            `${value}% (${props.payload.cantidad} reseñas)`,
            name,
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
