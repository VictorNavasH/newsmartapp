// --- DASHBOARD TYPES ---

import type { ShiftMetrics } from './sales'

export interface WeekReservationDay {
  date: string
  dayOfWeek: string // dia_semana (nuevo)
  pax: number
  reservations: number
  reservationsLunch: number
  reservationsDinner: number
  occupancyTotal: number // ocupacion_total_pct (nuevo)
  occupancyLunch: number // ocupacion_comida_pct (nuevo)
  occupancyDinner: number // ocupacion_cena_pct (nuevo)
  status: "low" | "medium" | "high" | "full" | "tranquilo" | "normal" | "fuerte" | "pico"
  isToday: boolean
}

export interface TableBillingMetrics {
  table_id: string
  numero_mesa: number
  nombre_mesa: string
  fecha: string
  turno: "Comida" | "Cena"
  total_facturado: number
  total_propinas: number
  num_facturas: number
  ranking_dia: number
  ranking_turno: number
}

export interface TableAggregatedMetrics {
  table_id: string
  numero_mesa: number
  nombre_mesa: string
  total_facturado: number
  total_propinas: number
  num_facturas: number
  avg_factura: number
  avg_ranking: number
}

// NEW: Financial and Occupancy KPIs for Dashboard
export interface FinancialKPIs {
  periodo: string
  ingresos: number
  gastos: number
  margen: number
  margen_pct: number
  num_facturas: number
  comensales: number
  ticket_medio: number
  ingresos_ant: number
  gastos_ant: number
  ticket_medio_ant: number
  fecha_inicio: string
  fecha_fin: string
}

export interface OcupacionDia {
  fecha: string
  dia_semana: string
  comensales_comida: number
  comensales_cena: number
  total_comensales: number
  ocupacion_total_pct: number
  nivel_ocupacion: "tranquilo" | "normal" | "fuerte" | "pico"
  es_hoy: boolean
}

// NEW: Facturacion Semanal
export interface WeekRevenueDay {
  fecha: string
  diaSemanaCorto: string
  diaMes: string
  tipoDia: "pasado" | "hoy" | "futuro"
  esHoy: boolean
  facturadoReal: number
  prevision: number
  porcentajeAlcanzado: number
  margenErrorPct: number | null
  diferenciaEuros: number | null
  comensalesReservados: number
}

export interface LaborCostDay {
  fecha: string
  ventas_netas: number
  coste_laboral: number
  horas_trabajadas: number
  trabajadores: number
  porcentaje_laboral: number
}

export interface RealTimeData {
  lunch: ShiftMetrics
  dinner: ShiftMetrics
  total: ShiftMetrics
  lunch_percentage: number
  dinner_percentage: number
  prevision: {
    comensales_reservados: number
    comensales_reservados_comida: number
    comensales_reservados_cena: number
    mesas_reservadas: number
    prevision_facturacion: number
    prevision_facturacion_comida: number
    prevision_facturacion_cena: number
    porcentaje_prevision_alcanzado: number
    ticket_comensal_30d: number
    ticket_mesa_30d: number
  }
}
