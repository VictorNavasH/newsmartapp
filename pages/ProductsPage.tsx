"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { TremorCard, TremorTitle } from "../components/ui/TremorCard"
import { MetricGroupCard } from "../components/ui/MetricGroupCard"
import { DateRangePicker } from "../components/ui/date-range-picker"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { fetchProductMix, fetchCategoryMix, fetchOptionMix, getBusinessDate } from "../lib/dataService"
import type {
  DateRange,
  ProductMixItem,
  CategoryMixItem,
  OptionMixItem,
  ProductAggregated,
  CategoryAggregated,
  OptionAggregated,
} from "../types"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Package,
  ShoppingCart,
  Grid3X3,
  TrendingUp,
  Award,
  Sun,
  Moon,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  TrendingDown,
  X,
  Layers,
} from "lucide-react"
import { PageHeader } from "../components/layout/PageHeader"
import { PageContent } from "../components/layout/PageContent"
import { CHART_CONFIG, BRAND_COLORS } from "../constants"

type PeriodKey = "ayer" | "semana" | "mes" | "trimestre" | "custom"
type SortField = "facturado" | "unidades" | "producto_nombre"
type SortDirection = "asc" | "desc"

const CATEGORY_COLORS = [
  "#02b1c4", // Primary cyan
  "#227c9d", // Teal
  "#ffcb77", // Yellow
  "#17c3b2", // Green
  "#fe6d73", // Red
  "#364f6b", // Dark blue
  "#9b5de5", // Purple
  "#00bbf9", // Light blue
]

const toLocalISOString = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const formatCurrency = (value: number | undefined | null) =>
  (value ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })

const formatNumber = (value: number | undefined | null) => (value ?? 0).toLocaleString("es-ES")

const formatPercent = (value: number | undefined | null) => `${(value ?? 0).toFixed(1)}%`

const ProductsPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<PeriodKey>("ayer")
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const businessToday = getBusinessDate()
    const yesterday = new Date(businessToday)
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: yesterday, to: yesterday }
  })

  // Filters
  const [selectedTurno, setSelectedTurno] = useState<string>("todos")
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas")

  // Data
  const [productData, setProductData] = useState<ProductMixItem[]>([])
  const [categoryData, setCategoryData] = useState<CategoryMixItem[]>([])
  const [optionData, setOptionData] = useState<OptionMixItem[]>([])

  // Sorting
  const [sortField, setSortField] = useState<SortField>("facturado")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const setPeriod = (period: PeriodKey) => {
    const today = getBusinessDate()
    const from = new Date(today)
    const to = new Date(today)

    switch (period) {
      case "ayer":
        from.setDate(today.getDate() - 1)
        to.setDate(today.getDate() - 1)
        break
      case "semana":
        const day = today.getDay() || 7
        if (day !== 1) from.setDate(today.getDate() - (day - 1))
        to.setDate(today.getDate() - 1)
        break
      case "mes":
        from.setDate(1)
        to.setDate(today.getDate() - 1)
        break
      case "trimestre":
        const currentQuarter = Math.floor(today.getMonth() / 3)
        from.setMonth(currentQuarter * 3, 1)
        to.setDate(today.getDate() - 1)
        break
      default:
        return
    }

    setActiveTab(period)
    setDateRange({ from, to })
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const startDate = toLocalISOString(dateRange.from)
      const endDate = toLocalISOString(dateRange.to)

      const [products, categories, options] = await Promise.all([
        fetchProductMix(startDate, endDate, selectedTurno, selectedCategoria),
        fetchCategoryMix(startDate, endDate, selectedTurno),
        fetchOptionMix(startDate, endDate, selectedTurno, false),
      ])

      setProductData(products)
      setCategoryData(categories)
      setOptionData(options)
      setLoading(false)
    }

    loadData()
  }, [dateRange, selectedTurno, selectedCategoria])

  // Aggregate products
  const aggregatedProducts = useMemo((): ProductAggregated[] => {
    const map = new Map<
      string,
      {
        product_sku: string
        producto_nombre: string
        categoria_nombre: string
        precio_carta: number
        unidades: number
        facturado: number
        precio_medio_real: number
        diferencia_precio: number
        unidades_void: number
        facturado_void: number
      }
    >()

    // Use filteredProducts here as it's already available and might contain more refined data
    productData.forEach((item) => {
      const key = item.product_sku
      if (map.has(key)) {
        const existing = map.get(key)!
        existing.unidades += item.unidades
        existing.facturado += item.facturado
        existing.unidades_void += item.unidades_void ?? 0
        existing.facturado_void += item.facturado_void ?? 0
      } else {
        map.set(key, {
          product_sku: item.product_sku,
          producto_nombre: item.producto_nombre,
          categoria_nombre: item.categoria_nombre,
          precio_carta: item.precio_carta,
          unidades: item.unidades,
          facturado: item.facturado,
          precio_medio_real: item.precio_medio_real,
          diferencia_precio: item.diferencia_precio,
          unidades_void: item.unidades_void ?? 0,
          facturado_void: item.facturado_void ?? 0,
        })
      }
    })

    const arr = Array.from(map.values())
    const totalFacturado = arr.reduce((sum, p) => sum + p.facturado, 0)
    const totalUnidades = arr.reduce((sum, p) => sum + p.unidades, 0)

    arr.forEach((p) => {
      p.pct_facturado = totalFacturado > 0 ? (p.facturado / totalFacturado) * 100 : 0
      p.pct_unidades = totalUnidades > 0 ? (p.unidades / totalUnidades) * 100 : 0
      p.precio_medio_real = p.unidades > 0 ? p.facturado / p.unidades : 0
      p.diferencia_precio = p.precio_carta - p.precio_medio_real
      p.pct_void = p.unidades + p.unidades_void > 0 ? (p.unidades_void / (p.unidades + p.unidades_void)) * 100 : 0
    })

    return arr
  }, [productData]) // Changed from filteredProducts to productData

  // Aggregate categories
  const aggregatedCategories = useMemo((): CategoryAggregated[] => {
    const map = new Map<
      string,
      {
        category_sku: string
        categoria_nombre: string
        productos_distintos: Set<string>
        unidades: number
        facturado: number
        unidades_void: number
        facturado_void: number
      }
    >()

    categoryData.forEach((item) => {
      const existing = map.get(item.category_sku)
      if (existing) {
        existing.productos_distintos.add(item.product_sku)
        existing.unidades += item.unidades
        existing.facturado += item.facturado
        existing.unidades_void += item.unidades_void ?? 0
        existing.facturado_void += item.facturado_void ?? 0
      } else {
        map.set(item.category_sku, {
          category_sku: item.category_sku,
          categoria_nombre: item.categoria_nombre,
          productos_distintos: new Set([item.product_sku]),
          unidades: item.unidades,
          facturado: item.facturado,
          unidades_void: item.unidades_void ?? 0,
          facturado_void: item.facturado_void ?? 0,
        })
      }
    })

    const arr = Array.from(map.values())
    const totalFacturado = arr.reduce((sum, c) => sum + c.facturado, 0)
    const totalUnidades = arr.reduce((sum, c) => sum + c.unidades, 0)

    return arr
      .map((c) => ({
        category_sku: c.category_sku,
        categoria_nombre: c.categoria_nombre,
        productos_distintos: c.productos_distintos.size,
        unidades: c.unidades,
        facturado: c.facturado,
        ticket_medio_item: c.unidades > 0 ? c.facturado / c.unidades : 0,
        pct_facturado: totalFacturado > 0 ? (c.facturado / totalFacturado) * 100 : 0,
        pct_unidades: totalUnidades > 0 ? (c.unidades / totalUnidades) * 100 : 0,
        unidades_void: c.unidades_void,
        facturado_void: c.facturado_void,
        pct_void: c.unidades + c.unidades_void > 0 ? (c.unidades_void / (c.unidades + c.unidades_void)) * 100 : 0,
      }))
      .sort((a, b) => b.facturado - a.facturado)
  }, [categoryData]) // Changed from filteredProducts to categoryData

  // Aggregate options (extras)
  const aggregatedOptions = useMemo((): OptionAggregated[] => {
    const map = new Map<
      string,
      {
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
      }
    >()

    optionData.forEach((item) => {
      const existing = map.get(item.option_sku)
      if (existing) {
        existing.veces_seleccionada += item.veces_seleccionada
        existing.facturado_extra += item.facturado_extra
        existing.veces_void += item.veces_void ?? 0
        existing.facturado_void += item.facturado_void ?? 0
      } else {
        map.set(item.option_sku, {
          option_sku: item.option_sku,
          option_name: item.option_name,
          precio_opcion: item.precio_opcion,
          producto_nombre: item.producto_nombre,
          categoria_nombre: item.categoria_nombre,
          veces_seleccionada: item.veces_seleccionada,
          facturado_extra: item.facturado_extra,
          penetracion_pct: item.penetracion_pct,
          es_extra_pago: item.es_extra_pago,
          veces_void: item.veces_void ?? 0,
          facturado_void: item.facturado_void ?? 0,
        })
      }
    })

    return Array.from(map.values())
      .map((o) => ({
        ...o,
        pct_void:
          o.veces_seleccionada + o.veces_void > 0 ? (o.veces_void / (o.veces_seleccionada + o.veces_void)) * 100 : 0,
      }))
      .sort((a, b) => b.facturado_extra - a.facturado_extra)
  }, [optionData]) // Changed from optionsData to optionData

  // Category data by shift
  const categoryByShift = useMemo(() => {
    const lunchMap = new Map<string, number>()
    const dinnerMap = new Map<string, number>()

    categoryData.forEach((item) => {
      if (item.turno_nombre === "Comida") {
        lunchMap.set(item.categoria_nombre, (lunchMap.get(item.categoria_nombre) || 0) + item.facturado)
      } else if (item.turno_nombre === "Cena") {
        dinnerMap.set(item.categoria_nombre, (dinnerMap.get(item.categoria_nombre) || 0) + item.facturado)
      }
    })

    const categories = new Set([...lunchMap.keys(), ...dinnerMap.keys()])
    return Array.from(categories).map((cat) => ({
      categoria: cat,
      comida: lunchMap.get(cat) || 0,
      cena: dinnerMap.get(cat) || 0,
    }))
  }, [categoryData])

  // Products by day of week (for Patterns tab)
  const productsByDayOfWeek = useMemo(() => {
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const dayMap = new Map<number, { unidades: number; facturado: number }>()

    productData.forEach((item) => {
      const day = item.dia_semana
      if (dayMap.has(day)) {
        const existing = dayMap.get(day)!
        existing.unidades += item.unidades
        existing.facturado += item.facturado
      } else {
        dayMap.set(day, { unidades: item.unidades, facturado: item.facturado })
      }
    })

    // Reorder to start with Monday (1)
    const orderedDays = [1, 2, 3, 4, 5, 6, 0]
    return orderedDays.map((day) => ({
      dia: dayNames[day],
      dia_num: day,
      unidades: dayMap.get(day)?.unidades || 0,
      facturado: dayMap.get(day)?.facturado || 0,
    }))
  }, [productData])

  // KPIs
  const kpis = useMemo(() => {
    // Totales
    const totalUnidades = aggregatedProducts.reduce((sum, p) => sum + p.unidades, 0)
    const totalFacturado = aggregatedProducts.reduce((sum, p) => sum + p.facturado, 0)
    const productosDistintos = aggregatedProducts.length
    const categoriasActivas = aggregatedCategories.length
    const totalUnidadesVoid = aggregatedProducts.reduce((sum, p) => sum + p.unidades_void, 0)
    const totalFacturadoVoid = aggregatedProducts.reduce((sum, p) => sum + p.facturado_void, 0)
    const pctVoidGlobal =
      totalUnidades + totalUnidadesVoid > 0 ? (totalUnidadesVoid / (totalUnidades + totalUnidadesVoid)) * 100 : 0

    // Por turno desde productData (datos sin agregar)
    let unidadesComida = 0
    let unidadesCena = 0
    let facturadoComida = 0
    let facturadoCena = 0
    let unidadesVoidComida = 0
    let unidadesVoidCena = 0
    let facturadoVoidComida = 0
    let facturadoVoidCena = 0
    const productosComida = new Set<string>()
    const productosCena = new Set<string>()
    const categoriasComida = new Set<string>()
    const categoriasCena = new Set<string>()

    productData.forEach((item) => {
      if (item.turno_nombre === "Comida") {
        unidadesComida += item.unidades
        facturadoComida += item.facturado
        unidadesVoidComida += item.unidades_void ?? 0
        facturadoVoidComida += item.facturado_void ?? 0
        productosComida.add(item.product_sku)
        categoriasComida.add(item.category_sku)
      } else if (item.turno_nombre === "Cena") {
        unidadesCena += item.unidades
        facturadoCena += item.facturado
        unidadesVoidCena += item.unidades_void ?? 0
        facturadoVoidCena += item.facturado_void ?? 0
        productosCena.add(item.product_sku)
        categoriasCena.add(item.category_sku)
      }
    })

    return {
      totalUnidades,
      totalFacturado,
      productosDistintos,
      categoriasActivas,
      totalUnidadesVoid,
      totalFacturadoVoid,
      pctVoidGlobal,
      // Por turno
      unidadesComida,
      unidadesCena,
      facturadoComida,
      facturadoCena,
      unidadesVoidComida,
      unidadesVoidCena,
      facturadoVoidComida,
      facturadoVoidCena,
      productosComida: productosComida.size,
      productosCena: productosCena.size,
      categoriasComida: categoriasComida.size,
      categoriasCena: categoriasCena.size,
    }
  }, [aggregatedProducts, aggregatedCategories, productData])

  // Sorted products
  const sortedProducts = useMemo(() => {
    const sorted = [...aggregatedProducts]
    sorted.sort((a, b) => {
      const aVal: number | string = a[sortField]
      const bVal: number | string = b[sortField]

      if (sortField === "producto_nombre") {
        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      }

      return sortDirection === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })
    return sorted
  }, [aggregatedProducts, sortField, sortDirection])

  // Filtered products (used for unit-based sorting in ranking tab)
  const filteredProducts = useMemo(() => {
    // This could be expanded with more filter logic if needed in the future
    // For now, it's just returning aggregatedProducts as the base for sorting
    return aggregatedProducts
  }, [aggregatedProducts])

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

  // Chart data with fill for PieChart fix
  const pieChartData = useMemo(() => {
    return aggregatedCategories.map((cat, idx) => ({
      name: cat.categoria_nombre,
      value: cat.facturado,
      fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }))
  }, [aggregatedCategories])

  const barChartCategoryData = useMemo(() => {
    return aggregatedCategories.slice(0, 10).map((cat, idx) => ({
      ...cat,
      fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }))
  }, [aggregatedCategories])

  const clearFilters = () => {
    setSelectedTurno("todos")
    setSelectedCategoria("todas")
  }

  const hasFilters = selectedTurno !== "todos" || selectedCategoria !== "todas"

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        icon={Package}
        title="Mix de Producto"
        subtitle="Análisis de ventas por producto, categoría y opciones"
        actions={
          <div className="flex items-center gap-4">
            {/* Filters */}
            <Select value={selectedTurno} onValueChange={setSelectedTurno}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los turnos</SelectItem>
                <SelectItem value="comida">Comida</SelectItem>
                <SelectItem value="cena">Cena</SelectItem>
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

            {/* Period Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <TabsList className="bg-white border border-slate-200 shadow-sm">
                <TabsTrigger
                  value="ayer"
                  className={
                    activeTab === "ayer" ? "data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white" : ""
                  }
                >
                  Ayer
                </TabsTrigger>
                <TabsTrigger
                  value="semana"
                  className={
                    activeTab === "semana" ? "data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white" : ""
                  }
                >
                  Semana
                </TabsTrigger>
                <TabsTrigger
                  value="mes"
                  className={
                    activeTab === "mes" ? "data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white" : ""
                  }
                >
                  Mes
                </TabsTrigger>
                <TabsTrigger
                  value="trimestre"
                  className={
                    activeTab === "trimestre" ? "data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white" : ""
                  }
                >
                  Trimestre
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={(range) => {
                setDateRange(range)
                setActiveTab("custom")
              }}
            />
          </div>
        }
      />

      <PageContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <MetricGroupCard
                title="Unidades Vendidas"
                icon={<ShoppingCart className="w-5 h-5" />}
                loading={loading}
                total={{ value: kpis.totalUnidades, delta: 0, trend: "neutral" }}
                lunch={{ value: kpis.unidadesComida, delta: 0, trend: "neutral" }}
                dinner={{ value: kpis.unidadesCena, delta: 0, trend: "neutral" }}
                secondaryMetric={{
                  label: "FACTURADO",
                  value: formatCurrency(kpis.totalFacturado),
                }}
              />

              <MetricGroupCard
                title="Productos y Categorias"
                icon={<Layers className="w-5 h-5" />}
                loading={loading}
                total={{ value: kpis.productosDistintos, delta: 0, trend: "neutral" }}
                lunch={{ value: kpis.productosComida, delta: 0, trend: "neutral" }}
                dinner={{ value: kpis.productosCena, delta: 0, trend: "neutral" }}
                secondaryMetric={{
                  label: "CATEGORIAS",
                  value: String(kpis.categoriasActivas),
                }}
              />

              <MetricGroupCard
                title="Uds. Anuladas"
                icon={<X className="w-5 h-5" />}
                loading={loading}
                total={{ value: kpis.totalUnidadesVoid, delta: 0, trend: "neutral" }}
                lunch={{ value: kpis.unidadesVoidComida, delta: 0, trend: "neutral" }}
                dinner={{ value: kpis.unidadesVoidCena, delta: 0, trend: "neutral" }}
                secondaryMetric={{
                  label: "FACT. NO REALIZ.",
                  value: formatCurrency(kpis.totalFacturadoVoid),
                }}
                tooltip="Unidades anuladas por cambios, errores o cancelaciones del cliente"
              />
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="ranking" className="w-full">
              <TabsList className="bg-white border border-slate-200 shadow-sm mb-4">
                <TabsTrigger
                  value="ranking"
                  className="flex items-center gap-1 data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white"
                >
                  <Award className="w-4 h-4" />
                  Ranking
                </TabsTrigger>
                <TabsTrigger
                  value="categorias"
                  className="flex items-center gap-1 data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white"
                >
                  <Grid3X3 className="w-4 h-4" />
                  Categorías
                </TabsTrigger>
                <TabsTrigger
                  value="extras"
                  className="flex items-center gap-1 data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white"
                >
                  <Package className="w-4 h-4" />
                  Extras
                </TabsTrigger>
                <TabsTrigger
                  value="patrones"
                  className="flex items-center gap-1 data-[state=active]:bg-[#17c3b2] data-[state=active]:text-white"
                >
                  <TrendingUp className="w-4 h-4" />
                  Patrones
                </TabsTrigger>
              </TabsList>

              {/* TAB: Ranking */}
              <TabsContent value="ranking">
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
                            <TableHead className="text-right">P. Real</TableHead>
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
                            <TableHead className="text-right">% Total</TableHead>
                            <TableHead className="text-right">Anulados</TableHead>
                            <TableHead>Categoría</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedProducts.map((product, idx) => {
                            const percentTotal =
                              kpis.totalFacturado > 0 ? (product.facturado / kpis.totalFacturado) * 100 : 0
                            return (
                              <TableRow key={product.product_sku} className="hover:bg-slate-50">
                                <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                                <TableCell className="font-medium">{product.producto_nombre}</TableCell>
                                <TableCell className="text-right text-slate-500">
                                  {formatCurrency(product.precio_carta)}
                                </TableCell>
                                <TableCell className="text-right text-slate-500">
                                  {formatCurrency(product.precio_medio_real)}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatNumber(product.unidades)}
                                </TableCell>
                                <TableCell className="text-right font-semibold" style={{ color: BRAND_COLORS.primary }}>
                                  {formatCurrency(product.facturado)}
                                </TableCell>
                                <TableCell className="text-right text-slate-500">{percentTotal.toFixed(1)}%</TableCell>
                                <TableCell className="text-right">
                                  {product.unidades_void > 0 ? (
                                    <span className="text-[#fe6d73] font-medium">{product.unidades_void}</span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {product.categoria_nombre}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TremorCard>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Top 10 Más Vendidos (por unidades) */}
                  <TremorCard className="p-4">
                    <TremorTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Top 10 Más Vendidos (Unidades)
                    </TremorTitle>
                    <div className="mt-4 max-h-[350px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Unidades</TableHead>
                            <TableHead className="text-right">Facturado</TableHead>
                            <TableHead>Categoría</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...filteredProducts]
                            .sort((a, b) => b.unidades - a.unidades)
                            .slice(0, 10)
                            .map((product, idx) => (
                              <TableRow key={product.product_sku} className="hover:bg-slate-50">
                                <TableCell>
                                  {idx < 3 ? (
                                    <span className="text-lg">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                                  ) : (
                                    <Badge className="bg-slate-100 text-slate-600">{idx + 1}</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{product.producto_nombre}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">
                                  {formatNumber(product.unidades)}
                                </TableCell>
                                <TableCell className="text-right text-slate-500">
                                  {formatCurrency(product.facturado)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {product.categoria_nombre}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TremorCard>

                  {/* Top 10 Menos Vendidos (por unidades) */}
                  <TremorCard className="p-4">
                    <TremorTitle className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[#fe6d73]" />
                      Top 10 Menos Vendidos (Unidades)
                    </TremorTitle>
                    <div className="mt-4 max-h-[350px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Unidades</TableHead>
                            <TableHead className="text-right">Facturado</TableHead>
                            <TableHead>Categoría</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...filteredProducts]
                            .filter((p) => p.unidades > 0) // Solo productos con al menos 1 venta
                            .sort((a, b) => a.unidades - b.unidades)
                            .slice(0, 10)
                            .map((product, idx) => (
                              <TableRow key={product.product_sku} className="hover:bg-slate-50">
                                <TableCell>
                                  <Badge className="bg-[#fe6d73]/10 text-[#fe6d73]">{idx + 1}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{product.producto_nombre}</TableCell>
                                <TableCell className="text-right font-semibold text-[#fe6d73]">
                                  {formatNumber(product.unidades)}
                                </TableCell>
                                <TableCell className="text-right text-slate-500">
                                  {formatCurrency(product.facturado)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {product.categoria_nombre}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">* Solo productos con al menos 1 venta en el período</p>
                  </TremorCard>
                </div>
              </TabsContent>

              {/* TAB: Categorías */}
              <TabsContent value="categorias">
                <div className="grid grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <TremorCard className="p-4">
                    <TremorTitle>Distribución por Categoría</TremorTitle>
                    <div className="h-[350px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="45%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            isAnimationActive={false}
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={CHART_CONFIG.tooltip.contentStyle}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ paddingTop: "10px" }}
                            payload={pieChartData.map((item) => ({
                              value: item.name,
                              type: "circle",
                              color: item.fill,
                            }))}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </TremorCard>

                  {/* Bar Chart by Category */}
                  <TremorCard className="p-4">
                    <TremorTitle>Facturación por Categoría</TremorTitle>
                    <div className="h-[350px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barChartCategoryData}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.grid.stroke} />
                          <XAxis
                            type="number"
                            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}€`)}
                          />
                          <YAxis type="category" dataKey="categoria_nombre" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={CHART_CONFIG.tooltip.contentStyle}
                          />
                          <Bar dataKey="facturado" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TremorCard>

                  <TremorCard className="col-span-2 p-4">
                    <TremorTitle>Resumen por Categoría</TremorTitle>
                    <div className="mt-4 max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Productos</TableHead>
                            <TableHead className="text-right">Unidades</TableHead>
                            <TableHead className="text-right">Facturado</TableHead>
                            <TableHead className="text-right">% Total</TableHead>
                            <TableHead className="text-right">Ticket Medio</TableHead>
                            <TableHead className="text-right">Anulados</TableHead>
                            <TableHead className="text-right">Fact. Perdido</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aggregatedCategories.map((cat, idx) => (
                            <TableRow key={cat.category_sku} className="hover:bg-slate-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                                  />
                                  {cat.categoria_nombre}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{cat.productos_distintos}</TableCell>
                              <TableCell className="text-right">{formatNumber(cat.unidades)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(cat.facturado)}
                              </TableCell>
                              <TableCell className="text-right text-slate-500">
                                {formatPercent(cat.pct_facturado)}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(cat.ticket_medio_item)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span
                                    className={cat.pct_void > 5 ? "text-[#fe6d73] font-semibold" : "text-slate-500"}
                                  >
                                    {cat.unidades_void}
                                  </span>
                                  {cat.pct_void > 5 && (
                                    <Badge className="bg-[#fe6d73]/10 text-[#fe6d73] text-xs px-1">
                                      {formatPercent(cat.pct_void)}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-[#fe6d73]">
                                {formatCurrency(cat.facturado_void)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TremorCard>

                  {/* Comparison by Shift */}
                  <TremorCard className="col-span-2 p-4">
                    <TremorTitle>Comparativa Comida vs Cena</TremorTitle>
                    <div className="h-[250px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryByShift} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.grid.stroke} />
                          <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={CHART_CONFIG.tooltip.contentStyle}
                          />
                          <Legend />
                          <Bar dataKey="comida" name="Comida" fill={BRAND_COLORS.lunch} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="cena" name="Cena" fill={BRAND_COLORS.accent} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TremorCard>
                </div>
              </TabsContent>

              {/* TAB: Extras */}
              <TabsContent value="extras">
                <div className="grid grid-cols-3 gap-4">
                  {/* Top 10 Extras de Pago */}
                  <TremorCard className="col-span-1 p-4">
                    <TremorTitle>Top 10 Extras Rentables</TremorTitle>
                    <p className="text-xs text-slate-500 mb-4">Solo extras con coste adicional</p>
                    <div className="space-y-3">
                      {aggregatedOptions
                        .filter((o) => o.es_extra_pago)
                        .slice(0, 10)
                        .map((option, idx) => {
                          const maxFacturado = Math.max(
                            ...aggregatedOptions.filter((o) => o.es_extra_pago).map((o) => o.facturado_extra),
                          )
                          const pct = maxFacturado > 0 ? (option.facturado_extra / maxFacturado) * 100 : 0

                          return (
                            <div key={option.option_sku} className="flex items-center gap-3">
                              <span className="text-sm font-medium text-slate-400 w-5">{idx + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium truncate max-w-[150px]">
                                    {option.option_name}
                                  </span>
                                  <span className="text-sm font-semibold">
                                    {formatCurrency(option.facturado_extra)}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: BRAND_COLORS.success,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </TremorCard>

                  {/* All Options Table - Añadida columna Anuladas */}
                  <TremorCard className="col-span-2 p-4">
                    <TremorTitle>Detalle de Opciones y Modificadores</TremorTitle>
                    <div className="mt-4 max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Opción</TableHead>
                            <TableHead>Producto Asociado</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Veces</TableHead>
                            <TableHead className="text-right">Facturado</TableHead>
                            <TableHead className="text-center">Tipo</TableHead>
                            <TableHead className="text-right">Anuladas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aggregatedOptions.slice(0, 50).map((option) => (
                            <TableRow key={option.option_sku} className="hover:bg-slate-50">
                              <TableCell className="font-medium">{option.option_name}</TableCell>
                              <TableCell className="text-slate-500 text-sm">{option.producto_nombre}</TableCell>
                              <TableCell className="text-right">{formatCurrency(option.precio_opcion)}</TableCell>
                              <TableCell className="text-right">{formatNumber(option.veces_seleccionada)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(option.facturado_extra)}
                              </TableCell>
                              <TableCell className="text-center">
                                {option.es_extra_pago ? (
                                  <Badge className="bg-emerald-100 text-emerald-700">Extra</Badge>
                                ) : (
                                  <Badge variant="outline">Gratis</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span
                                    className={option.pct_void > 5 ? "text-[#fe6d73] font-semibold" : "text-slate-500"}
                                  >
                                    {option.veces_void}
                                  </span>
                                  {option.pct_void > 5 && (
                                    <Badge className="bg-[#fe6d73]/10 text-[#fe6d73] text-xs px-1">
                                      {formatPercent(option.pct_void)}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TremorCard>
                </div>
              </TabsContent>

              {/* TAB: Patrones */}
              <TabsContent value="patrones">
                <div className="grid grid-cols-2 gap-4">
                  {/* Sales by Day of Week */}
                  <TremorCard className="p-4">
                    <TremorTitle>Ventas por Día de la Semana</TremorTitle>
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productsByDayOfWeek} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.grid.stroke} />
                          <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: number, name: string) =>
                              name === "facturado" ? formatCurrency(value) : formatNumber(value)
                            }
                            contentStyle={CHART_CONFIG.tooltip.contentStyle}
                          />
                          <Legend />
                          <Bar dataKey="facturado" name="Facturado" fill={BRAND_COLORS.primary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TremorCard>

                  {/* Units by Day of Week */}
                  <TremorCard className="p-4">
                    <TremorTitle>Unidades por Día de la Semana</TremorTitle>
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productsByDayOfWeek} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.grid.stroke} />
                          <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => formatNumber(value)}
                            contentStyle={CHART_CONFIG.tooltip.contentStyle}
                          />
                          <Legend />
                          <Bar dataKey="unidades" name="Unidades" fill={BRAND_COLORS.accent} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TremorCard>

                  {/* Top products by shift */}
                  <TremorCard className="p-4">
                    <TremorTitle className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Top 5 Productos - Comida
                    </TremorTitle>
                    <div className="mt-4 space-y-3">
                      {productData
                        .filter((p) => p.turno_nombre === "Comida")
                        .reduce(
                          (acc, item) => {
                            const existing = acc.find((a) => a.producto_nombre === item.producto_nombre)
                            if (existing) {
                              existing.facturado += item.facturado
                            } else {
                              acc.push({ producto_nombre: item.producto_nombre, facturado: item.facturado })
                            }
                            return acc
                          },
                          [] as { producto_nombre: string; facturado: number }[],
                        )
                        .sort((a, b) => b.facturado - a.facturado)
                        .slice(0, 5)
                        .map((product, idx) => (
                          <div key={product.producto_nombre} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-400">{idx + 1}</span>
                              <span className="text-sm">{product.producto_nombre}</span>
                            </div>
                            <span className="text-sm font-semibold">{formatCurrency(product.facturado)}</span>
                          </div>
                        ))}
                    </div>
                  </TremorCard>

                  <TremorCard className="p-4">
                    <TremorTitle className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      Top 5 Productos - Cena
                    </TremorTitle>
                    <div className="mt-4 space-y-3">
                      {productData
                        .filter((p) => p.turno_nombre === "Cena")
                        .reduce(
                          (acc, item) => {
                            const existing = acc.find((a) => a.producto_nombre === item.producto_nombre)
                            if (existing) {
                              existing.facturado += item.facturado
                            } else {
                              acc.push({ producto_nombre: item.producto_nombre, facturado: item.facturado })
                            }
                            return acc
                          },
                          [] as { producto_nombre: string; facturado: number }[],
                        )
                        .sort((a, b) => b.facturado - a.facturado)
                        .slice(0, 5)
                        .map((product, idx) => (
                          <div key={product.producto_nombre} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-400">{idx + 1}</span>
                              <span className="text-sm">{product.producto_nombre}</span>
                            </div>
                            <span className="text-sm font-semibold">{formatCurrency(product.facturado)}</span>
                          </div>
                        ))}
                    </div>
                  </TremorCard>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </PageContent>
    </div>
  )
}

export default ProductsPage
