"use client"

import { useMemo } from "react"
import { CalendarOff } from "lucide-react"
import { TremorCard } from "@/components/ui/TremorCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { Ausencia, AusenciaDia } from "@/types"

interface AusenciasTabProps {
  loading: boolean
  ausencias: Ausencia[]
  ausenciasDia: AusenciaDia[]
  monthLabel: string
}

// Colores por tipo de ausencia (consistentes con la paleta de marca)
const TIPO_COLOR: Record<string, string> = {
  Vacaciones: "#02b1c4",
  "Baja por enfermedad": "#fe6d73",
  "Asuntos propios": "#ffcb77",
}
const colorTipo = (tipo: string) => TIPO_COLOR[tipo] || "#227c9d"

function fmtFecha(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

export function AusenciasTab({ loading, ausencias, ausenciasDia, monthLabel }: AusenciasTabProps) {
  // Días con ausencias del mes (para el resumen por tipo)
  const porTipo = useMemo(() => {
    const m = new Map<string, number>()
    ausenciasDia.forEach((a) => m.set(a.tipo, (m.get(a.tipo) || 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [ausenciasDia])

  if (loading) return <Skeleton className="h-80 w-full" />

  return (
    <div className="space-y-6">
      {porTipo.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {porTipo.map(([tipo, dias]) => (
            <TremorCard key={tipo}>
              <p className="text-xs text-slate-500 mb-1 truncate">{tipo}</p>
              <p className="text-2xl font-bold" style={{ color: colorTipo(tipo) }}>
                {dias}
                <span className="text-sm font-normal text-slate-400"> días</span>
              </p>
            </TremorCard>
          ))}
        </div>
      )}

      <TremorCard
        title={`Ausencias · ${monthLabel}`}
        icon={<CalendarOff className="w-4 h-4 text-[#d99a2b]" />}
      >
        {ausencias.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No hay ausencias registradas en este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta</TableHead>
                  <TableHead className="text-right">Duración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ausencias.map((a, idx) => (
                  <TableRow key={`${a.connecteam_user_id}-${a.start_date}-${idx}`}>
                    <TableCell className="font-medium text-[#364f6b]">{a.first_name}</TableCell>
                    <TableCell>
                      <Badge
                        className="border-transparent"
                        style={{ backgroundColor: `${colorTipo(a.tipo)}1a`, color: colorTipo(a.tipo) }}
                      >
                        {a.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{fmtFecha(a.start_date)}</TableCell>
                    <TableCell className="text-slate-600">{fmtFecha(a.end_date)}</TableCell>
                    <TableCell className="text-right text-slate-500">
                      {a.duracion != null ? `${a.duracion} ${a.unidad || ""}`.trim() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TremorCard>
    </div>
  )
}
