"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ReviewsBarChartProps {
  data: Array<{
    estrellas: number
    cantidad: number
    porcentaje: number
  }>
}

export function ReviewsBarChart({ data }: ReviewsBarChartProps) {
  const getBarColor = (estrellas: number) => {
    switch (estrellas) {
      case 5:
        return "#10b981" // Verde
      case 4:
        return "#3b82f6" // Azul
      case 3:
        return "#f59e0b" // Amarillo
      case 2:
        return "#f97316" // Naranja
      case 1:
        return "#ef4444" // Rojo
      default:
        return "#6b7280" // Gris
    }
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="estrellas" stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${value}★`} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            `${value} reseñas (${data.find((d) => d.cantidad === value)?.porcentaje || 0}%)`,
            "Cantidad",
          ]}
        />
        <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.estrellas)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
