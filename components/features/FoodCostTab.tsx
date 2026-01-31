"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
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
  Pencil,
  RotateCcw,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { fetchFoodCostProducts, updateManualPrice, clearManualPrice } from "@/lib/dataService"
import type { FoodCostSummary, FoodCostProduct } from "@/types"
import { formatCurrency } from "@/lib/utils"

const BRAND_COLORS = {
  primary: "#02b1c4",
  success: "#17c3b2",
  warning: "#ffcb77",
  danger: "#fe6d73",
  dark: "#364f6b",
}

const CATEGORY_COLORS: Record<string, string> = {
  // Comida
  "Smart Poke": "#02b1c4",
  "Smart Food": "#17c3b2",
  Compartir: "#227c9d",
  Kids: "#edadff",
  Dulce: "#fe6d73",
  // Bebida
  "Coffee, Tea & Licores": "#8b5cf6",
  "Drinks Con Alcohol": "#f59e0b",
  "Drinks Sin Alcohol": "#3b82f6",
  "Mojitos & Cocktails": "#ec4899",
}

const COMIDA_CATEGORIES = ["Smart Poke", "Smart Food", "Compartir", "Kids", "Dulce"]
const BEBIDA_CATEGORIES = ["Coffee, Tea & Licores", "Drinks Con Alcohol", "Drinks Sin Alcohol", "Mojitos & Cocktails"]

function getFoodCostColor(pct: number): string {
  if (pct > 30) return BRAND_COLORS.danger
  if (pct >= 20) return BRAND_COLORS.warning
  return BRAND_COLORS.success
}

function getFoodCostBg(pct: number): string {
  if (pct > 30) return "bg-[#fe6d73]/10"
  if (pct >= 20) return "bg-[#ffcb77]/10"
  return "bg-[#17c3b2]/10"
}

export function FoodCostTab() {
  const [data, setData] = useState<FoodCostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTipo, setSelectedTipo] = useState<"Comida" | "Bebida">("Comida")
  const [selectedCategory, setSelectedCategory] = useState("TODOS")

  const loadData = async () => {
    setLoading(true)
    const result = await fetchFoodCostProducts()
    setData(result)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setSelectedCategory("TODOS")
  }, [selectedTipo])

  const filteredProducts = useMemo(() => {
    if (!data) return []
    let filtered = data.productos.filter((p) => p.tipo === selectedTipo)
    if (selectedCategory !== "TODOS") {
      filtered = filtered.filter((p) => p.categoria === selectedCategory)
    }
    return filtered
  }, [data, selectedTipo, selectedCategory])

  const filteredKpis = useMemo(() => {
    if (!data)
      return { food_cost_promedio: 0, total_productos: 0, productos_criticos: 0, productos_warning: 0, productos_ok: 0 }
    const tipoProducts = data.productos.filter((p) => p.tipo === selectedTipo)
    const total = tipoProducts.length
    const criticos = tipoProducts.filter((p) => p.food_cost_pct > 30).length
    const warning = tipoProducts.filter((p) => p.food_cost_pct >= 20 && p.food_cost_pct <= 30).length
    const ok = tipoProducts.filter((p) => p.food_cost_pct < 20).length
    const promedio = total > 0 ? tipoProducts.reduce((sum, p) => sum + p.food_cost_pct, 0) / total : 0
    return {
      food_cost_promedio: promedio,
      total_productos: total,
      productos_criticos: criticos,
      productos_warning: warning,
      productos_ok: ok,
    }
  }, [data, selectedTipo])

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

  if (loading) {
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
      <div className="flex gap-2 bg-white rounded-xl p-2 border border-slate-200 w-fit">
        <button
          onClick={() => setSelectedTipo("Comida")}
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
            {data.productos.filter((p) => p.tipo === "Comida").length}
          </span>
        </button>
        <button
          onClick={() => setSelectedTipo("Bebida")}
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
            {data.productos.filter((p) => p.tipo === "Bebida").length}
          </span>
        </button>
      </div>

      {/* KPIs Header - filtrados por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TremorCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Food Cost Promedio</p>
              <p className="text-4xl font-bold" style={{ color: getFoodCostColor(filteredKpis.food_cost_promedio) }}>
                {filteredKpis.food_cost_promedio.toFixed(1)}%
              </p>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: `${getFoodCostColor(filteredKpis.food_cost_promedio)}20` }}
            >
              <TrendingDown className="h-8 w-8" style={{ color: getFoodCostColor(filteredKpis.food_cost_promedio) }} />
            </div>
          </div>
        </TremorCard>

        <TremorCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Productos</p>
              <p className="text-4xl font-bold text-[#364f6b]">{filteredKpis.total_productos}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#02b1c4]/10">
              <Package className="h-8 w-8 text-[#02b1c4]" />
            </div>
          </div>
        </TremorCard>

        <TremorCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Productos Críticos (&gt;30%)</p>
              <p className="text-4xl font-bold text-[#fe6d73]">{filteredKpis.productos_criticos}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ffcb77]" />
                  {filteredKpis.productos_warning} warning
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#17c3b2]" />
                  {filteredKpis.productos_ok} ok
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#fe6d73]/10">
              <AlertTriangle className="h-8 w-8 text-[#fe6d73]" />
            </div>
          </div>
        </TremorCard>
      </div>

      {/* Filtro de Categorías según tipo */}
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
            {filteredKpis.total_productos}
          </span>
        </button>
        {availableCategories.map((cat) => {
          const isSelected = selectedCategory === cat
          const color = CATEGORY_COLORS[cat] || BRAND_COLORS.dark
          const count = data.productos.filter((p) => p.tipo === selectedTipo && p.categoria === cat).length

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
                {productos.map((producto, idx) => (
                  <ProductCard
                    key={`${producto.sku}-${producto.variantId ?? "base"}-${idx}`}
                    producto={producto}
                    onPriceUpdated={loadData}
                  />
                ))}
              </div>
            </TremorCard>
          )
        })}
      </div>
    </div>
  )
}

function ProductCard({ producto, onPriceUpdated }: { producto: FoodCostProduct; onPriceUpdated: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const fcColor = getFoodCostColor(producto.food_cost_pct)
  const fcBg = getFoodCostBg(producto.food_cost_pct)

  const handleEditClick = () => {
    setEditValue(producto.pvp.toFixed(2))
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue("")
  }

  const handleSave = async () => {
    const newPrice = Number.parseFloat(editValue)
    if (isNaN(newPrice) || newPrice <= 0) {
      return
    }

    setSaving(true)
    const result = await updateManualPrice(producto.sku, producto.variantId, newPrice)
    setSaving(false)

    if (result.success) {
      setIsEditing(false)
      onPriceUpdated()
    } else {
      alert("Error al guardar: " + result.error)
    }
  }

  const handleReset = async () => {
    if (!confirm("¿Resetear al precio del TPV?")) return

    setResetting(true)
    const result = await clearManualPrice(producto.sku, producto.variantId)
    setResetting(false)

    if (result.success) {
      onPriceUpdated()
    } else {
      alert("Error al resetear: " + result.error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  return (
    <div className={`p-4 rounded-xl border border-slate-200 ${fcBg} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-[#364f6b] leading-tight pr-2">{producto.producto}</h4>
        {producto.tiene_patatas && (
          <span className="text-lg" title="Incluye patatas">
            🍟
          </span>
        )}
        {producto.tiene_helado && (
          <span className="text-lg" title="Incluye helado">
            🍨
          </span>
        )}
        {producto.tiene_ensalada && (
          <span className="text-lg" title="Incluye ensalada">
            🥗
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">PVP</span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-16 px-1 py-0.5 text-sm border border-[#02b1c4] rounded focus:outline-none focus:ring-1 focus:ring-[#02b1c4]"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-0.5 text-[#17c3b2] hover:bg-[#17c3b2]/20 rounded"
                title="Guardar"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                onClick={handleCancel}
                className="p-0.5 text-slate-400 hover:bg-slate-200 rounded"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="ml-1 font-medium text-[#364f6b]">{formatCurrency(producto.pvp)}</span>
              <button
                onClick={handleEditClick}
                className="p-0.5 text-slate-400 hover:text-[#02b1c4] hover:bg-[#02b1c4]/10 rounded transition-colors"
                title="Editar precio"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
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
            style={{
              width: `${Math.min(producto.food_cost_pct, 100)}%`,
              backgroundColor: fcColor,
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400">
          <span>0%</span>
          <span className="text-[#17c3b2]">|20%</span>
          <span className="text-[#ffcb77]">|30%</span>
          <span>50%</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50">
        <div className="flex items-center gap-2">
          {producto.food_cost_pct > 30 ? (
            <>
              <AlertCircle className="h-4 w-4 text-[#fe6d73]" />
              <span className="text-xs text-[#fe6d73] font-medium">Crítico</span>
            </>
          ) : producto.food_cost_pct >= 20 ? (
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

        {producto.precioManual && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#02b1c4] font-medium">PVP Manual</span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="p-0.5 text-slate-400 hover:text-[#fe6d73] hover:bg-[#fe6d73]/10 rounded transition-colors"
              title="Resetear al precio TPV"
            >
              {resetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
