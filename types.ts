// --- Domain Models ---

export type ShiftType = "LUNCH" | "DINNER"

export interface PaymentMethods {
  card: number
  cash: number
  digital: number // Apps, Apple Pay specifically tracked if needed
}

export interface SalesItem {
  id: string
  name: string
  category: string
  quantity: number
  revenue: number
}

export interface CategorySales {
  name: string
  quantity: number
  revenue: number
}

export interface ModifierStats {
  with_options: number // Count of items sold with modifiers
  without_options: number
  total_items: number // Sub-set of items that actually HAVE options
}

export interface SalesBreakdown {
  categories: CategorySales[]
  top_products: SalesItem[]
  // In a real DB we query "Bottom 10", here we just store the full list or a subset
  all_products: SalesItem[]
  modifiers: ModifierStats
}

export interface ExpenseStats {
  total: number
  paid: number
  overdue: number
  pending: number
  by_category: Record<string, number> // Key: Category Name, Value: Amount
}

export interface Invoice {
  id: string
  provider: string
  amount: number
  dueDate: string // ISO Date string
  category: string
}

// NEW: Issued Invoice for Facturación Page
export interface IssuedInvoice {
  id: string
  ticketNumber: string
  date: string // ISO string including time
  amount: number
  table: string
  paymentMethod: "Tarjeta" | "Efectivo" | "Otros"
  status: "paid" | "refunded"
  verifactuStatus: "success" | "error" | "pending"
  verifactuHash?: string // Mock hash
}

export interface TableSales {
  id: string
  name: string
  revenue: number
}

export interface ShiftMetrics {
  reservations: number
  pax: number
  tables: number
  occupancy_rate: number // Percentage 0-100

  // Averages - Operational
  avg_pax_per_res: number
  avg_pax_per_table: number

  tables_used: number // mesas_ocupadas
  table_rotation: number // rotacion_mesas
  avg_pax_per_table_used: number // media_comensales_por_mesa

  // Financials
  revenue: number
  tips: number
  tips_count: number // Number of times a tip was left
  transactions: number // Number of tickets/sales
  avg_ticket_transaction: number // Revenue / Transactions

  // VeriFactu Realtime Status
  verifactu_metrics: {
    success: number
    error: number
    pending: number
  }

  // Expenses
  expenses: ExpenseStats

  // Averages - Financial
  avg_ticket_res: number
  avg_ticket_pax: number
  avg_ticket_table: number

  payment_methods: PaymentMethods

  // Product Sales Data
  sales_data: SalesBreakdown

  // Table Breakdown
  tables_breakdown: TableSales[]
}

export interface DailyCompleteMetrics {
  date: string
  // Aggregated totals
  total: ShiftMetrics
  // Shift breakdowns
  lunch: ShiftMetrics
  dinner: ShiftMetrics
  capacity?: {
    plazas_turno: number // 66
    plazas_dia: number // 132
    mesas_turno: number // 19
    mesas_dia: number // 38
  }
}

export interface ComparisonResult {
  value: number
  previous: number
  delta: number // Percentage
  trend: "up" | "down" | "neutral"
}

export interface MetricComparison {
  current: number
  comparison: ComparisonResult
}

// --- Component Props Interfaces ---

export interface DateRange {
  from: Date
  to: Date
}

// --- AI Types ---
export interface InsightResponse {
  insight: string
  actionableTip: string
}

export type PeriodComparison = "prev_day" | "prev_week" | "prev_month" | "prev_year"

// --- WEATHER TYPES ---
export interface WeatherDay {
  date: string
  maxTemp: number
  minTemp: number
  lunchCode: number // Weather at 14:00
  dinnerCode: number // Weather at 21:00
}

// --- DASHBOARD TYPES ---
export interface WeekReservationDay {
  date: string
  pax: number
  reservations: number
  reservationsLunch: number
  reservationsDinner: number
  status: "low" | "medium" | "high" | "full"
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

export interface ExpenseTag {
  tag_name: string
  num_gastos: number
}

export interface ExpenseTagInfo {
  name: string
  normalized_name: string
}

export interface Expense {
  id: string
  cuentica_id: number
  fecha: string
  mes: string
  document_number: string
  status: "partial" | "pending" | "overdue"
  total_amount: number
  base_amount: number
  tax_amount: number
  due_date: string | null
  categoria_codigo: string
  categoria_nombre: string
  grupo_categoria: string
  proveedor: string
  tags: ExpenseTagInfo[]
}

export interface ExpenseTagSummary {
  tag_name: string
  num_facturas: number
  total: number
  pagado: number
  pendiente: number
}

export interface ExpenseProviderSummary {
  proveedor: string
  num_facturas: number
  total: number
  pagado: number
  pendiente: number
  vencido: number
}

export interface OperacionesResumen {
  mesas_activas: number
  total_pedidos: number
  total_items: number
  total_unidades: number
  items_sin_confirmar: number
  items_en_preparacion: number
  items_listos_servir: number
  items_entregados: number
  importe_entregado: number
  importe_total_pedido: number
  tiempo_medio_preparacion: number | null
  tiempo_max_preparacion: number | null
  tiempo_medio_espera_servir: number | null
  tiempo_max_espera: number | null
  items_criticos: number
  items_bebida: number
  items_comida: number
  items_postre: number
  turno_actual: "comida" | "cena" | null
}

export interface OperacionesMesa {
  mesa: string
  num_pedidos: number
  total_items: number
  sin_confirmar: number
  en_preparacion: number
  listos: number
  entregados: number
  importe_total: number
  max_espera_min: number | null
  primer_pedido: string
  ultimo_pedido: string
  items_criticos: number
}

export interface OperacionesItemCola {
  item_id: string
  mesa: string
  producto: string
  categoria: string
  unidades: number
  estado: "sin_confirmar" | "en_preparacion" | "listo_servir"
  minutos_espera: number
}

export interface OperacionesData {
  fecha: string
  resumen: OperacionesResumen
  mesas: OperacionesMesa[]
  cola_cocina: OperacionesItemCola[] | null
  actualizado_at: string
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

// --- PRODUCT MIX TYPES ---
export interface ProductMixItem {
  fecha: string
  mes: string
  dia_semana: number
  turno_id: number
  turno_nombre: string
  product_sku: string
  producto_nombre: string
  category_sku: string
  categoria_nombre: string
  precio_carta: number
  coste_unitario: number | null
  unidades: number
  facturado: number
  precio_medio_real: number
  diferencia_precio: number
  pct_unidades_dia: number
  pct_facturado_dia: number
  pct_unidades_global: number
  pct_facturado_global: number
  ranking_dia_facturado: number
  ranking_dia_unidades: number
  unidades_void: number
  facturado_void: number
  pct_void_producto: number
  pct_unidades_void_dia: number
  pct_facturado_void_dia: number
  ranking_dia_void: number
}

export interface CategoryMixItem {
  fecha: string
  mes: string
  dia_semana: number
  turno_id: number
  turno_nombre: string
  category_sku: string
  categoria_nombre: string
  productos_distintos: number
  unidades: number
  facturado: number
  ticket_medio_item: number
  pct_unidades_dia: number
  pct_facturado_dia: number
  pct_unidades_global: number
  pct_facturado_global: number
  ranking_dia: number
  unidades_void: number
  facturado_void: number
  pct_void_categoria: number
  pct_unidades_void_dia: number
  pct_facturado_void_dia: number
  ranking_dia_void: number
}

export interface OptionMixItem {
  fecha: string
  mes: string
  turno_id: number
  turno_nombre: string
  option_sku: string
  option_name: string
  precio_opcion: number
  producto_sku: string
  producto_nombre: string
  category_sku: string
  categoria_nombre: string
  veces_seleccionada: number
  facturado_extra: number
  penetracion_pct: number
  es_extra_pago: boolean
  ranking_dia_facturado: number
  veces_void: number
  facturado_void: number
  pct_void_opcion: number
  ranking_dia_void: number
}

// --- OTHER TYPES ---
export interface ProductAggregated {
  product_sku: string
  producto_nombre: string
  categoria_nombre: string
  precio_carta: number
  unidades: number
  facturado: number
  precio_medio_real: number
  diferencia_precio: number
  pct_facturado: number
  pct_unidades: number
  unidades_void: number
  facturado_void: number
  pct_void: number
}

export interface CategoryAggregated {
  category_sku: string
  categoria_nombre: string
  productos_distintos: number
  unidades: number
  facturado: number
  ticket_medio_item: number
  pct_facturado: number
  pct_unidades: number
  unidades_void: number
  facturado_void: number
  pct_void: number
}

export interface OptionAggregated {
  option_sku: string
  option_name: string
  precio_opcion: number
  producto_nombre: string
  categoria_nombre: string
  veces_seleccionada: number
  facturado_extra: number
  penetracion_pct: number
  es_extra_pago: boolean
  veces_void: number
  facturado_void: number
  pct_void: number
}

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
  dias_operativos: number // Días con datos reales (no calendario)
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
  // Ocupación en porcentaje (calculada en BD)
  ocupacion_pct_prediccion: number
  ocupacion_pct_comida_pred: number
  ocupacion_pct_cena_pred: number
  ocupacion_pct_real: number
  ocupacion_pct_comida_real: number
  ocupacion_pct_cena_real: number
  // Nivel de ocupación calculado en BD (tranquilo, normal, fuerte, pico)
  nivel_ocupacion: "tranquilo" | "normal" | "fuerte" | "pico"
  // Evaluación (solo fechas pasadas)
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
  mejor_dia: { fecha: string; error: number }
  peor_dia: { fecha: string; error: number }
}

// --- OPERATIVA ANALYTICS TYPES ---
export interface OperativaItem {
  item_id: string
  order_id: string
  mesa: string
  seat: string
  product_sku: string
  producto: string
  category_sku: string
  categoria: string
  tipo: "comida" | "bebida" | "postre"
  price_total: number
  confirmed_at: string
  ready_at: string
  delivered_at: string
  minutos_cocina: number // confirmed → ready
  minutos_sala: number // ready → delivered
  minutos_total: number // confirmed → delivered
  minutos_operativo: number // métrica principal según tipo
  fecha: string
  hora: number
  dia_semana: number // 0=domingo, 6=sábado
  analizar: boolean // false para postres
}

export interface OperativaKPI {
  fecha: string
  items_servidos: number
  items_comida: number
  items_bebida: number
  tiempo_medio_cocina: number
  tiempo_medio_sala: number
  alertas_30min: number
  alertas_45min: number
}

export interface OperativaProducto {
  producto: string
  categoria: string
  tipo: "comida" | "bebida"
  total_pedidos: number
  tiempo_medio: number
  mediana: number
  tiempo_min: number
  tiempo_max: number
}

export interface OperativaCliente {
  order_id: string
  mesa: string
  seat: string
  fecha: string
  primer_pedido: string
  ultima_entrega: string
  minutos_experiencia_cliente: number
  total_items: number
  items_comida: number
  items_bebida: number
  total_pagado: number
}

export interface OperativaPorHora {
  hora: number
  items_servidos: number
  tiempo_medio_cocina: number
  tiempo_medio_sala: number
}

// --- TREASURY MODELS ---
export interface TreasuryKPIs {
  saldo_total: number
  ingresos_periodo: number
  gastos_periodo: number
  ingresos_anterior: number
  gastos_anterior: number
  transacciones_sin_categorizar: number
  num_cuentas: number
}

export interface TreasuryAccount {
  id: string
  bank_name: string
  account_name: string
  iban: string
  balance: number
  currency: string
  last_sync: string | null
  is_active: boolean
  bank_logo: string | null
}

export interface TreasuryTransaction {
  id: string
  account_id: string
  account_name: string
  bank_name: string
  bank_logo: string | null
  booking_date: string
  value_date: string
  amount: number
  currency: string
  description: string
  category_id: string | null
  category_name: string | null
  category_type: string | null
  subcategory_id: string | null
  subcategory_name: string | null
  counterparty_name: string | null
  reference: string | null
}

export interface TreasuryTransactionsSummary {
  total_ingresos: number
  total_gastos: number
  num_transacciones: number
  num_sin_categorizar: number
}

export interface TreasurySubcategory {
  id: string
  name: string
}

export interface TreasuryCategory {
  id: string
  name: string
  type: string
  icon: string | null
  subcategories: TreasurySubcategory[]
}

export interface TreasuryCategoryBreakdown {
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  total_ingresos: number
  total_gastos: number
  num_transacciones: number
  porcentaje_gastos: number
}

// --- What-If Simulator ---

export interface WhatIfReferenceData {
  facturacion_media_dia: number
  ticket_medio_historico: number
  comensales_media: number
  capacidad_turno: number
  capacidad_dia: number
  total_mesas: number
  mejor_dia_facturacion: number
  dias_operativos_mes: number
}
