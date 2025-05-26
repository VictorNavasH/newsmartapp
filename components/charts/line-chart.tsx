"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface LineChartProps {
  data: Array<{
    mes: string
    puntuacion_promedio: number
  }>
}

export function CustomLineChart({ data }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
        <YAxis domain={[3, 5]} stroke="#6b7280" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [`${value.toFixed(1)}★`, "Puntuación"]}
        />
        <Line
          type="monotone"
          dataKey="puntuacion_promedio"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
