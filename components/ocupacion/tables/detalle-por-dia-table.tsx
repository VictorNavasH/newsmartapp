"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DetallePorDiaTableProps {
  data: Array<{
    fecha: string
    comensales: number
    reservas: number
  }>
  capacidadMax: number
}

export function DetallePorDiaTable({ data, capacidadMax }: DetallePorDiaTableProps) {
  const exportToCSV = () => {
    const headers = ["Fecha", "Comensales", "Reservas", "% Ocupación", "Capacidad Perdida"]
    const csvData = data.map((item) => {
      const ocupacion = (item.comensales / capacidadMax) * 100
      const capacidadPerdida = capacidadMax - item.comensales
      return [
        new Date(item.fecha).toLocaleDateString("es-ES"),
        item.comensales,
        item.reservas,
        `${ocupacion.toFixed(1)}%`,
        capacidadPerdida,
      ]
    })

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `detalle-ocupacion-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-medium text-nua-title">Detalle por Día</h3>
        <Button onClick={exportToCSV} variant="outline" size="sm" className="text-xs">
          <Download className="h-3 w-3 mr-1" />
          Exportar CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Fecha</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Comensales</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Reservas</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">% Ocupación</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Cap. Perdida</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const ocupacion = (item.comensales / capacidadMax) * 100
              const capacidadPerdida = capacidadMax - item.comensales

              return (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    {new Date(item.fecha).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{item.comensales}</td>
                  <td className="py-2 px-3 text-right">{item.reservas}</td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`font-medium ${
                        ocupacion >= 85 ? "text-[#17c3b2]" : ocupacion >= 60 ? "text-[#364f6b]" : "text-[#fe6d73]"
                      }`}
                    >
                      {ocupacion.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600">{capacidadPerdida}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
