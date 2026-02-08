// --- YEARLY COMPARISON TYPES ---

export interface MonthlyReservationData {
  mes: number // 1-12
  mes_nombre: string
  total_reservas: number
  total_comensales: number
  reservas_comida: number
  reservas_cena: number
  comensales_comida: number
  comensales_cena: number
  dias_operativos: number // Dias con datos reales (no calendario)
}

export interface YearlyComparisonData {
  año: number
  meses: MonthlyReservationData[]
  totals: {
    reservas: number
    comensales: number
    comensales_comida: number
    comensales_cena: number
  }
}

export interface YearlyTrendInsight {
  currentYear: number
  previousYear: number
  currentYearTotal: number
  previousYearTotal: number
  percentageChange: number
  trend: "up" | "down" | "neutral"
  bestMonth: { mes: string; valor: number }
  worstMonth: { mes: string; valor: number }
  currentDailyAvg?: number
  previousDailyAvg?: number
  currentYearDays?: number
  dayOfYear?: number
}

// --- FORECASTING TYPES ---

export interface ForecastDay {
  fecha: string
  nombre_dia: string
  mes: number
  // Datos reales (pasado) o reservas (futuro)
  comensales_real: number
  comensales_comida_real: number
  comensales_cena_real: number
  // Predicciones (ajustadas por IA)
  comensales_prediccion: number
  comensales_comida_pred: number
  comensales_cena_pred: number
  ventas_prediccion: number
  confianza_prediccion: number // 0 a 1
  // Capacidades del restaurante
  capacidad_turno: number // 66 plazas
  capacidad_dia: number // 132 plazas
  capacidad_mesas: number // 19 mesas
  // Ocupacion en porcentaje (calculada en BD)
  ocupacion_pct_prediccion: number
  ocupacion_pct_comida_pred: number
  ocupacion_pct_cena_pred: number
  ocupacion_pct_real: number
  ocupacion_pct_comida_real: number
  ocupacion_pct_cena_real: number
  // Nivel de ocupacion calculado en BD (tranquilo, normal, fuerte, pico)
  nivel_ocupacion: "tranquilo" | "normal" | "fuerte" | "pico"
  // Evaluacion (solo fechas pasadas)
  error_prediccion: number | null
  error_porcentaje: number | null
  // Contexto
  nivel_lluvia: string | null
  temp_max: number | null
  es_festivo: boolean
  evento_principal: string | null
  // Comparativas
  comensales_semana_ant: number | null
  comensales_año_ant: number | null
  // Tipo
  tipo_fecha: "pasado" | "hoy" | "futuro"
}

export interface ForecastKPIs {
  prediccion_hoy: number
  reservas_hoy: number
  ocupacion_semana: number
  precision_modelo: number
}

export interface ForecastHistorico {
  fecha: string
  prediccion: number
  real: number
  diferencia: number
  error_pct: number
}

export interface ForecastPrecision {
  semanas: ForecastHistorico[]
  precision_media: number
  media_error_pct?: number
  mejor_dia: { fecha: string; error: number }
  peor_dia: { fecha: string; error: number }
}

export interface PeriodComparisonAggregate {
  total_reservas: number
  total_comensales: number
  reservas_comida: number
  reservas_cena: number
  comensales_comida: number
  comensales_cena: number
  dias_operativos: number
}
