"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ReviewsDistributionData {
  estrellas: number
  cantidad: number
  porcentaje: number
}

interface ReviewsDistributionChartProps {
  data: ReviewsDistributionData[]
}

export function ReviewsDistributionChart({ data }: ReviewsDistributionChartProps) {
  // Transformar los datos para el gráfico
  const chartData =
    data?.map((item) => ({
      estrellas: `${item.estrellas}★`,
      cantidad: item.cantidad,
      porcentaje: item.porcentaje,
    })) || []

  // Función personalizada para el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{payload[0].value}</span> reseñas
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{payload[0].payload.porcentaje?.toFixed(1)}%</span> del total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="estrellas" tick={{ fontSize: 12 }} axisLine={{ stroke: "#e0e0e0" }} />
          <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: "#e0e0e0" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="cantidad" fill="#17c3b2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
