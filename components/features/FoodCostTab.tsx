"use client"

import { useState, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { TremorCard } from "@/components/ui/TremorCard"
import {
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Wine,
  UtensilsCrossed,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  EyeOff,
  PackageX,
} from "lucide-react"
import { useFoodCostProducts, useFoodCostReal } from "@/hooks/queries"
import type { FoodCostProduct, FoodCostMappingStatus, FoodCostRealRow } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { BRAND_COLORS } from "@/constants"

const CATEGORY_COLORS: Record<string, string> = {
  // Comida
  "Smart Poke": "#02b1c4",
  "Smart Food": "#17c3b2",
  Compartir: "#227c9d",
  Kids: "#edadff",
  Dulce: "#fe6d73",
  "Menús": "#ff924c",
  // Bebida
  "Coffee, Tea & Licores": "#8b5cf6",
  "Drinks Con Alcohol": "#f59e0b",
  "Drinks Sin Alcohol": "#3b82f6",
  "Mojitos & Cocktails": "#ec4899",
}

const COMIDA_CATEGORIES = ["Smart Poke", "Smart Food", "Compartir", "Kids", "Dulce", "Menús"]
const BEBIDA_CATEGORIES = ["Coffee, Tea & Licores", "Drinks Con Alcohol", "Drinks Sin Alcohol", "Mojitos & Cocktails"]

// Umbrales de marca: verde ≤30% · ámbar ≤35% · rojo >35%
function getFoodCostColor(pct: number): string {
  if (pct > 35) return BRAND_COLORS.error
  if (pct > 30) return BRAND_COLORS.warning
  return BRAND_COLORS.success
}

function getFoodCostBg(pct: number): string {
  if (pct > 35) return "bg-[#fe6d73]/10"
  if (pct > 30) return "bg-[#ffcb77]/10"
  return "bg-[#17c3b2]/10"
}

// Configuración visual del estado de mapeo (chip). "ok" no muestra chip.
const STATUS_CONFIG: Record<
  Exclude<FoodCostMappingStatus, "ok">,
  { label: string; color: string; bg: string; tip: string }
> = {
  parcial: {
    label: "Coste parcial",
    color: "#b45309",
    bg: "bg-[#ffcb77]/20",
    tip: "Plato configurable con costes de opciones pendientes (p. ej. poke sin gramajes, vino por botella).",
  },
  sin_receta: {
    label: "Sin receta",
    color: "#be123c",
    bg: "bg-[#fe6d73]/15",
    tip: "No hay receta GStock activa mapeada para este plato.",
  },
  sin_revisar: {
    label: "Sin revisar",
    color: "#475569",
    bg: "bg-slate-100",
    tip: "Emparejado automático de confianza baja/media, aún sin revisar a mano.",
  },
}

export function FoodCostTab() {
  const { data, isLoading } = useFoodCostProducts()
  const { data: real } = useFoodCostReal()
  const [selectedTipo, setSelectedTipo] = useState<"Comida" | "Bebida">("Comida")
  const [selectedCategory, setSelectedCategory] = useState("TODOS")
  const [showHidden, setShowHidden] = useState(false) // mostrar también platos sin ventas 60d (fuera de carta)

  const filteredProducts = useMemo(() => {
    if (!data) return []
    let filtered = data.productos.filter((p) => p.tipo === selectedTipo)
    if (!showHidden) filtered = filtered.filter((p) => p.soldRecently)
    if (selectedCategory !== "TODOS") {
      filtered = filtered.filter((p) => p.categoria === selectedCategory)
    }
    return filtered
  }, [data, selectedTipo, selectedCategory, showHidden])

  const tipoStats = useMemo(() => {
    if (!data) return { total: 0, criticos: 0, warning: 0, ok: 0, dinamicos: 0, hidden: 0 }
    const allTipo = data.productos.filter((p) => p.tipo === selectedTipo)
    const hidden = allTipo.filter((p) => !p.soldRecently).length
    // Las stat-chips siguen lo visible (respetan el filtro de fuera de carta)
    const tp = showHidden ? allTipo : allTipo.filter((p) => p.soldRecently)
    return {
      total: tp.length,
      criticos: tp.filter((p) => p.food_cost_pct > 35).length,
      warning: tp.filter((p) => p.food_cost_pct > 30 && p.food_cost_pct <= 35).length,
      ok: tp.filter((p) => p.food_cost_pct <= 30).length,
      dinamicos: tp.filter((p) => p.isDynamic).length,
      hidden,
    }
  }, [data, selectedTipo, showHidden])

  // Conteo por tipo respetando la visibilidad (para los toggles Comida/Bebida)
  const countByTipo = (tipo: "Comida" | "Bebida") =>
    data ? data.productos.filter((p) => p.tipo === tipo && (showHidden || p.soldRecently)).length : 0

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, FoodCostProduct[]> = {}
    filteredProducts.forEach((p) => {
      if (!groups[p.categoria]) groups[p.categoria] = []
      groups[p.categoria].push(p)
    })
    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => b.food_cost_pct - a.food_cost_pct)
    })
    return groups
  }, [filteredProducts])

  const availableCategories = selectedTipo === "Comida" ? COMIDA_CATEGORIES : BEBIDA_CATEGORIES

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!data || data.productos.length === 0) {
    return (
      <TremorCard className="p-8">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <ChefHat className="h-16 w-16 mb-4 text-slate-300" />
          <h3 className="text-lg font-medium mb-2">Sin datos de Food Cost</h3>
          <p className="text-center max-w-md">
            No hay productos configurados con información de coste. Configura los escandallos para ver el análisis de
            Food Cost.
          </p>
        </div>
      </TremorCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera — Food Cost REAL ponderado por ventas (30 días) */}
      <RealHeader real={real ?? null} />

      {/* Toggle Comida / Bebida */}
      <div className="flex gap-2 bg-white rounded-xl p-2 border border-slate-200 w-fit">
        <button
          onClick={() => {
            setSelectedTipo("Comida")
            setSelectedCategory("TODOS")
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            selectedTipo === "Comida"
              ? "bg-[#02b1c4] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <UtensilsCrossed className="h-5 w-5" />
          Comida
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${selectedTipo === "Comida" ? "bg-white/20" : "bg-slate-200"}`}
          >
            {countByTipo("Comida")}
          </span>
        </button>
        <button
          onClick={() => {
            setSelectedTipo("Bebida")
            setSelectedCategory("TODOS")
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            selectedTipo === "Bebida"
              ? "bg-[#8b5cf6] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Wine className="h-5 w-5" />
          Bebida
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${selectedTipo === "Bebida" ? "bg-white/20" : "bg-slate-200"}`}
          >
            {countByTipo("Bebida")}
          </span>
        </button>
      </div>

      {/* Stats compactas del tipo seleccionado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip icon={Package} color={BRAND_COLORS.primary} label="Productos" value={tipoStats.total} />
        <StatChip icon={CheckCircle2} color={BRAND_COLORS.success} label="Óptimos (≤30%)" value={tipoStats.ok} />
        <StatChip icon={AlertTriangle} color={BRAND_COLORS.warning} label="Atención (30-35%)" value={tipoStats.warning} />
        <StatChip icon={AlertCircle} color={BRAND_COLORS.error} label="Críticos (>35%)" value={tipoStats.criticos} />
      </div>

      {/* Visibilidad: platos fuera de carta (sin ventas en 60 días) */}
      {tipoStats.hidden > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <PackageX className="h-3.5 w-3.5" />
            {tipoStats.hidden} {tipoStats.hidden === 1 ? "plato" : "platos"} sin ventas en 60 días (fuera de carta)
            {showHidden ? " mostrados" : " ocultos"}
          </span>
          <button
            onClick={() => setShowHidden((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {showHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showHidden ? "Ocultar fuera de carta" : "Ver también sin ventas"}
          </button>
        </div>
      )}

      {/* Filtro de categorías según tipo */}
      <div className="flex flex-wrap gap-2 bg-white rounded-xl p-3 border border-slate-200">
        <button
          onClick={() => setSelectedCategory("TODOS")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            selectedCategory === "TODOS" ? "text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          style={selectedCategory === "TODOS" ? { backgroundColor: BRAND_COLORS.primary } : undefined}
        >
          TODOS
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === "TODOS" ? "bg-white/20" : "bg-slate-200"}`}
          >
            {tipoStats.total}
          </span>
        </button>
        {availableCategories.map((cat) => {
          const isSelected = selectedCategory === cat
          const color = CATEGORY_COLORS[cat] || BRAND_COLORS.dark
          const count = data.productos.filter(
            (p) => p.tipo === selectedTipo && p.categoria === cat && (showHidden || p.soldRecently),
          ).length

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isSelected ? "text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={isSelected ? { backgroundColor: color } : undefined}
            >
              {cat}
              <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20" : "bg-slate-200"}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Productos agrupados por categoría */}
      <div className="space-y-6">
        {Object.entries(groupedByCategory).map(([categoria, productos]) => {
          const catColor = CATEGORY_COLORS[categoria] || BRAND_COLORS.dark
          const catAvg = productos.reduce((sum, p) => sum + p.food_cost_pct, 0) / productos.length

          return (
            <TremorCard key={categoria} className="overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: `${catColor}15` }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catColor }} />
                  <h3 className="font-semibold text-[#364f6b]">{categoria}</h3>
                  <span className="text-sm text-slate-500">({productos.length} productos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Food Cost Promedio:</span>
                  <span className="font-bold" style={{ color: getFoodCostColor(catAvg) }}>
                    {catAvg.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {productos.map((producto) => (
                  <ProductCard key={producto.rowId} producto={producto} />
                ))}
              </div>
            </TremorCard>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center pt-2">
        Food cost sobre base imponible (sin IVA). Costes sincronizados a diario con las recetas de GStock.
      </p>
    </div>
  )
}

// ─── Cabecera: food cost real ponderado ───────────────────────────
function RealHeader({ real }: { real: { global: FoodCostRealRow | null; comida: FoodCostRealRow | null; bebida: FoodCostRealRow | null } | null }) {
  const cards: { key: string; label: string; row: FoodCostRealRow | null; icon: typeof TrendingDown }[] = [
    { key: "global", label: "Global", row: real?.global ?? null, icon: TrendingDown },
    { key: "comida", label: "Comida", row: real?.comida ?? null, icon: UtensilsCrossed },
    { key: "bebida", label: "Bebida", row: real?.bebida ?? null, icon: Wine },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-[#364f6b]">Food Cost real ponderado</h2>
        <span className="text-xs text-slate-400">· por ventas · últimos 30 días</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ key, label, row, icon: Icon }) => {
          const pct = row?.food_cost_pct ?? 0
          const color = getFoodCostColor(pct)
          return (
            <TremorCard key={key} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{label}</p>
                  <p className="text-4xl font-bold" style={{ color: row ? color : "#cbd5e1" }}>
                    {row ? `${pct.toFixed(1)}%` : "—"}
                  </p>
                  {row && (
                    <p className="text-xs text-slate-400 mt-1">
                      {formatCurrency(row.coste_mercancia)} coste / {formatCurrency(row.venta_neta)} venta ·{" "}
                      {row.unidades.toLocaleString("es-ES")} uds
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: row ? `${color}20` : "#f1f5f9" }}>
                  <Icon className="h-8 w-8" style={{ color: row ? color : "#cbd5e1" }} />
                </div>
              </div>
            </TremorCard>
          )
        })}
      </div>
    </div>
  )
}

function StatChip({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Package
  color: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}1a` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold text-[#364f6b] leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

// ─── Card de producto ─────────────────────────────────────────────
function ProductCard({ producto }: { producto: FoodCostProduct }) {
  const [expanded, setExpanded] = useState(false)
  const fcColor = getFoodCostColor(producto.food_cost_pct)
  const fcBg = getFoodCostBg(producto.food_cost_pct)
  const status = producto.mappingStatus !== "ok" ? STATUS_CONFIG[producto.mappingStatus] : null

  return (
    <div className={`p-4 rounded-xl border border-slate-200 ${fcBg} transition-all hover:shadow-md flex flex-col`}>
      <div className="flex items-start justify-between mb-2 gap-2">
        <h4 className="font-semibold text-[#364f6b] leading-tight pr-1">{producto.producto}</h4>
        <div className="flex items-center gap-1 shrink-0">
          {producto.tiene_patatas && (
            <span className="text-base" title="Incluye patatas">
              🍟
            </span>
          )}
          {producto.tiene_helado && (
            <span className="text-base" title="Incluye helado">
              🍨
            </span>
          )}
          {producto.tiene_ensalada && (
            <span className="text-base" title="Incluye ensalada">
              🥗
            </span>
          )}
        </div>
      </div>

      {/* Badges: fuera de carta + dinámico + estado de mapeo */}
      {(producto.isDynamic || status || !producto.soldRecently) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {!producto.soldRecently && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500"
              title="Sin ventas en los últimos 60 días (posible plato fuera de carta)"
            >
              <PackageX className="h-3 w-3" />
              Sin ventas 60d
            </span>
          )}
          {producto.isDynamic && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#02b1c4]/10 text-[#02b1c4]">
              <Sparkles className="h-3 w-3" />
              Dinámico
            </span>
          )}
          {status && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg}`}
              style={{ color: status.color }}
              title={status.tip}
            >
              <AlertTriangle className="h-3 w-3" />
              {status.label}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3 text-sm">
        <div>
          <span className="text-slate-500">PVP</span>
          <span className="ml-1 font-medium text-[#364f6b]">{formatCurrency(producto.pvp)}</span>
        </div>
        <div className="text-slate-300">|</div>
        <div>
          <span className="text-slate-500">Coste</span>
          <span className="ml-1 font-medium text-[#364f6b]">{formatCurrency(producto.coste)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Food Cost</span>
          <span className="font-bold text-lg" style={{ color: fcColor }}>
            {producto.food_cost_pct.toFixed(1)}%
          </span>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(producto.food_cost_pct, 100)}%`, backgroundColor: fcColor }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400">
          <span>0%</span>
          <span className="text-[#17c3b2]">|30%</span>
          <span className="text-[#ffcb77]">|35%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Receta GStock origen */}
      <div className="mt-3 pt-3 border-t border-slate-200/50 text-xs text-slate-500 flex items-start gap-1.5">
        <ChefHat className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
        {producto.recipeName ? (
          <span className="leading-tight">
            Receta GStock: <span className="text-slate-600 font-medium">{producto.recipeName}</span>
            {producto.recipeCost != null && <> · {formatCurrency(producto.recipeCost)}</>}
          </span>
        ) : (
          <span className="leading-tight italic">Sin receta GStock mapeada</span>
        )}
      </div>

      {/* Estado óptimo / atención / crítico + toggle desglose */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {producto.food_cost_pct > 35 ? (
            <>
              <AlertCircle className="h-4 w-4 text-[#fe6d73]" />
              <span className="text-xs text-[#fe6d73] font-medium">Crítico</span>
            </>
          ) : producto.food_cost_pct > 30 ? (
            <>
              <AlertTriangle className="h-4 w-4 text-[#ffcb77]" />
              <span className="text-xs text-[#ffcb77] font-medium">Atención</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-[#17c3b2]" />
              <span className="text-xs text-[#17c3b2] font-medium">Óptimo</span>
            </>
          )}
        </div>

        {producto.isDynamic && producto.options.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#02b1c4] hover:bg-[#02b1c4]/10 rounded-md px-2 py-1 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Ocultar opciones" : "Desglosar opciones"}
          </button>
        )}
      </div>

      {expanded && producto.isDynamic && <DynamicEstimator producto={producto} />}
    </div>
  )
}

// ─── Estimador de coste dinámico (base + opciones) ─────────────────
function DynamicEstimator({ producto }: { producto: FoodCostProduct }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const ratioNet = producto.pvp > 0 ? producto.pvp_neto / producto.pvp : 1 / 1.1

  const { totalCost, totalPVP, totalNet, anyUnmapped } = useMemo(() => {
    let addCost = 0
    let addPVP = 0
    let unmapped = false
    for (const o of producto.options) {
      if (!selected.has(o.optionName)) continue
      addCost += o.costOption
      addPVP += o.optionPrice
      if (!o.costed) unmapped = true
    }
    const tPVP = producto.pvp + addPVP
    return {
      totalCost: producto.coste + addCost,
      totalPVP: tPVP,
      totalNet: producto.pvp_neto + addPVP * ratioNet,
      anyUnmapped: unmapped,
    }
  }, [producto, selected, ratioNet])

  const fcPct = totalNet > 0 ? (totalCost / totalNet) * 100 : 0
  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Eye className="h-3.5 w-3.5" />
        Marca opciones para estimar el coste resultante
      </div>

      {/* Línea base */}
      <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-white/70">
        <span className="text-slate-500">Base ({producto.producto})</span>
        <span className="font-medium text-[#364f6b]">{formatCurrency(producto.coste)}</span>
      </div>

      <div className="max-h-56 overflow-auto space-y-1 pr-1">
        {producto.options.map((o) => {
          const isSel = selected.has(o.optionName)
          return (
            <label
              key={o.optionName}
              className={`flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                isSel ? "bg-[#02b1c4]/10" : "hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(o.optionName)}
                  className="h-3.5 w-3.5 accent-[#02b1c4] shrink-0"
                />
                <span className="truncate text-slate-600">{o.optionName}</span>
                {o.optionPrice > 0 && <span className="text-slate-400 shrink-0">+{formatCurrency(o.optionPrice)}</span>}
              </span>
              {o.costed ? (
                <span className="font-medium text-[#364f6b] shrink-0">{formatCurrency(o.costOption)}</span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-[10px] text-slate-400 shrink-0"
                  title="Coste de esta opción aún no mapeado"
                >
                  <HelpCircle className="h-3 w-3" />
                  sin mapear
                </span>
              )}
            </label>
          )
        })}
      </div>

      {/* Resultado */}
      <div className="flex items-center justify-between px-2 py-2 rounded-md bg-[#364f6b]/5">
        <div className="text-xs text-slate-600">
          Coste estimado <span className="font-semibold text-[#364f6b]">{formatCurrency(totalCost)}</span>
          <span className="text-slate-400"> · PVP {formatCurrency(totalPVP)}</span>
        </div>
        <span className="font-bold text-sm" style={{ color: getFoodCostColor(fcPct) }}>
          {fcPct.toFixed(1)}%
        </span>
      </div>

      <p className="text-[10px] text-slate-400 leading-snug">
        Estimación orientativa: la composición real (sustituciones, raciones) varía por plato.
        {anyUnmapped && " Incluye opciones sin coste mapeado, por lo que el coste real será mayor."}
      </p>
    </div>
  )
}
