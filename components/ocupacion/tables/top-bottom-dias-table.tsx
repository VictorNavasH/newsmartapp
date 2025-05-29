"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

interface TopBottomDiasTableProps {
  data: Array<{
    fecha: string
    comensales: number
    reservas: number
  }>
  capacidadMax: number
}

export function TopBottomDiasTable({ data, capacidadMax }: TopBottomDiasTableProps) {
  // Ordenar por comensales y tomar top 3 y bottom 3
  const sortedData = [...data].sort((a, b) => b.comensales - a.comensales)
  const top3 = sortedData.slice(0, 3)
  const bottom3 = sortedData.slice(-3).reverse()

  const renderRow = (item: any, index: number, isTop: boolean) => {
    const ocupacion = (item.comensales / capacidadMax) * 100

    return (
      <tr key={`${isTop ? "top" : "bottom"}-${index}`} className="border-b border-gray-50">
        <td className="py-2 px-3 flex items-center">
          {isTop ? (
            <TrendingUp className="h-4 w-4 text-[#17c3b2] mr-2" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[#fe6d73] mr-2" />
          )}
          {new Date(item.fecha).toLocaleDateString("es-ES", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          })}
        </td>
        <td className="py-2 px-3 text-right font-medium">{item.comensales}</td>
        <td className="py-2 px-3 text-right">
          <span
            className={`font-medium ${
              ocupacion >= 85 ? "text-[#17c3b2]" : ocupacion >= 60 ? "text-[#364f6b]" : "text-[#fe6d73]"
            }`}
          >
            {ocupacion.toFixed(1)}%
          </span>
        </td>
      </tr>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 3 días */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-[14px] font-medium text-nua-title mb-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-[#17c3b2] mr-2" />
          Top 3 Mejores Días
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Fecha</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">Comensales</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">% Ocupación</th>
              </tr>
            </thead>
            <tbody>{top3.map((item, index) => renderRow(item, index, true))}</tbody>
          </table>
        </div>
      </div>

      {/* Bottom 3 días */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-[14px] font-medium text-nua-title mb-4 flex items-center">
          <TrendingDown className="h-4 w-4 text-[#fe6d73] mr-2" />
          Bottom 3 Días Flojos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Fecha</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">Comensales</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">% Ocupación</th>
              </tr>
            </thead>
            <tbody>{bottom3.map((item, index) => renderRow(item, index, false))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
