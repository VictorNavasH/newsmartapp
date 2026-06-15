// Tipos del dominio Personal (datos de Connecteam sincronizados en Supabase).
// Clave de unión entre todo: connecteam_user_id.

/** Maestro de empleados — tabla connecteam_workers */
export interface Worker {
  connecteam_user_id: number
  first_name: string
  last_name: string | null
  puesto: string | null
  equipos: string | null
  contrato: string | null
  horas_contrato: number | null // horas SEMANALES de contrato
  pay_rate: number | null
  inicio_relacion_laboral: string | null
  is_archived: boolean
}

/** Turno programado — connecteam_scheduled_shifts */
export interface ScheduledShift {
  connecteam_user_id: number
  shift_date: string // fecha local Madrid (YYYY-MM-DD)
  start_time: string | null // timestamptz UTC
  end_time: string | null // timestamptz UTC
  title: string | null
  is_published: boolean
  is_open_shift: boolean
}

/** Fichaje real del día — connecteam_time_activities */
export interface TimeActivity {
  connecteam_user_id: number
  clock_in: string | null // timestamptz UTC (null si no ha fichado)
  clock_out: string | null // timestamptz UTC (null si sigue fichado)
  worked_hours: number | null
}

/** Ausencia legible — v_connecteam_ausencias */
export interface Ausencia {
  connecteam_user_id: number
  first_name: string
  tipo: string
  start_date: string
  end_date: string
  is_all_day: boolean
  duracion: number | null
  unidad: string | null
}

/** Ausencia desglosada por día — v_connecteam_ausencias_dia */
export interface AusenciaDia {
  connecteam_user_id: number
  first_name: string
  tipo: string
  dia: string
  horas: number | null
}

/** Horas y extra por semana ISO — v_connecteam_horas_extra_semana */
export interface HorasExtraSemana {
  connecteam_user_id: number
  first_name: string
  semana_inicio: string
  semana_fin: string
  semana_iso: string
  horas_trabajadas: number | null
  horas_ausencia: number | null
  horas_computables: number | null
  horas_contrato: number | null
  horas_extra: number | null
  dias_trabajados: number
  dias_ausencia: number
}

/** Retrasos por fichaje — v_connecteam_puntualidad */
export interface Puntualidad {
  connecteam_user_id: number
  first_name: string
  shift_date: string
  turno_programado: string | null
  fichaje_entrada: string | null
  turno_madrid: string | null
  entrada_madrid: string | null
  retraso_min: number | null
  llego_tarde: boolean
  turno_titulo: string | null
}

/** Horas nocturnas por turno — v_connecteam_horas_nocturnas */
export interface HorasNocturnas {
  connecteam_user_id: number
  first_name: string
  shift_date: string
  clock_in: string | null
  clock_out: string | null
  worked_hours: number | null
  horas_nocturnas: number | null
}

// --- Tipos agregados/derivados (calculados en cliente) ---

/** Resumen mensual por empleado (agregando las semanas ISO del mes) */
export interface ResumenEmpleadoMes {
  connecteam_user_id: number
  first_name: string
  horas_trabajadas: number
  horas_ausencia: number
  horas_computables: number
  horas_contrato: number // suma de horas de contrato de las semanas del mes
  horas_extra: number
  dias_trabajados: number
  dias_ausencia: number
  cumplimiento: number | null // % computables / contrato (null si sin contrato)
}

/** Ranking de puntualidad por empleado (mes) */
export interface PuntualidadEmpleado {
  connecteam_user_id: number
  first_name: string
  num_fichajes: number
  num_tarde: number
  pct_tarde: number
  retraso_medio: number // minutos (solo sobre los que llegaron tarde)
}

/** Horas nocturnas agregadas por empleado (mes) */
export interface NocturnasEmpleado {
  connecteam_user_id: number
  first_name: string
  horas_nocturnas: number
  num_turnos: number
}
