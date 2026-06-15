"use client"

import { useMemo } from "react"
import { Users, UserCheck, CalendarOff, CircleDot } from "lucide-react"
import { TremorCard } from "@/components/ui/TremorCard"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { Worker, ScheduledShift, TimeActivity, AusenciaDia } from "@/types"
import { displayName, initials, horaMadrid } from "./constants"

interface TrabajadoresTabProps {
  loading: boolean
  hoy: string // YYYY-MM-DD (local Madrid)
  workers: Worker[]
  turnos: ScheduledShift[] // rango hoy .. +6 días
  fichajesHoy: TimeActivity[]
  ausenciasDia: AusenciaDia[] // rango hoy .. +6 días
  showArchived: boolean
  onToggleArchived: (v: boolean) => void
}

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]

function estadoFichaje(fichaje: TimeActivity | undefined): { label: string; tone: "neutral" | "ok" | "live" } {
  if (!fichaje || !fichaje.clock_in) return { label: "Programado", tone: "neutral" }
  if (fichaje.clock_in && !fichaje.clock_out) return { label: "Fichado · trabajando", tone: "live" }
  return { label: "Jornada completada", tone: "ok" }
}

export function TrabajadoresTab({
  loading,
  hoy,
  workers,
  turnos,
  fichajesHoy,
  ausenciasDia,
  showArchived,
  onToggleArchived,
}: TrabajadoresTabProps) {
  const workersById = useMemo(() => {
    const m = new Map<number, Worker>()
    workers.forEach((w) => m.set(w.connecteam_user_id, w))
    return m
  }, [workers])

  const fichajeByUser = useMemo(() => {
    const m = new Map<number, TimeActivity>()
    fichajesHoy.forEach((f) => m.set(f.connecteam_user_id, f))
    return m
  }, [fichajesHoy])

  // Turnos de HOY
  const turnosHoy = useMemo(() => turnos.filter((t) => t.shift_date === hoy), [turnos, hoy])
  const ausenciasHoy = useMemo(() => ausenciasDia.filter((a) => a.dia === hoy), [ausenciasDia, hoy])

  // Próximos días (hoy incluido): map fecha -> usuarios
  const proximos = useMemo(() => {
    const m = new Map<string, Set<number>>()
    turnos.forEach((t) => {
      if (!m.has(t.shift_date)) m.set(t.shift_date, new Set())
      m.get(t.shift_date)!.add(t.connecteam_user_id)
    })
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 7)
  }, [turnos])

  const plantillaActiva = useMemo(() => workers.filter((w) => !w.is_archived).length, [workers])
  const personasHoy = useMemo(
    () => new Set(turnosHoy.map((t) => t.connecteam_user_id)).size,
    [turnosHoy],
  )

  const plantillaVisible = useMemo(
    () => (showArchived ? workers : workers.filter((w) => !w.is_archived)),
    [workers, showArchived],
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const fmtDia = (d: string) => {
    const date = new Date(`${d}T12:00:00`)
    return `${DIAS[date.getDay()]} ${date.getDate()}`
  }

  return (
    <div className="space-y-6">
      {/* KPIs HOY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TremorCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#02b1c4]/10">
              <UserCheck className="w-5 h-5 text-[#02b1c4]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Trabajan hoy</p>
              <p className="text-2xl font-bold text-[#364f6b]">{personasHoy}</p>
            </div>
          </div>
        </TremorCard>
        <TremorCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#ffcb77]/15">
              <CalendarOff className="w-5 h-5 text-[#d99a2b]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ausentes hoy</p>
              <p className="text-2xl font-bold text-[#364f6b]">{ausenciasHoy.length}</p>
            </div>
          </div>
        </TremorCard>
        <TremorCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#17c3b2]/10">
              <Users className="w-5 h-5 text-[#17c3b2]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Plantilla activa</p>
              <p className="text-2xl font-bold text-[#364f6b]">{plantillaActiva}</p>
            </div>
          </div>
        </TremorCard>
      </div>

      {/* QUIÉN TRABAJA HOY */}
      <TremorCard title="Hoy en el restaurante" icon={<CircleDot className="w-4 h-4 text-[#02b1c4]" />}>
        {turnosHoy.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No hay turnos publicados para hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnosHoy.map((t, idx) => {
                  const w = workersById.get(t.connecteam_user_id)
                  const est = estadoFichaje(fichajeByUser.get(t.connecteam_user_id))
                  return (
                    <TableRow key={`${t.connecteam_user_id}-${idx}`}>
                      <TableCell className="font-medium text-[#364f6b]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#02b1c4]/10 text-[#02b1c4] text-xs font-bold">
                            {w ? initials(displayName(w)) : "?"}
                          </span>
                          {w ? displayName(w) : `#${t.connecteam_user_id}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">{w?.puesto || "—"}</TableCell>
                      <TableCell className="text-slate-500">{t.title || "—"}</TableCell>
                      <TableCell className="text-slate-600">
                        {horaMadrid(t.start_time)} – {horaMadrid(t.end_time)}
                      </TableCell>
                      <TableCell>
                        {est.tone === "ok" && (
                          <Badge className="bg-[#17c3b2]/10 text-[#17c3b2] border-transparent">{est.label}</Badge>
                        )}
                        {est.tone === "live" && (
                          <Badge className="bg-[#02b1c4]/10 text-[#02b1c4] border-transparent">{est.label}</Badge>
                        )}
                        {est.tone === "neutral" && (
                          <Badge variant="outline" className="text-slate-500">
                            {est.label}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {ausenciasHoy.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">
            Ausentes hoy: {ausenciasHoy.map((a) => `${a.first_name} (${a.tipo})`).join(", ")}
          </p>
        )}
      </TremorCard>

      {/* PRÓXIMOS DÍAS */}
      <TremorCard title="Próximos 7 días" icon={<CalendarOff className="w-4 h-4 text-[#227c9d]" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {proximos.map(([dia, users]) => (
            <div
              key={dia}
              className={`rounded-lg border p-3 text-center ${
                dia === hoy ? "border-[#02b1c4] bg-[#02b1c4]/5" : "border-slate-200"
              }`}
            >
              <p className="text-xs text-slate-400 capitalize">{fmtDia(dia)}</p>
              <p className="text-xl font-bold text-[#364f6b]">{users.size}</p>
              <p className="text-[11px] text-slate-400">personas</p>
            </div>
          ))}
          {proximos.length === 0 && (
            <p className="text-sm text-slate-400 col-span-full py-2">Sin turnos programados próximos.</p>
          )}
        </div>
      </TremorCard>

      {/* PLANTILLA */}
      <TremorCard
        title="Plantilla"
        icon={<Users className="w-4 h-4 text-[#364f6b]" />}
        actions={
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => onToggleArchived(e.target.checked)}
              className="accent-[#02b1c4]"
            />
            Mostrar archivados
          </label>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="text-right">Horas/sem</TableHead>
                <TableHead>Antigüedad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plantillaVisible.map((w) => (
                <TableRow key={w.connecteam_user_id}>
                  <TableCell className="font-medium text-[#364f6b]">{displayName(w)}</TableCell>
                  <TableCell className="text-slate-500">{w.puesto || "—"}</TableCell>
                  <TableCell className="text-slate-500">{w.equipos || "—"}</TableCell>
                  <TableCell className="text-slate-500">{w.contrato || "—"}</TableCell>
                  <TableCell className="text-right text-slate-600">
                    {w.horas_contrato != null ? `${w.horas_contrato} h` : "—"}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {w.inicio_relacion_laboral
                      ? new Date(`${w.inicio_relacion_laboral}T12:00:00`).toLocaleDateString("es-ES", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {w.is_archived ? (
                      <Badge variant="outline" className="text-slate-400">
                        Baja
                      </Badge>
                    ) : (
                      <Badge className="bg-[#17c3b2]/10 text-[#17c3b2] border-transparent">Activo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TremorCard>
    </div>
  )
}
