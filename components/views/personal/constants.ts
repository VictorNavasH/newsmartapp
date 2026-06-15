import { Users, CalendarClock, Clock, CalendarOff, Moon } from "lucide-react"
import type {
  Worker,
  HorasExtraSemana,
  Puntualidad,
  HorasNocturnas,
  ResumenEmpleadoMes,
  PuntualidadEmpleado,
  NocturnasEmpleado,
} from "@/types"

// Pestañas de la vista Personal (mismo formato que el MenuBar de Tesorería)
export const PERSONAL_MENU_ITEMS = [
  {
    icon: Users,
    label: "Trabajadores",
    href: "#",
    gradient: "radial-gradient(circle, rgba(2,177,196,0.15) 0%, rgba(2,177,196,0) 70%)",
    iconColor: "text-[#02b1c4]",
  },
  {
    icon: CalendarClock,
    label: "Resumen",
    href: "#",
    gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(23,195,178,0) 70%)",
    iconColor: "text-[#17c3b2]",
  },
  {
    icon: Clock,
    label: "Puntualidad",
    href: "#",
    gradient: "radial-gradient(circle, rgba(34,124,157,0.15) 0%, rgba(34,124,157,0) 70%)",
    iconColor: "text-[#227c9d]",
  },
  {
    icon: CalendarOff,
    label: "Ausencias",
    href: "#",
    gradient: "radial-gradient(circle, rgba(255,203,119,0.15) 0%, rgba(255,203,119,0) 70%)",
    iconColor: "text-[#ffcb77]",
  },
  {
    icon: Moon,
    label: "Nocturnas",
    href: "#",
    gradient: "radial-gradient(circle, rgba(54,79,107,0.15) 0%, rgba(54,79,107,0) 70%)",
    iconColor: "text-[#364f6b]",
  },
] as const

export type PersonalTab = "Trabajadores" | "Resumen" | "Puntualidad" | "Ausencias" | "Nocturnas"

// --- Helpers de formato ---

/** Nombre legible: "Nombre A." */
export function displayName(w: Pick<Worker, "first_name" | "last_name">): string {
  const apellido = w.last_name?.trim()
  return apellido ? `${w.first_name} ${apellido.charAt(0)}.` : w.first_name
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.charAt(0) || "") + (parts[1]?.charAt(0) || "")).toUpperCase()
}

/** Horas numéricas a "12,5 h" */
export function formatHoras(h: number | null | undefined): string {
  if (h === null || h === undefined) return "—"
  return `${h.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} h`
}

/** Convierte un timestamptz UTC a hora local Madrid "HH:mm". */
export function horaMadrid(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Color de cumplimiento/puntualidad (verde/ámbar/rojo) */
export function semaforo(pct: number): string {
  if (pct >= 90) return "#17c3b2"
  if (pct >= 70) return "#ffcb77"
  return "#fe6d73"
}

// --- Agregaciones (cliente) ---

/**
 * Agrega las semanas ISO de un empleado en un resumen mensual.
 * El % de cumplimiento es computables / contrato del periodo.
 */
export function aggregateResumen(semanas: HorasExtraSemana[]): ResumenEmpleadoMes[] {
  const map = new Map<number, ResumenEmpleadoMes>()
  for (const s of semanas) {
    let r = map.get(s.connecteam_user_id)
    if (!r) {
      r = {
        connecteam_user_id: s.connecteam_user_id,
        first_name: s.first_name,
        horas_trabajadas: 0,
        horas_ausencia: 0,
        horas_computables: 0,
        horas_contrato: 0,
        horas_extra: 0,
        dias_trabajados: 0,
        dias_ausencia: 0,
        cumplimiento: null,
      }
      map.set(s.connecteam_user_id, r)
    }
    r.horas_trabajadas += s.horas_trabajadas ?? 0
    r.horas_ausencia += s.horas_ausencia ?? 0
    r.horas_computables += s.horas_computables ?? 0
    r.horas_contrato += s.horas_contrato ?? 0
    r.horas_extra += s.horas_extra ?? 0
    r.dias_trabajados += Number(s.dias_trabajados) || 0
    r.dias_ausencia += Number(s.dias_ausencia) || 0
  }
  const out = Array.from(map.values())
  for (const r of out) {
    r.cumplimiento = r.horas_contrato > 0 ? (r.horas_computables / r.horas_contrato) * 100 : null
  }
  return out.sort((a, b) => b.horas_trabajadas - a.horas_trabajadas)
}

/** Ranking de puntualidad por empleado. */
export function aggregatePuntualidad(rows: Puntualidad[]): PuntualidadEmpleado[] {
  const map = new Map<number, { first_name: string; total: number; tarde: number; sumRetrasoTarde: number }>()
  for (const p of rows) {
    let r = map.get(p.connecteam_user_id)
    if (!r) {
      r = { first_name: p.first_name, total: 0, tarde: 0, sumRetrasoTarde: 0 }
      map.set(p.connecteam_user_id, r)
    }
    r.total += 1
    if (p.llego_tarde) {
      r.tarde += 1
      r.sumRetrasoTarde += Math.max(0, p.retraso_min ?? 0)
    }
  }
  return Array.from(map.entries())
    .map(([id, r]) => ({
      connecteam_user_id: id,
      first_name: r.first_name,
      num_fichajes: r.total,
      num_tarde: r.tarde,
      pct_tarde: r.total > 0 ? (r.tarde / r.total) * 100 : 0,
      retraso_medio: r.tarde > 0 ? r.sumRetrasoTarde / r.tarde : 0,
    }))
    .sort((a, b) => b.pct_tarde - a.pct_tarde)
}

/** Horas nocturnas agregadas por empleado. */
export function aggregateNocturnas(rows: HorasNocturnas[]): NocturnasEmpleado[] {
  const map = new Map<number, NocturnasEmpleado>()
  for (const n of rows) {
    if (!n.horas_nocturnas || n.horas_nocturnas <= 0) continue
    let r = map.get(n.connecteam_user_id)
    if (!r) {
      r = { connecteam_user_id: n.connecteam_user_id, first_name: n.first_name, horas_nocturnas: 0, num_turnos: 0 }
      map.set(n.connecteam_user_id, r)
    }
    r.horas_nocturnas += n.horas_nocturnas
    r.num_turnos += 1
  }
  return Array.from(map.values()).sort((a, b) => b.horas_nocturnas - a.horas_nocturnas)
}
