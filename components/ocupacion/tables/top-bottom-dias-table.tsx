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
      <tr
        key={`${isTop ? "top" : "bottom"}-${index}`}
        className={`${index % 2 === 0 ? "bg-gray-50/30" : "bg-white"} hover:bg-gray-50/50 transition-colors duration-200`}
      >
        <td className="py-3 px-3">
          <div className="flex items-center space-x-2">
            {isTop ? (
              <div className="flex-shrink-0 w-6 h-6 bg-[#17c3b2]/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-[#17c3b2]" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-6 h-6 bg-[#fe6d73]/10 rounded-full flex items-center justify-center">
                <TrendingDown className="h-3 w-3 text-[#fe6d73]" />
              </div>
            )}
            <span className="text-[14px] font-medium text-nua-title">
              {new Date(item.fecha).toLocaleDateString("es-ES", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
          </div>
        </td>
        <td className="py-3 px-3 text-right">
          <span className="text-[14px] font-medium text-nua-title">{item.comensales}</span>
        </td>
        <td className="py-3 px-3 text-right">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium ${
              ocupacion >= 85
                ? "bg-[#17c3b2]/10 text-[#17c3b2]"
                : ocupacion >= 60
                  ? "bg-[#364f6b]/10 text-[#364f6b]"
                  : "bg-[#fe6d73]/10 text-[#fe6d73]"
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#17c3b2]/5 to-[#17c3b2]/10 px-4 py-4 border-b border-gray-100/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#17c3b2]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#17c3b2]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-nua-title">Top 3 Mejores Días</h3>
              <p className="text-[12px] text-gray-600">Días con mayor ocupación</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-[12px] font-medium text-gray-600 uppercase tracking-wide">
                  Fecha
                </th>
                <th className="text-right py-2 px-3 text-[12px] font-medium text-gray-600 uppercase tracking-wide">
                  Comensales
                </th>
                <th className="text-right py-2 px-3 text-[12px] font-medium text-gray-600 uppercase tracking-wide">
                  Ocupación
                </th>
              </tr>
            </thead>
            <tbody>{top3.map((item, index) => renderRow(item, index, true))}</tbody>
          </table>
        </div>
      </div>

      {/* Bottom 3 días */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#fe6d73]/5 to-[#fe6d73]/10 px-4 py-4 border-b border-gray-100/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#fe6d73]/10 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-[#fe6d73]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-nua-title">Bottom 3 Días Flojos</h3>
              <p className="text-[12px] text-gray-600">Días con menor ocupación</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-[12px] font-medium text-gray-600 uppercase tracking-wide">
                  Fecha
                </th>
                <th className="text-right py-2 px-3 text-[12px] font-medium text-gray-600 uppercase tracking-wide">
                  Comensales
                </th>
                <th className="text-right py-2 px-3 text-[12px] font-medium text-gray-600 uppercase tracking-wide">
                  Ocupación
                </th>
              </tr>
            </thead>
            <tbody>{bottom3.map((item, index) => renderRow(item, index, false))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
