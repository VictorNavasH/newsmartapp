"use client"

import { useMemo } from "react"
import { Moon } from "lucide-react"
import { TremorCard } from "@/components/ui/TremorCard"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { HorasNocturnas } from "@/types"
import { aggregateNocturnas, formatHoras } from "./constants"

interface NocturnasTabProps {
  loading: boolean
  rows: HorasNocturnas[]
  monthLabel: string
}

export function NocturnasTab({ loading, rows, monthLabel }: NocturnasTabProps) {
  const ranking = useMemo(() => aggregateNocturnas(rows), [rows])
  const totalNocturnas = useMemo(() => ranking.reduce((s, r) => s + r.horas_nocturnas, 0), [ranking])

  if (loading) return <Skeleton className="h-80 w-full" />

  return (
    <div className="space-y-6">
      <TremorCard>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#364f6b]/10">
            <Moon className="w-5 h-5 text-[#364f6b]" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total horas nocturnas · {monthLabel}</p>
            <p className="text-2xl font-bold text-[#364f6b]">{formatHoras(totalNocturnas)}</p>
          </div>
        </div>
      </TremorCard>

      <TremorCard title="Horas nocturnas por empleado" icon={<Moon className="w-4 h-4 text-[#364f6b]" />}>
        {ranking.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No hay horas nocturnas (22:00–06:00) registradas este mes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-right">Turnos con nocturnidad</TableHead>
                  <TableHead className="text-right">Horas nocturnas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r) => (
                  <TableRow key={r.connecteam_user_id}>
                    <TableCell className="font-medium text-[#364f6b]">{r.first_name}</TableCell>
                    <TableCell className="text-right text-slate-500">{r.num_turnos}</TableCell>
                    <TableCell className="text-right font-semibold text-[#364f6b]">
                      {formatHoras(r.horas_nocturnas)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3">Franja nocturna: 22:00–06:00 hora local Madrid.</p>
      </TremorCard>
    </div>
  )
}
