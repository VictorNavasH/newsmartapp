// --- POOL BANCARIO TYPES ---

export interface PoolBancarioResumen {
  total_prestamos_activos: number
  prestamos_pagados: number
  capital_total_original: number
  saldo_pendiente_total: number
  capital_total_amortizado: number
  porcentaje_amortizado: number
  cuota_mensual_total: number
  total_intereses_pagados: number
  total_intereses_pendientes: number
  proxima_finalizacion: string
  ultima_finalizacion: string
}

export interface PoolBancarioPrestamo {
  prestamo_id: string
  nombre_prestamo: string
  banco: string
  banco_logo: string | null
  capital_inicial: number
  saldo_pendiente: number
  capital_amortizado: number
  porcentaje_amortizado: number
  cuota_mensual: number
  tasa_interes: number
  tipo_interes_texto: string
  dia_cobro: number
  fecha_inicio: string
  fecha_fin: string
  estado: "activo" | "liquidado" | string
  cuotas_pagadas: number
  cuotas_pendientes: number
  cuotas_totales: number
  proxima_cuota_fecha: string | null
  proxima_cuota_importe: number | null
  intereses_pagados: number
  intereses_pendientes: number
}

export interface PoolBancarioVencimiento {
  prestamo_id: string
  nombre_prestamo: string
  banco: string
  banco_logo: string | null
  dia_cobro: number
  numero_cuota: number
  fecha_vencimiento: string
  importe_cuota: number
  capital: number
  intereses: number
  saldo_tras_pago: number
  dias_hasta_vencimiento: number
  estado_vencimiento: "vencido" | "hoy" | "proximo" | "este_mes" | "futuro"
}

export interface PoolBancarioPorBanco {
  banco: string
  banco_logo: string | null
  num_prestamos: number
  capital_total: number
  saldo_pendiente: number
  capital_amortizado: number
  porcentaje_amortizado: number
  cuota_mensual: number
  porcentaje_del_total: number
  proxima_finalizacion: string
  ultima_finalizacion: string
}

export interface PoolBancarioCalendarioMes {
  mes_id: string
  mes: string
  año: number
  num_cuotas: number
  total_cuota: number
  total_capital: number
  total_intereses: number
  detalle: string
}
