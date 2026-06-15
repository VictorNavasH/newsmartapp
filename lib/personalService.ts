import { supabase } from "./supabase"
import type {
  Worker,
  ScheduledShift,
  TimeActivity,
  Ausencia,
  AusenciaDia,
  HorasExtraSemana,
  Puntualidad,
  HorasNocturnas,
} from "@/types"

// Helper de manejo de errores (mismo criterio que el resto de services)
const handleQueryError = (error: any, functionName: string): void => {
  if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
    console.warn(`[personal] ${functionName}: tabla/vista no existe todavia`)
    return
  }
  console.error(`[personal] Error in ${functionName}:`, error)
}

/** Maestro de empleados. Activos primero, luego por nombre. */
export const fetchWorkers = async (): Promise<Worker[]> => {
  try {
    const { data, error } = await supabase
      .from("connecteam_workers")
      .select(
        "connecteam_user_id, first_name, last_name, puesto, equipos, contrato, horas_contrato, pay_rate, inicio_relacion_laboral, is_archived",
      )
      .order("is_archived", { ascending: true })
      .order("first_name", { ascending: true })

    if (error) {
      handleQueryError(error, "fetchWorkers")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching workers:", err)
    return []
  }
}

/** Turnos programados en un rango de fechas (shift_date ya es fecha local Madrid). */
export const fetchTurnos = async (desde: string, hasta: string): Promise<ScheduledShift[]> => {
  try {
    const { data, error } = await supabase
      .from("connecteam_scheduled_shifts")
      .select("connecteam_user_id, shift_date, start_time, end_time, title, is_published, is_open_shift")
      .gte("shift_date", desde)
      .lte("shift_date", hasta)
      .order("shift_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      handleQueryError(error, "fetchTurnos")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching turnos:", err)
    return []
  }
}

/** Fichajes reales de un día concreto. */
export const fetchFichajesDia = async (fecha: string): Promise<TimeActivity[]> => {
  try {
    const { data, error } = await supabase
      .from("connecteam_time_activities")
      .select("connecteam_user_id, clock_in, clock_out, worked_hours")
      .eq("shift_date", fecha)

    if (error) {
      handleQueryError(error, "fetchFichajesDia")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching fichajes dia:", err)
    return []
  }
}

/** Ausencias por día (desglosadas) dentro de un rango. */
export const fetchAusenciasDia = async (desde: string, hasta: string): Promise<AusenciaDia[]> => {
  try {
    const { data, error } = await supabase
      .from("v_connecteam_ausencias_dia")
      .select("connecteam_user_id, first_name, tipo, dia, horas")
      .gte("dia", desde)
      .lte("dia", hasta)
      .order("dia", { ascending: true })

    if (error) {
      handleQueryError(error, "fetchAusenciasDia")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching ausencias dia:", err)
    return []
  }
}

/** Ausencias legibles que solapan con un rango (mes). */
export const fetchAusencias = async (desde: string, hasta: string): Promise<Ausencia[]> => {
  try {
    const { data, error } = await supabase
      .from("v_connecteam_ausencias")
      .select("connecteam_user_id, first_name, tipo, start_date, end_date, is_all_day, duracion, unidad")
      .lte("start_date", hasta)
      .gte("end_date", desde)
      .order("start_date", { ascending: true })

    if (error) {
      handleQueryError(error, "fetchAusencias")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching ausencias:", err)
    return []
  }
}

/**
 * Semanas ISO cuyo lunes (semana_inicio) cae dentro del mes seleccionado.
 * Criterio: atribuimos cada semana al mes en el que empieza (evita doble conteo).
 */
export const fetchResumenSemanas = async (
  monthStart: string,
  monthEnd: string,
): Promise<HorasExtraSemana[]> => {
  try {
    const { data, error } = await supabase
      .from("v_connecteam_horas_extra_semana")
      .select(
        "connecteam_user_id, first_name, semana_inicio, semana_fin, semana_iso, horas_trabajadas, horas_ausencia, horas_computables, horas_contrato, horas_extra, dias_trabajados, dias_ausencia",
      )
      .gte("semana_inicio", monthStart)
      .lte("semana_inicio", monthEnd)
      .order("semana_inicio", { ascending: true })

    if (error) {
      handleQueryError(error, "fetchResumenSemanas")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching resumen semanas:", err)
    return []
  }
}

/** Retrasos por fichaje dentro de un rango (mes). */
export const fetchPuntualidad = async (desde: string, hasta: string): Promise<Puntualidad[]> => {
  try {
    const { data, error } = await supabase
      .from("v_connecteam_puntualidad")
      .select(
        "connecteam_user_id, first_name, shift_date, turno_programado, fichaje_entrada, turno_madrid, entrada_madrid, retraso_min, llego_tarde, turno_titulo",
      )
      .gte("shift_date", desde)
      .lte("shift_date", hasta)
      .order("shift_date", { ascending: false })

    if (error) {
      handleQueryError(error, "fetchPuntualidad")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching puntualidad:", err)
    return []
  }
}

/** Horas nocturnas por turno dentro de un rango (mes). */
export const fetchNocturnas = async (desde: string, hasta: string): Promise<HorasNocturnas[]> => {
  try {
    const { data, error } = await supabase
      .from("v_connecteam_horas_nocturnas")
      .select("connecteam_user_id, first_name, shift_date, clock_in, clock_out, worked_hours, horas_nocturnas")
      .gte("shift_date", desde)
      .lte("shift_date", hasta)
      .order("shift_date", { ascending: false })

    if (error) {
      handleQueryError(error, "fetchNocturnas")
      return []
    }
    return data || []
  } catch (err) {
    console.error("[personal] Error fetching nocturnas:", err)
    return []
  }
}
