"use client"
import { useState, useEffect, useMemo } from "react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchProductMix, fetchCategoryMix, fetchOptionMix, getBusinessDate } from "@/lib/dataService"
import type {
  DateRange,
  ProductMixItem,
  CategoryMixItem,
  OptionMixItem,
  ProductAggregated,
  CategoryAggregated,
} from "@/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  Package,
  ShoppingCart,
  Grid3X3,
  TrendingUp,
  TrendingDown,
  Award,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
  Layers,
  Sun,
  Moon,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { CHART_CONFIG, BRAND_COLORS } from "@/constants"
import { MenuBar } from "@/components/ui/menu-bar"
import { formatCurrency, formatNumber } from "@/lib/utils"

type PeriodKey = "ayer" | "semana" | "mes" | "trimestre" | "custom"
type SortField = "facturado" | "unidades" | "producto_nombre"
type SortDirection = "asc" | "desc"

const CATEGORY_COLORS = [
  "#02b1c4",
  "#227c9d",
  "#ffcb77",
  "#17c3b2",
  "#fe6d73",
  "#364f6b",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
]

// Helper para calcular las fechas de comparación (media móvil 4 semanas)
const getComparisonDates = (from: Date, to: Date): { startDates: string[]; endDates: string[] } => {
  const startDates: string[] = []
  const endDates: string[] = []

  // Obtener los mismos días de las 4 semanas anteriores
  for (let week = 1; week <= 4; week++) {
    const prevFrom = new Date(from)
    prevFrom.setDate(prevFrom.getDate() - week * 7)
    const prevTo = new Date(to)
    prevTo.setDate(prevTo.getDate() - week * 7)

    startDates.push(prevFrom.toISOString().split("T")[0])
    endDates.push(prevTo.toISOString().split("T")[0])
  }

  return { startDates, endDates }
}

// Helper para calcular delta porcentual
const calcDelta = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Helper para determinar tendencia
const getTrend = (delta: number): "up" | "down" | "neutral" => {
  if (delta > 1) return "up"
  if (delta < -1) return "down"
  return "neutral"
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [productData, setProductData] = useState<ProductMixItem[]>([])
  const [categoryData, setCategoryData] = useState<CategoryMixItem[]>([])
  const [optionData, setOptionData] = useState<OptionMixItem[]>([])
  const [activeTab, setActiveTab] = useState<PeriodKey>("ayer")
  const [mainView, setMainView] = useState("Ranking")
  const [selectedTurno, setSelectedTurno] = useState("todos")
  const [selectedCategoria, setSelectedCategoria] = useState("todas")
  const [sortField, setSortField] = useState<SortField>("facturado")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Estado para los totales del período de comparación (media 4 semanas)
  const [comparisonTotals, setComparisonTotals] = useState({
    totalFacturado: 0,
    totalUnidades: 0,
    totalProductos: 0,
    totalCategorias: 0,
    weeksWithData: 0, // Para saber cuántas semanas tenían datos
  })

  const today = getBusinessDate()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 0, 0),
    to: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 0, 0),
  })

  const setPeriod = (period: PeriodKey) => {
    setActiveTab(period)
    const now = getBusinessDate()
    let from: Date
    let to: Date

    switch (period) {
      case "ayer":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0)
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0)
        break
      case "semana":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 12, 0, 0)
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0)
        break
      case "mes":
        from = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0)
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0)
        break
      case "trimestre":
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 12, 0, 0)
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0)
        break
      default:
        return
    }
    setDateRange({ from, to })
  }

  const handleDateChange = (range: DateRange | undefined) => {
    if (range?.from) {
      const normalizedFrom = new Date(range.from)
      normalizedFrom.setHours(12, 0, 0, 0)
      const normalizedTo = range.to ? new Date(range.to) : normalizedFrom
      normalizedTo.setHours(12, 0, 0, 0)
      setDateRange({ from: normalizedFrom, to: normalizedTo })
      setActiveTab("custom")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (!dateRange.from || !dateRange.to) return
      setLoading(true)
      try {
        const startDate = dateRange.from.toISOString().split("T")[0]
        const endDate = dateRange.to.toISOString().split("T")[0]

        // Calcular fechas de comparación (4 semanas anteriores)
        const { startDates, endDates } = getComparisonDates(dateRange.from, dateRange.to)

        // Consultar período actual
        const [products, categories, options] = await Promise.all([
          fetchProductMix(startDate, endDate),
          fetchCategoryMix(startDate, endDate),
          fetchOptionMix(startDate, endDate),
        ])

        // Consultar las 4 semanas anteriores en paralelo
        const comparisonPromises = startDates.map((start, idx) => fetchProductMix(start, endDates[idx]))
        const comparisonResults = await Promise.all(comparisonPromises)

        // Calcular media de las semanas anteriores
        let sumFacturado = 0
        let sumUnidades = 0
        let sumProductos = 0
        let sumCategorias = 0
        let weeksWithData = 0

        comparisonResults.forEach((weekProducts) => {
          if (weekProducts.length > 0) {
            weeksWithData++
            sumFacturado += weekProducts.reduce((sum, p) => sum + p.facturado, 0)
            sumUnidades += weekProducts.reduce((sum, p) => sum + p.unidades, 0)
            sumProductos += new Set(weekProducts.map((p) => p.product_sku)).size
            sumCategorias += new Set(weekProducts.map((p) => p.categoria_nombre)).size
          }
        })

        // Calcular promedios
        const avgTotals =
          weeksWithData > 0
            ? {
                totalFacturado: sumFacturado / weeksWithData,
                totalUnidades: sumUnidades / weeksWithData,
                totalProductos: sumProductos / weeksWithData,
                totalCategorias: sumCategorias / weeksWithData,
                weeksWithData,
              }
            : {
                totalFacturado: 0,
                totalUnidades: 0,
                totalProductos: 0,
                totalCategorias: 0,
                weeksWithData: 0,
              }

        setProductData(products)
        setCategoryData(categories)
        setOptionData(options)
        setComparisonTotals(avgTotals)
      } catch (error) {
        console.error("Error loading product mix data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dateRange])

  // Filtered data by turno and categoria
  const filteredProducts = useMemo(() => {
    return productData.filter((p) => {
      if (selectedTurno !== "todos" && p.turno_nombre !== selectedTurno) return false
      if (selectedCategoria !== "todas" && p.categoria_nombre !== selectedCategoria) return false
      return true
    })
  }, [productData, selectedTurno, selectedCategoria])

  // Aggregate products by SKU
  const aggregatedProducts = useMemo(() => {
    const map = new Map<string, ProductAggregated>()
    filteredProducts.forEach((p) => {
      const existing = map.get(p.product_sku)
      if (existing) {
        existing.unidades += p.unidades
        existing.facturado += p.facturado
      } else {
        map.set(p.product_sku, {
          product_sku: p.product_sku,
          producto_nombre: p.producto_nombre,
          categoria_nombre: p.categoria_nombre,
          precio_carta: p.precio_carta,
          precio_medio_real: p.precio_medio_real,
          unidades: p.unidades,
          facturado: p.facturado,
        })
      }
    })
    return Array.from(map.values())
  }, [filteredProducts])

  // Sorted products
  const sortedProducts = useMemo(() => {
    return [...aggregatedProducts].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }, [aggregatedProducts, sortField, sortDirection])

  // Aggregate categories
  const aggregatedCategories = useMemo(() => {
    const map = new Map<string, CategoryAggregated>()
    filteredProducts.forEach((p) => {
      const existing = map.get(p.categoria_nombre)
      if (existing) {
        existing.unidades += p.unidades
        existing.facturado += p.facturado
      } else {
        map.set(p.categoria_nombre, {
          categoria_nombre: p.categoria_nombre,
          unidades: p.unidades,
          facturado: p.facturado,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.facturado - a.facturado)
  }, [filteredProducts])

  // Top 5 by shift
  const topProductsByShift = useMemo(() => {
    const comidaProducts = productData
      .filter((p) => p.turno_nombre === "Comida")
      .reduce(
        (acc, item) => {
          const key = item.product_sku
          if (!acc[key]) {
            acc[key] = { ...item }
          } else {
            acc[key].unidades += item.unidades
            acc[key].facturado += item.facturado
          }
          return acc
        },
        {} as Record<string, ProductMixItem>,
      )

    const cenaProducts = productData
      .filter((p) => p.turno_nombre === "Cena")
      .reduce(
        (acc, item) => {
          const key = item.product_sku
          if (!acc[key]) {
            acc[key] = { ...item }
          } else {
            acc[key].unidades += item.unidades
            acc[key].facturado += item.facturado
          }
          return acc
        },
        {} as Record<string, ProductMixItem>,
      )

    return {
      comida: Object.values(comidaProducts)
        .sort((a, b) => b.facturado - a.facturado)
        .slice(0, 5),
      cena: Object.values(cenaProducts)
        .sort((a, b) => b.facturado - a.facturado)
        .slice(0, 5),
    }
  }, [productData])

  const topProductsByUnits = useMemo(() => {
    const allProducts = productData.reduce(
      (acc, item) => {
        const key = item.product_sku
        if (!acc[key]) {
          acc[key] = { ...item }
        } else {
          acc[key].unidades += item.unidades
          acc[key].facturado += item.facturado
        }
        return acc
      },
      {} as Record<string, ProductMixItem>,
    )

    const sorted = Object.values(allProducts).sort((a, b) => b.unidades - a.unidades)
    const withSales = sorted.filter((p) => p.unidades > 0)

    return {
      topSellers: sorted.slice(0, 5),
      leastSellers: withSales.slice(-5).reverse(),
    }
  }, [productData])

  // Products by category for Patrones tab
  const productsByCategory = useMemo(() => {
    const categoryMap = new Map<string, Map<string, ProductMixItem>>()

    productData.forEach((p) => {
      if (!categoryMap.has(p.categoria_nombre)) {
        categoryMap.set(p.categoria_nombre, new Map())
      }
      const skuMap = categoryMap.get(p.categoria_nombre)!
      const existing = skuMap.get(p.product_sku)

      if (existing) {
        // Agregar unidades y facturado
        existing.unidades += p.unidades
        existing.facturado += p.facturado
      } else {
        // Clonar para no mutar el original
        skuMap.set(p.product_sku, { ...p })
      }
    })

    // Convertir a Map<string, ProductMixItem[]> ordenado por facturado
    const result = new Map<string, ProductMixItem[]>()
    categoryMap.forEach((skuMap, categoria) => {
      const products = Array.from(skuMap.values())
      products.sort((a, b) => b.facturado - a.facturado)
      result.set(categoria, products)
    })

    return result
  }, [productData])

  // Get unique categories for filter
  const availableCategories = useMemo(() => {
    const cats = new Set(productData.map((p) => p.categoria_nombre))
    return Array.from(cats).sort()
  }, [productData])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
  }

  const pieChartData = useMemo(() => {
    return aggregatedCategories.map((cat, idx) => ({
      name: cat.categoria_nombre,
      value: cat.facturado,
      fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }))
  }, [aggregatedCategories])

  const clearFilters = () => {
    setSelectedTurno("todos")
    setSelectedCategoria("todas")
  }

  const hasFilters = selectedTurno !== "todos" || selectedCategoria !== "todas"

  // Totals for KPIs con deltas calculados
  const totals = useMemo(() => {
    const totalFacturado = aggregatedProducts.reduce((sum, p) => sum + p.facturado, 0)
    const totalUnidades = aggregatedProducts.reduce((sum, p) => sum + p.unidades, 0)
    const totalProductos = aggregatedProducts.length
    const totalCategorias = aggregatedCategories.length

    // Calcular deltas vs media 4 semanas
    const deltaFacturado = calcDelta(totalFacturado, comparisonTotals.totalFacturado)
    const deltaUnidades = calcDelta(totalUnidades, comparisonTotals.totalUnidades)
    const deltaProductos = calcDelta(totalProductos, comparisonTotals.totalProductos)
    const deltaCategorias = calcDelta(totalCategorias, comparisonTotals.totalCategorias)

    return {
      totalFacturado,
      totalUnidades,
      totalProductos,
      totalCategorias,
      deltaFacturado,
      deltaUnidades,
      deltaProductos,
      deltaCategorias,
      comparisonTotals,
    }
  }, [aggregatedProducts, aggregatedCategories, comparisonTotals])

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        icon={Package}
        title="Mix de Producto"
        subtitle="Análisis de ventas por producto, categoría y opciones"
        actions={
          <div className="flex items-center gap-4">
            <Select value={selectedTurno} onValueChange={setSelectedTurno}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los turnos</SelectItem>
                <SelectItem value="Comida">Comida</SelectItem>
                <SelectItem value="Cena">Cena</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={activeTab} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <TabsList className="bg-white border border-slate-200 shadow-sm">
                <TabsTrigger
                  value="ayer"
                  className={
                    activeTab === "ayer" ? "data-[state=active]:bg-[#02b1c4] data-[state=active]:text-white" : ""
                  }
                >
                  Ayer
                </TabsTrigger>
                <TabsTrigger
                  value="semana"
                  className={
                    activeTab === "semana" ? "data-[state=active]:bg-[#02b1c4] data-[state=active]:text-white" : ""
                  }
                >
                  Semana
                </TabsTrigger>
                <TabsTrigger
                  value="mes"
                  className={
                    activeTab === "mes" ? "data-[state=active]:bg-[#02b1c4] data-[state=active]:text-white" : ""
                  }
                >
                  Mes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        }
      />

      <PageContent>
        {/* KPIs con comparativa media 4 semanas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricGroupCard
            title="Facturación Total"
            total={{
              value: totals.totalFacturado,
              delta: Math.round(totals.deltaFacturado * 10) / 10,
              trend: getTrend(totals.deltaFacturado),
              previous: totals.comparisonTotals.totalFacturado,
            }}
            icon={<ShoppingCart className="h-5 w-5 text-[#02b1c4]" />}
            suffix="€"
            decimals={2}
          />
          <MetricGroupCard
            title="Unidades Vendidas"
            total={{
              value: totals.totalUnidades,
              delta: Math.round(totals.deltaUnidades * 10) / 10,
              trend: getTrend(totals.deltaUnidades),
              previous: totals.comparisonTotals.totalUnidades,
            }}
            icon={<Package className="h-5 w-5 text-[#17c3b2]" />}
          />
          <MetricGroupCard
            title="Productos"
            total={{
              value: totals.totalProductos,
              delta: Math.round(totals.deltaProductos * 10) / 10,
              trend: getTrend(totals.deltaProductos),
              previous: totals.comparisonTotals.totalProductos,
            }}
            icon={<Layers className="h-5 w-5 text-[#227c9d]" />}
          />
          <MetricGroupCard
            title="Categorías"
            total={{
              value: totals.totalCategorias,
              delta: Math.round(totals.deltaCategorias * 10) / 10,
              trend: getTrend(totals.deltaCategorias),
              previous: totals.comparisonTotals.totalCategorias,
            }}
            icon={<Grid3X3 className="h-5 w-5 text-[#ffcb77]" />}
          />
        </div>

        {/* Indicador de comparación */}
        {totals.comparisonTotals.weeksWithData > 0 && (
          <div className="mb-4 text-xs text-slate-500 text-center">
            Comparando con media de {totals.comparisonTotals.weeksWithData} semana
            {totals.comparisonTotals.weeksWithData > 1 ? "s" : ""} anterior
            {totals.comparisonTotals.weeksWithData > 1 ? "es" : ""} (mismo día)
          </div>
        )}

        {/* Main Tabs */}
        <div className="flex justify-center mb-6">
          <MenuBar
            items={[
              {
                icon: Award,
                label: "Ranking",
                href: "ranking",
                gradient:
                  "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(34,124,157,0.06) 50%, transparent 80%)",
                iconColor: "text-[#17c3b2]",
              },
              {
                icon: Grid3X3,
                label: "Categorías",
                href: "categorias",
                gradient:
                  "radial-gradient(circle, rgba(34,124,157,0.15) 0%, rgba(23,195,178,0.06) 50%, transparent 80%)",
                iconColor: "text-[#227c9d]",
              },
              {
                icon: Package,
                label: "Extras",
                href: "extras",
                gradient:
                  "radial-gradient(circle, rgba(254,109,115,0.15) 0%, rgba(255,203,119,0.06) 50%, transparent 80%)",
                iconColor: "text-[#fe6d73]",
              },
              {
                icon: TrendingUp,
                label: "Patrones",
                href: "patrones",
                gradient:
                  "radial-gradient(circle, rgba(255,203,119,0.15) 0%, rgba(254,109,115,0.06) 50%, transparent 80%)",
                iconColor: "text-[#ffcb77]",
              },
            ]}
            activeItem={mainView}
            onItemClick={setMainView}
          />
        </div>

        {/* TAB: Ranking */}
        {mainView === "Ranking" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 Más Vendidos */}
              <TremorCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-[#17c3b2]" />
                  <TremorTitle>Top 5 Más Vendidos del Día</TremorTitle>
                </div>
                <div className="space-y-3">
                  {topProductsByUnits?.topSellers?.length > 0 ? (
                    topProductsByUnits.topSellers.map((product, idx) => (
                      <div
                        key={product.product_sku}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                          </span>
                          <div>
                            <p className="font-medium text-slate-900">{product.producto_nombre}</p>
                            <p className="text-xs text-slate-500">{product.categoria_nombre}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                            {formatNumber(product.unidades)} uds
                          </p>
                          <p className="text-xs text-slate-500">{formatCurrency(product.facturado)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-4">Sin datos para el período seleccionado</p>
                  )}
                </div>
              </TremorCard>

              {/* Top 5 Menos Vendidos */}
              <TremorCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-[#fe6d73]" />
                  <TremorTitle>Top 5 Menos Vendidos del Día</TremorTitle>
                </div>
                <div className="space-y-3">
                  {topProductsByUnits?.leastSellers?.length > 0 ? (
                    topProductsByUnits.leastSellers.map((product, idx) => (
                      <div
                        key={product.product_sku}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                          </span>
                          <div>
                            <p className="font-medium text-slate-900">{product.producto_nombre}</p>
                            <p className="text-xs text-slate-500">{product.categoria_nombre}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#fe6d73]">{formatNumber(product.unidades)} uds</p>
                          <p className="text-xs text-slate-500">{formatCurrency(product.facturado)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-4">Sin datos para el período seleccionado</p>
                  )}
                </div>
              </TremorCard>
            </div>

            {/* Charts and Table */}
            <div className="grid grid-cols-3 gap-4">
              {/* Top 10 Chart */}
              <TremorCard className="col-span-1 p-4">
                <TremorTitle>Top 10 por Facturación</TremorTitle>
                <div className="h-[400px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedProducts.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.grid.stroke} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => {
                          if (v === 0) return "0€"
                          if (v < 1000) return `${Math.round(v)}€`
                          return `${(v / 1000).toFixed(1)}k`
                        }}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="producto_nombre"
                        width={140}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => (value.length > 18 ? `${value.substring(0, 16)}...` : value)}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={CHART_CONFIG.tooltip.contentStyle}
                        labelFormatter={(label) => label}
                      />
                      <Bar dataKey="facturado" fill={BRAND_COLORS.primary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TremorCard>

              {/* Products Table */}
              <TremorCard className="col-span-2 p-4">
                <TremorTitle>Detalle de Productos</TremorTitle>
                <div className="mt-4 max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("producto_nombre")}
                        >
                          <div className="flex items-center">
                            Producto
                            <SortIcon field="producto_nombre" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">P. Carta</TableHead>
                        <TableHead className="text-right">P. Medio Real</TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("unidades")}
                        >
                          <div className="flex items-center justify-end">
                            Uds
                            <SortIcon field="unidades" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("facturado")}
                        >
                          <div className="flex items-center justify-end">
                            Facturado
                            <SortIcon field="facturado" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProducts.map((product, idx) => (
                        <TableRow key={product.product_sku}>
                          <TableCell className="font-medium text-slate-500">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">{product.producto_nombre}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.precio_carta)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.precio_medio_real)}</TableCell>
                          <TableCell className="text-right">{formatNumber(product.unidades)}</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: BRAND_COLORS.primary }}>
                            {formatCurrency(product.facturado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TremorCard>
            </div>
          </div>
        )}

        {/* TAB: Categorías */}
        {mainView === "Categorías" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Pie Chart */}
            <TremorCard className="p-4">
              <TremorTitle>Distribución por Categoría</TremorTitle>
              <div className="h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120}>
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const data = payload[0].payload
                        const total = pieChartData.reduce((sum, d) => sum + d.value, 0)
                        const percent = ((data.value / total) * 100).toFixed(1)
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[180px]">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
                              <span className="font-medium text-[#364f6b]">{data.name}</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Facturado:</span>
                                <span className="font-medium text-[#364f6b]">{formatCurrency(data.value)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">% del total:</span>
                                <span className="font-medium text-[#364f6b]">{percent}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: "12px", paddingLeft: "10px" }}
                      formatter={(value, entry: any) => {
                        const item = pieChartData.find((d) => d.name === value)
                        const total = pieChartData.reduce((sum, d) => sum + d.value, 0)
                        const percent = item ? ((item.value / total) * 100).toFixed(0) : 0
                        return (
                          <span className="text-slate-700">
                            {value} ({percent}%)
                          </span>
                        )
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </TremorCard>

            {/* Categories Table */}
            <TremorCard className="p-4">
              <TremorTitle>Detalle por Categoría</TremorTitle>
              <div className="mt-4 max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">Facturado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregatedCategories.map((cat, idx) => (
                      <TableRow key={cat.categoria_nombre}>
                        <TableCell>
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{cat.categoria_nombre}</TableCell>
                        <TableCell className="text-right">{formatNumber(cat.unidades)}</TableCell>
                        <TableCell className="text-right font-bold" style={{ color: BRAND_COLORS.primary }}>
                          {formatCurrency(cat.facturado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TremorCard>
          </div>
        )}

        {/* TAB: Extras */}
        {mainView === "Extras" && (
          <div className="space-y-6">
            <TremorCard className="p-4">
              <TremorTitle>Opciones y Extras</TremorTitle>
              <div className="mt-4 max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opción</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">Facturado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...optionData]
                      .sort((a, b) => b.facturado_extra - a.facturado_extra)
                      .map((opt, idx) => (
                        <TableRow key={`${opt.option_sku}-${idx}`}>
                          <TableCell className="font-medium">{opt.option_name}</TableCell>
                          <TableCell>{opt.producto_nombre}</TableCell>
                          <TableCell className="text-right">{formatNumber(opt.veces_seleccionada)}</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: BRAND_COLORS.primary }}>
                            {formatCurrency(opt.facturado_extra)}
                          </TableCell>
                        </TableRow>
                      ))}
                    {optionData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                          Sin datos de opciones para el período seleccionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TremorCard>
          </div>
        )}

        {/* TAB: Patrones */}
        {mainView === "Patrones" && (
          <div className="space-y-6">
            {/* Top 5 by Shift */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comida */}
              <TremorCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sun className="h-5 w-5 text-[#ffcb77]" />
                  <TremorTitle>Top 5 Productos Comida</TremorTitle>
                </div>
                <div className="space-y-3">
                  {topProductsByShift.comida.map((product, idx) => (
                    <div
                      key={product.product_sku}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{product.producto_nombre}</p>
                          <p className="text-xs text-slate-500">{product.categoria_nombre}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                          {formatCurrency(product.facturado)}
                        </p>
                        <p className="text-xs text-slate-500">{formatNumber(product.unidades)} uds</p>
                      </div>
                    </div>
                  ))}
                  {topProductsByShift.comida.length === 0 && (
                    <p className="text-slate-500 text-center py-4">Sin datos de turno comida</p>
                  )}
                </div>
              </TremorCard>

              {/* Cena */}
              <TremorCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="h-5 w-5 text-[#364f6b]" />
                  <TremorTitle>Top 5 Productos Cena</TremorTitle>
                </div>
                <div className="space-y-3">
                  {topProductsByShift.cena.map((product, idx) => (
                    <div
                      key={product.product_sku}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{product.producto_nombre}</p>
                          <p className="text-xs text-slate-500">{product.categoria_nombre}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                          {formatCurrency(product.facturado)}
                        </p>
                        <p className="text-xs text-slate-500">{formatNumber(product.unidades)} uds</p>
                      </div>
                    </div>
                  ))}
                  {topProductsByShift.cena.length === 0 && (
                    <p className="text-slate-500 text-center py-4">Sin datos de turno cena</p>
                  )}
                </div>
              </TremorCard>
            </div>

            {/* Products by Category */}
            <TremorCard className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 className="h-5 w-5 text-[#ffcb77]" />
                <TremorTitle>Productos por Categoría</TremorTitle>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(productsByCategory.entries())
                  .slice(0, 6)
                  .map(([category, products], catIdx) => (
                    <div key={category} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length] }}
                        />
                        <span className="font-medium text-slate-700">{category}</span>
                      </div>
                      <div className="space-y-1">
                        {products.slice(0, 3).map((p, idx) => (
                          <div key={p.product_sku} className="flex justify-between text-sm gap-2">
                            <span className="text-slate-600 truncate flex-1 min-w-0">
                              <span className="mr-1">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                              {p.producto_nombre}
                            </span>
                            <span className="font-medium shrink-0" style={{ color: BRAND_COLORS.primary }}>
                              {formatCurrency(p.facturado)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </TremorCard>
          </div>
        )}
      </PageContent>
    </div>
  )
}
