// --- FACTURACION TYPES ---

export interface FacturacionResumenGlobal {
  total_facturas: number
  total_facturado: number
  base_total: number
  propinas_total: number
  verifactu_ok: number
  verifactu_error: number
  verifactu_pendiente: number
  total_tarjeta: number
  total_efectivo: number
  total_ingresos_consolidados: number
  total_ingresos: number
  pendiente_cobro: number
  alertas_error: number
  alertas_warning: number
}

export interface FacturacionListadoItem {
  id: number
  transaction_id: string
  fecha: string // ISO date
  cuentica_identifier: string | null
  cuentica_serie: string | null
  numero_factura: number
  numero_completo: string
  importe_total: number
  base_imponible: number
  iva: number
  propinas: number
  metodo_pago: string
  metodo_pago_nombre: string
  mesa: string | null
  estado_cuentica: string | null
  verifactu_codigo: number | null
  verifactu_estado: string
  verifactu_estado_nombre: string
  verifactu_estado_color: string
  verifactu_url: string | null
  verifactu_qr: string | null
  error_mensaje: string | null
  cliente_nombre: string | null
  cliente_cif: string | null
  created_at: string
  updated_at: string
  table_id: string | null
  order_numbers: string | null
  webhook_payload: string | null
}

export interface CuadreListadoItem {
  fecha: string // ISO date
  zreport_id: string // UUID
  zreport_documento: string // "Z-1234"
  estado: "cuadrado_auto" | "cuadrado_manual" | "propuesta" | "descuadre" | "pendiente"
  total_facturas: string // Decimal como string
  total_zreport: string
  total_ajustes: string
  diferencia: string
  num_facturas: number
  motivo_pendiente: string | null
}

export interface FacturaZReport {
  factura_id: number
  transaction_id: string
  cuentica_identifier: string
  table_name: string // Mesa
  total_amount: string
  payment_method: string // 'cash' | 'card' | 'google_pay' | 'apple_pay'
  invoice_date: string
  hora: string // HH:MM:SS
  tipo_asociacion: "auto" | "propuesta" | "manual"
  confirmado: boolean
}

export interface ZReportDisponible {
  zreport_id: string
  document_number: string
  fecha_real: string
  total_amount: string
  total_facturas_asociadas: string
  diferencia_actual: string
}

export interface FacturaHuerfana {
  factura_id: string
  transaction_id: string
  cuentica_identifier: string
  total_amount: string
  invoice_date: string
  table_name: string
}

export interface FacturaAdyacente {
  factura_id: string
  transaction_id: string
  cuentica_identifier: string
  total_amount: string
  invoice_date: string
  table_name: string
  zreport_actual_id: string
  zreport_actual_doc: string
}

export interface AjusteCuadre {
  id: number
  tipo: "ajuste_positivo" | "ajuste_negativo" | "comentario"
  importe: number
  descripcion: string
  created_at: string
}

export type CuadreEstadoFilter = "todos" | "pendientes" | "cuadrados" | "descuadres"

// Mantener el tipo antiguo por compatibilidad
export interface FacturacionCuadreDiario {
  fecha: string
  num_facturas: number
  total_facturas: number
  base_facturas: number
  num_zreports: number
  total_zreports: number
  base_zreports: number
  cobrado_zreports: number
  zreports_documentos: string | null
  diferencia: number
  estado_cuadre: string
  estado_cuadre_color: string
  facturas_verifactu_ok: number
  facturas_verifactu_error: number
}

export interface FacturacionTipoIngreso {
  categoria: string
  categoria_nombre: string
  num_documentos: number
  total: number
  base: number
  iva: number
  cobrado: number
  pendiente: number
  pct_total: number
}

export interface FacturacionAlerta {
  tipo_alerta: string
  severidad: string
  fecha: string
  mensaje: string
  importe: number
  referencia: string | null
  detalle: string | null
  fecha_alerta: string
}

export interface FacturacionMensual {
  mes: string
  mes_texto: string
  mes_nombre: string
  num_facturas: number
  total_facturado: number
  base_total: number
  iva_total: number
  propinas_total: number
  ticket_medio: number
  verifactu_ok: number
  verifactu_error: number
  pagos_tarjeta: number
  pagos_efectivo: number
  total_tarjeta: number
  total_efectivo: number
}

export interface BenchmarkItem {
  etiqueta: string
  gasto: number
  pagado: number
  pendiente: number
  ventas: number
  porcentaje: number
  porcentaje_gastos: number
  min_sector: number | null
  max_sector: number | null
}

export interface BenchmarkResumen {
  benchmarks: BenchmarkItem[]
  totales: {
    margen_operativo: number
    margen_operativo_euros: number
    margen_neto: number
    margen_neto_euros: number
    total_gastos: number
    total_ventas: number
  }
}

export interface CrearAjusteParams {
  zreport_id: string
  fecha: string
  tipo: string
  importe: number
  descripcion?: string
}
