// --- FOOD COST TYPES ---

/**
 * Estado del mapeo de coste de un plato (receta GStock origen).
 * - ok: coste fiable (receta mapeada con confianza, y opciones costeadas si es dinámico).
 * - parcial: configurable con costes de opciones pendientes (poke sin gramajes, vino botella, sabor remolacha…).
 * - sin_receta: no hay receta GStock activa mapeada (confidence sin_receta / sin_receta_activa).
 * - sin_revisar: emparejado automático de confianza baja/media sin revisar a mano.
 */
export type FoodCostMappingStatus = "ok" | "parcial" | "sin_receta" | "sin_revisar"

/** Opción/modificador de un plato dinámico, con su coste real (sin IVA). */
export interface FoodCostOption {
  optionName: string
  optionPrice: number // PVP del modificador (con IVA); 0 = sin sobreprecio
  costOption: number // coste del modificador (sin IVA); 0 = sin mapear
  costed: boolean // true si tiene coste conocido (> 0)
  sourceType: string | null // origen del coste: recipe | gstock_product | manual (de option_recipe_map)
}

export interface FoodCostProduct {
  rowId: string // clave única: sku + nombre (los SKU se repiten en combos: Taquitos 2/3/4ud…)
  sku: string
  producto: string
  categoria: string
  tipo: string // "Comida" o "Bebida"
  pvp: number
  pvp_neto: number
  coste: number
  food_cost_pct: number
  tiene_patatas: boolean
  tiene_helado: boolean
  tiene_ensalada: boolean
  // --- mapeo / receta GStock origen (de product_recipe_map) ---
  recipeName: string | null
  recipeCost: number | null
  confidence: string | null // alta | media | baja | sin_receta | sin_receta_activa | dinamico
  reviewed: boolean
  mappingStatus: FoodCostMappingStatus
  // --- coste dinámico (de product_options / option_recipe_map) ---
  isDynamic: boolean // el coste depende de las opciones elegidas
  options: FoodCostOption[] // opciones para el desglose / estimador
  // --- visibilidad ---
  soldRecently: boolean // vendido en los últimos 60 días (de vw_productos_vendidos_60d); false = fuera de carta / sin ventas
}

/** Food cost REAL ponderado por mix de ventas (últimos 30 días), de vw_food_cost_real */
export interface FoodCostRealRow {
  tipo: "Comida" | "Bebida" | "Global"
  food_cost_pct: number
  venta_neta: number
  coste_mercancia: number
  unidades: number
}

export interface FoodCostReal {
  global: FoodCostRealRow | null
  comida: FoodCostRealRow | null
  bebida: FoodCostRealRow | null
}

export interface FoodCostSummary {
  productos: FoodCostProduct[]
  kpis: {
    food_cost_promedio: number
    total_productos: number
    productos_criticos: number // > 35%
    productos_warning: number // 30-35%
    productos_ok: number // <= 30%
  }
  por_categoria: {
    categoria: string
    productos: number
    food_cost_promedio: number
  }[]
}
