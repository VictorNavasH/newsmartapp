"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ReviewsLineChartProps {
  data: Array<{
    mes_año: string
    nota_media?: number
    numero_reseñas?: number
  }>
  dataKey: "nota_media" | "numero_reseñas"
  color: string
  title: string
}

export function ReviewsLineChart({ data, dataKey, color, title }: ReviewsLineChartProps) {
  const formatValue = (value: number) => {
    if (dataKey === "nota_media") {
      return `${value.toFixed(1)}★`
    }
    return value.toString()
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes_año" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} domain={dataKey === "nota_media" ? [3, 5] : ["dataMin", "dataMax"]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [formatValue(value), title]}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={3}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
