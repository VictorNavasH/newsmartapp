// --- FOOD COST TYPES ---

export interface FoodCostProduct {
  sku: string
  variantId: number | null // null para productos, numero para variantes
  producto: string
  categoria: string
  tipo: string // "Comida" o "Bebida"
  pvp: number
  pvp_neto: number
  coste: number
  food_cost_pct: number
  food_cost_peor_pct: number
  tiene_patatas: boolean
  tiene_helado: boolean
  tiene_ensalada: boolean
  precioManual: boolean // indica si el precio fue editado manualmente
}

export interface FoodCostSummary {
  productos: FoodCostProduct[]
  kpis: {
    food_cost_promedio: number
    total_productos: number
    productos_criticos: number // > 30%
    productos_warning: number // 20-30%
    productos_ok: number // < 20%
  }
  por_categoria: {
    categoria: string
    productos: number
    food_cost_promedio: number
  }[]
}
