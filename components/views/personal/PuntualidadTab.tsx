"use client"

import { useMemo } from "react"
import { Clock, AlertTriangle } from "lucide-react"
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
import type { Puntualidad } from "@/types"
import { aggregatePuntualidad, semaforo } from "./constants"

interface PuntualidadTabProps {
  loading: boolean
  rows: Puntualidad[]
  monthLabel: string
}

export function PuntualidadTab({ loading, rows, monthLabel }: PuntualidadTabProps) {
  const ranking = useMemo(() => aggregatePuntualidad(rows), [rows])

  const { pctGlobal, retrasoMedio } = useMemo(() => {
    const total = rows.length
    const tarde = rows.filter((r) => r.llego_tarde)
    const sumRetraso = tarde.reduce((s, r) => s + Math.max(0, r.retraso_min ?? 0), 0)
    return {
      pctGlobal: total > 0 ? (tarde.length / total) * 100 : 0,
      retrasoMedio: tarde.length > 0 ? sumRetraso / tarde.length : 0,
    }
  }, [rows])

  if (loading) return <Skeleton className="h-80 w-full" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TremorCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#227c9d]/10">
              <Clock className="w-5 h-5 text-[#227c9d]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">% llegadas tarde</p>
              <p className="text-2xl font-bold" style={{ color: semaforo(100 - pctGlobal) }}>
                {pctGlobal.toFixed(1)}%
              </p>
            </div>
          </div>
        </TremorCard>
        <TremorCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#fe6d73]/10">
              <AlertTriangle className="w-5 h-5 text-[#fe6d73]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Retraso medio (cuando llegan tarde)</p>
              <p className="text-2xl font-bold text-[#364f6b]">{Math.round(retrasoMedio)} min</p>
            </div>
          </div>
        </TremorCard>
      </div>

      <TremorCard
        title={`Ranking de puntualidad · ${monthLabel}`}
        icon={<Clock className="w-4 h-4 text-[#227c9d]" />}
      >
        {ranking.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No hay fichajes con turno programado este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-right">Fichajes</TableHead>
                  <TableHead className="text-right">Tarde</TableHead>
                  <TableHead className="w-40">% tarde</TableHead>
                  <TableHead className="text-right">Retraso medio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r) => (
                  <TableRow key={r.connecteam_user_id}>
                    <TableCell className="font-medium text-[#364f6b]">{r.first_name}</TableCell>
                    <TableCell className="text-right text-slate-500">{r.num_fichajes}</TableCell>
                    <TableCell className="text-right text-slate-600">{r.num_tarde}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, r.pct_tarde)}%`,
                              backgroundColor: semaforo(100 - r.pct_tarde),
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-10 text-right">
                          {Math.round(r.pct_tarde)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.num_tarde > 0 ? (
                        <Badge className="bg-[#ffcb77]/15 text-[#d99a2b] border-transparent">
                          {Math.round(r.retraso_medio)} min
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3">Se considera "tarde" a partir de 5 minutos sobre el turno programado.</p>
      </TremorCard>
    </div>
  )
}
