// --- OPERATIONS TYPES (Real-time + Analytics) ---

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
  minutos_cocina: number // confirmed -> ready
  minutos_sala: number // ready -> delivered
  minutos_total: number // confirmed -> delivered
  minutos_operativo: number // metrica principal segun tipo
  fecha: string
  hora: number
  dia_semana: number // 0=domingo, 6=sabado
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
