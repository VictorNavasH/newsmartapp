"use client"

import { useMemo } from "react"
import { CalendarClock } from "lucide-react"
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
import type { HorasExtraSemana } from "@/types"
import { aggregateResumen, formatHoras, semaforo } from "./constants"

interface ResumenTabProps {
  loading: boolean
  semanas: HorasExtraSemana[]
  monthLabel: string
}

export function ResumenTab({ loading, semanas, monthLabel }: ResumenTabProps) {
  const resumen = useMemo(() => aggregateResumen(semanas), [semanas])

  if (loading) return <Skeleton className="h-80 w-full" />

  return (
    <TremorCard
      title={`Resumen por empleado · ${monthLabel}`}
      icon={<CalendarClock className="w-4 h-4 text-[#17c3b2]" />}
    >
      {resumen.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          No hay datos de horas para este mes.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead className="text-right">Trabajadas</TableHead>
                <TableHead className="text-right">Ausencia</TableHead>
                <TableHead className="text-right">Computables</TableHead>
                <TableHead className="text-right">Extra</TableHead>
                <TableHead className="w-40">Cumplimiento</TableHead>
                <TableHead className="text-right">Días</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumen.map((r) => (
                <TableRow key={r.connecteam_user_id}>
                  <TableCell className="font-medium text-[#364f6b]">{r.first_name}</TableCell>
                  <TableCell className="text-right text-slate-600">{formatHoras(r.horas_trabajadas)}</TableCell>
                  <TableCell className="text-right text-slate-500">{formatHoras(r.horas_ausencia)}</TableCell>
                  <TableCell className="text-right text-slate-600">{formatHoras(r.horas_computables)}</TableCell>
                  <TableCell className="text-right">
                    {r.horas_extra > 0 ? (
                      <Badge className="bg-[#fe6d73]/10 text-[#fe6d73] border-transparent">
                        +{formatHoras(r.horas_extra)}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.cumplimiento == null ? (
                      <span className="text-xs text-slate-400">Sin contrato</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, r.cumplimiento)}%`,
                              backgroundColor: semaforo(r.cumplimiento),
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-10 text-right">
                          {Math.round(r.cumplimiento)}%
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-slate-500">{r.dias_trabajados}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-3">
        Horas extra = horas computables por encima del contrato semanal. Cada semana ISO se atribuye al mes en el
        que empieza.
      </p>
    </TremorCard>
  )
}
