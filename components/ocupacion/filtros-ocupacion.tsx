"use client"

import { Filter } from "lucide-react"
import { PeriodDropdown, type PeriodOption } from "@/components/ui/period-dropdown"
import type { FiltrosOcupacionType } from "@/app/actions/ocupacion-actions"

interface FiltrosOcupacionProps {
  filtros: FiltrosOcupacionType
  onFiltrosChange: (filtros: FiltrosOcupacionType) => void
}

export function FiltrosOcupacionComponent({ filtros, onFiltrosChange }: FiltrosOcupacionProps) {
  const aplicarPreset = (preset: PeriodOption) => {
    const hoy = new Date()
    let fechaInicio: string
    let fechaFin: string

    switch (preset) {
      case "hoy":
        fechaInicio = fechaFin = hoy.toISOString().split("T")[0]
        break
      case "ayer":
        const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000)
        fechaInicio = fechaFin = ayer.toISOString().split("T")[0]
        break
      case "ultimos7":
        const inicio7 = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
        fechaInicio = inicio7.toISOString().split("T")[0]
        fechaFin = hoy.toISOString().split("T")[0]
        break
      case "ultimos30":
        const inicio30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
        fechaInicio = inicio30.toISOString().split("T")[0]
        fechaFin = hoy.toISOString().split("T")[0]
        break
      case "semanaActual":
        const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 1))
        fechaInicio = inicioSemana.toISOString().split("T")[0]
        fechaFin = new Date().toISOString().split("T")[0]
        break
      case "mesActual":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0]
        fechaFin = new Date().toISOString().split("T")[0]
        break
      default:
        fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        fechaFin = hoy.toISOString().split("T")[0]
    }

    onFiltrosChange({ ...filtros, fechaInicio, fechaFin })
  }

  // Determinar qué preset está actualmente seleccionado
  const getCurrentPreset = (): PeriodOption => {
    const hoy = new Date().toISOString().split("T")[0]
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    if (filtros.fechaInicio === hoy && filtros.fechaFin === hoy) {
      return "hoy"
    }
    if (filtros.fechaInicio === ayer && filtros.fechaFin === ayer) {
      return "ayer"
    }

    const diffDays = Math.ceil(
      (new Date(filtros.fechaFin).getTime() - new Date(filtros.fechaInicio).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 7) return "ultimos7"
    if (diffDays === 30) return "ultimos30"

    // Verificar si es semana actual
    const inicioSemana = new Date()
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1)
    if (filtros.fechaInicio === inicioSemana.toISOString().split("T")[0]) {
      return "semanaActual"
    }

    // Verificar si es mes actual
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    if (filtros.fechaInicio === inicioMes.toISOString().split("T")[0]) {
      return "mesActual"
    }

    return "ultimos7" // Por defecto
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-nua-primary" />
        <h3 className="text-sm font-medium text-nua-title">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Selector de Período */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Período</label>
          <PeriodDropdown value={getCurrentPreset()} onChange={aplicarPreset} />
        </div>

        {/* Fechas Personalizadas */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Fecha Inicio</label>
          <input
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => onFiltrosChange({ ...filtros, fechaInicio: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-2 block">Fecha Fin</label>
          <input
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => onFiltrosChange({ ...filtros, fechaFin: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>

        {/* Turno */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Turno</label>
          <select
            value={filtros.turno}
            onChange={(e) => onFiltrosChange({ ...filtros, turno: e.target.value as any })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
          >
            <option value="todos">Todos</option>
            <option value="medio_dia">Mediodía</option>
            <option value="noche">Noche</option>
          </select>
        </div>
      </div>
    </div>
  )
}
