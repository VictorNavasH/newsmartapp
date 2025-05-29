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
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h3 className="text-[14px] font-medium text-nua-title mb-4">Resumen por Turno</h3>
        <div className="text-center py-8 text-gray-600 text-[12px]">No hay datos disponibles</div>
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

  // Objetivo de ocupación (ejemplo: 75%)
  const objetivoOcupacion = 75

  // Función para determinar color según objetivo
  const getOcupacionColor = (ocupacion: number) => {
    return ocupacion >= objetivoOcupacion ? "#17c3b2" : "#fe6d73"
  }

  const turnos = [
    {
      nombre: "Mediodía",
      icon: Sun,
      comensales: comensalesMediodia,
      reservas: reservasMediodia,
      ocupacion: ocupacionMediodia,
      color: "#17c3b2",
      bgColor: "#17c3b2",
    },
    {
      nombre: "Noche",
      icon: Moon,
      comensales: comensalesNoche,
      reservas: reservasNoche,
      ocupacion: ocupacionNoche,
      color: "#364f6b",
      bgColor: "#edadff",
    },
  ]

  const totalComensales = comensalesMediodia + comensalesNoche
  const totalReservas = reservasMediodia + reservasNoche

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      {/* Header con gradiente sutil */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-[14px] font-medium text-nua-title">Resumen por Turno</h3>
        <p className="text-[12px] text-gray-600 mt-1">Análisis de ocupación por turnos</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg">
              <th className="text-left py-2 px-3 font-medium text-gray-600 rounded-l-lg">Turno</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Comensales</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Reservas</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600 rounded-r-lg">% Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno, index) => {
              const Icon = turno.icon
              const ocupacionColor = getOcupacionColor(turno.ocupacion)

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-50 hover:bg-gray-50/30 transition-colors duration-200 ${
                    index % 2 === 1 ? "bg-gray-50/30" : ""
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${turno.bgColor}20` }}
                      >
                        <Icon className="h-3 w-3" style={{ color: turno.color }} />
                      </div>
                      <span className="font-medium text-nua-title text-[12px]">{turno.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-medium text-nua-title text-[12px]">{turno.comensales.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-gray-600 text-[12px]">{turno.reservas}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium"
                      style={{
                        backgroundColor: `${ocupacionColor}15`,
                        color: ocupacionColor,
                      }}
                    >
                      {turno.ocupacion.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totales con estilo moderno */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600 text-[12px]">Total General:</span>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="font-medium text-nua-title text-[12px]">{totalComensales.toLocaleString()}</span>
                <span className="text-gray-600 text-[11px] ml-1">comensales</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-nua-title text-[12px]">{totalReservas}</span>
                <span className="text-gray-600 text-[11px] ml-1">reservas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
