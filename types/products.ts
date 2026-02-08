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

// --- Aggregated Types (frontend computation) ---

export interface ProductAggregated {
  product_sku: string
  producto_nombre: string
  categoria_nombre: string
  precio_carta: number
  unidades: number
  facturado: number
  precio_medio_real: number
  diferencia_precio?: number
  pct_facturado?: number
  pct_unidades?: number
  unidades_void?: number
  facturado_void?: number
  pct_void?: number
}

export interface CategoryAggregated {
  category_sku?: string
  categoria_nombre: string
  productos_distintos?: number
  unidades: number
  facturado: number
  ticket_medio_item?: number
  pct_facturado?: number
  pct_unidades?: number
  unidades_void?: number
  facturado_void?: number
  pct_void?: number
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
