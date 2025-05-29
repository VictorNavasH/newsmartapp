"use client"

import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface OcupacionPieChartProps {
  data: {
    mediodia: { comensales: number; reservas: number }
    noche: { comensales: number; reservas: number }
  }
}

export function OcupacionPieChart({ data }: OcupacionPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Verificar si data es undefined o no tiene la estructura esperada
  if (!data || !data.mediodia || !data.noche) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    )
  }

  const chartData = [
    {
      name: "Mediodía",
      value: data.mediodia.comensales,
      color: "#47b0d7",
    },
    {
      name: "Noche",
      value: data.noche.comensales,
      color: "#edadff",
    },
  ]

  const COLORS = ["#47b0d7", "#edadff"]

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              const RADIAN = Math.PI / 180
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5
              const x = cx + radius * Math.cos(-midAngle * RADIAN)
              const y = cy + radius * Math.sin(-midAngle * RADIAN)

              return (
                <text
                  x={x}
                  y={y}
                  fill="white"
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight="bold"
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              )
            }}
            outerRadius={({ index }) => (activeIndex === index ? 85 : 80)}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            animationBegin={0}
            animationDuration={400}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={2}
                style={{
                  filter: activeIndex === index ? "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" : "none",
                }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            itemStyle={{ color: "#333" }}
            labelStyle={{ fontWeight: "bold", marginBottom: "5px" }}
            formatter={(value, name, props) => {
              const total = chartData.reduce((sum, item) => sum + item.value, 0)
              const percentage = total > 0 ? (((value as number) / total) * 100).toFixed(1) : "0.0"
              return [`${value} (${percentage}%)`, "Comensales"]
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color, fontSize: "12px", fontWeight: "500" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
