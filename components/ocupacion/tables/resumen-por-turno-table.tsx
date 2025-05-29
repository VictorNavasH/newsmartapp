"use client"

import { Sun, Moon } from "lucide-react"

interface ResumenPorTurnoTableProps {
  data: {
    mediodia?: { comensales?: number; reservas?: number }
    noche?: { comensales?: number; reservas?: number }
  }
  capacidadMax: number
  diasCount: number
}

export function ResumenPorTurnoTable({ data, capacidadMax, diasCount }: ResumenPorTurnoTableProps) {
  // Verificar si los datos son válidos
  if (!data || !data.mediodia || !data.noche) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-[14px] font-medium text-nua-title mb-4">Resumen por Turno</h3>
        <div className="text-center py-8 text-gray-500">No hay datos disponibles</div>
      </div>
    )
  }

  // Usar valores predeterminados si alguna propiedad es undefined
  const comensalesMediodia = data.mediodia.comensales || 0
  const reservasMediodia = data.mediodia.reservas || 0
  const comensalesNoche = data.noche.comensales || 0
  const reservasNoche = data.noche.reservas || 0

  // Calcular ocupación por turno
  const capacidadTotalPorTurno = capacidadMax * diasCount
  const ocupacionMediodia = capacidadTotalPorTurno > 0 ? (comensalesMediodia / capacidadTotalPorTurno) * 100 : 0
  const ocupacionNoche = capacidadTotalPorTurno > 0 ? (comensalesNoche / capacidadTotalPorTurno) * 100 : 0

  const turnos = [
    {
      nombre: "Mediodía",
      icon: Sun,
      comensales: comensalesMediodia,
      reservas: reservasMediodia,
      ocupacion: ocupacionMediodia,
      color: "#17c3b2",
    },
    {
      nombre: "Noche",
      icon: Moon,
      comensales: comensalesNoche,
      reservas: reservasNoche,
      ocupacion: ocupacionNoche,
      color: "#364f6b",
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-[14px] font-medium text-nua-title mb-4">Resumen por Turno</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Turno</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Comensales</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Reservas</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">% Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno, index) => {
              const Icon = turno.icon
              return (
                <tr key={index} className="border-b border-gray-50">
                  <td className="py-3 px-3 flex items-center">
                    <Icon className="h-4 w-4 mr-2" style={{ color: turno.color }} />
                    <span className="font-medium">{turno.nombre}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium">{turno.comensales.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">{turno.reservas}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-medium" style={{ color: turno.color }}>
                      {turno.ocupacion.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-600">Total:</span>
          <div className="flex space-x-6">
            <span className="font-medium">{(comensalesMediodia + comensalesNoche).toLocaleString()} comensales</span>
            <span>{reservasMediodia + reservasNoche} reservas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
