"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BarChartProps {
  data: Array<{
    mes: string
    total_reseñas: number
  }>
}

export function CustomBarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [`${value}`, "Reseñas"]}
        />
        <Bar dataKey="total_reseñas" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
