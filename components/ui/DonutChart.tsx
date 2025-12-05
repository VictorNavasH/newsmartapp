import type React from "react"
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface DonutData {
  name: string
  value: number
  color: string
  [key: string]: any
}

interface DonutChartProps {
  data: DonutData[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  height = 160,
  innerRadius = 45,
  outerRadius = 70,
  showLegend = true,
}) => {
  const dataWithFill = data.map((d) => ({ ...d, fill: d.color || "#cccccc" }))

  return (
    <div style={{ width: "100%", height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithFill}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={false}
            stroke="none"
          />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(value)
            }
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              payload={dataWithFill.map((item) => ({
                value: item.name,
                type: "circle",
                color: item.fill,
              }))}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
