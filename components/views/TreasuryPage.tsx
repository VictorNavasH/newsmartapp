"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Search,
  AlertCircle,
  CreditCard,
  ArrowDownLeft,
  Wallet,
  Calendar,
  Percent,
  ArrowUpCircle,
  ArrowDownCircle,
  LayoutGrid,
  Wand2,
  Sparkles,
  User,
  Download,
  type LucideIcon,
  Receipt,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Wifi,
  Phone,
  Heart,
  Gift,
  Plane,
  GraduationCap,
  Briefcase,
  Users,
  Baby,
  PiggyBank,
  Banknote,
  CircleDollarSign,
  HandCoins,
  BadgeDollarSign,
  Coins,
  FileText,
  Shirt,
  Dumbbell,
  Scissors,
  Stethoscope,
  Pill,
  BookOpen,
  Music,
  Gamepad2,
  Tv,
  Coffee,
  Wine,
  Beer,
  Pizza,
  Apple,
  Leaf,
  Droplet,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Key,
  Lock,
  Shield,
  Settings,
  Wrench,
  Hammer,
  PaintBucket,
  Truck,
  Bus,
  Train,
  Bike,
  Footprints,
  MapPin,
  Globe,
  Flag,
  Star,
  Award,
  Trophy,
  Target,
  Calculator,
  FileSpreadsheet,
  FolderOpen,
  Archive,
  Package,
  Box,
  ShoppingBag,
  Store,
  Building,
  Factory,
  Warehouse,
  HardHat,
  Glasses,
  Watch,
  Gem,
  Crown,
  Sparkle,
  PartyPopper,
  Cake,
  IceCream,
  Candy,
  Cookie,
  Croissant,
  Salad,
  Soup,
  Fish,
  Beef,
  Egg,
  Milk,
  Carrot,
  Banana,
  TreePine,
  Flower,
  Bug,
  Cat,
  Dog,
  Bird,
  Rabbit,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { DateRangePickerExpenses } from "@/components/ui/date-range-picker-expenses"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MenuBar } from "@/components/ui/menu-bar"
import { useToast } from "@/hooks/use-toast"
import {
  fetchTreasuryKPIs,
  fetchTreasuryAccounts,
  fetchTreasuryTransactions,
  fetchTreasuryTransactionsSummary,
  fetchTreasuryCategories,
  updateTransactionCategory,
  fetchTreasuryByCategory,
  fetchPoolBancarioResumen, // Added
  fetchPoolBancarioPrestamos, // Added
  fetchPoolBancarioVencimientos, // Added
  fetchPoolBancarioPorBanco, // Added
  fetchPoolBancarioCalendario, // Added
} from "@/lib/treasuryService"
import { BRAND_COLORS } from "@/constants"
import type {
  TreasuryKPIs,
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryTransactionsSummary,
  TreasuryCategory,
  TreasuryCategoryBreakdown,
  DateRange,
  PoolBancarioResumen, // Added
  PoolBancarioPrestamo, // Added
  PoolBancarioVencimiento, // Added
  PoolBancarioPorBanco, // Added
  PoolBancarioCalendarioMes, // Added
} from "@/types"
import { format, parseISO, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart, // Added
  Pie, // Added
} from "recharts"
import { ChartTooltip } from "@/components/charts/ChartTooltip" // Added

const PAGE_SIZE = 50

type TipoFilter = "all" | "ingreso" | "gasto" | "sin_categorizar"

const TIPO_LABELS: Record<TipoFilter, string> = {
  all: "Todos",
  ingreso: "Ingresos",
  gasto: "Gastos",
  sin_categorizar: "Sin categorizar",
}

const BANK_INFO: Record<string, { color: string }> = {
  CaixaBank: { color: "#32CBFF" },
  BBVA: { color: "#004481" },
  Santander: { color: "#EC0000" },
  Sabadell: { color: "#00A6DE" },
}

const getBankInfo = (banco: string) => {
  const normalizedName = Object.keys(BANK_INFO).find((key) => banco.toLowerCase().includes(key.toLowerCase()))
  return normalizedName ? BANK_INFO[normalizedName] : { color: "#64748b" }
}

// Helper para obtener logo de banco
const getBankLogo = (banco: string): string | null => {
  // Removed redundant BANK_CONFIG usage, replaced with getBankInfo logic
  const key = Object.keys(BANK_INFO).find((k) => banco?.toLowerCase().includes(k.toLowerCase()))
  return key
    ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${
        {
          CaixaBank: "0/0f/Caixabank_logo.svg/200px-Caixabank_logo.svg.png",
          BBVA: "7/7a/BBVA_2019.svg/200px-BBVA_2019.svg.png",
          Santander: "b/b8/Banco_Santander_Logotipo.svg/200px-Banco_Santander_Logotipo.svg.png",
          Sabadell: "8/8e/Banco_Sabadell_logo.svg/200px-Banco_Sabadell_logo.svg.png",
        }[key as keyof typeof BANK_INFO]
      }`
    : null
}

// Helper para obtener color de banco
const getBankColor = (banco: string, fallbackIndex = 0): string => {
  const bankInfo = getBankInfo(banco)
  if (bankInfo.color) return bankInfo.color
  const fallbackColors = ["#227c9d", "#17c3b2", "#ffcb77", "#fe6d73"]
  return fallbackColors[fallbackIndex % fallbackColors.length]
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value)
}

const formatCurrencyCompact = (value: number): string => {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`
  }
  return `${value.toFixed(0)}€`
}

const formatIBAN = (iban: string): string => {
  if (!iban) return ""
  return `****${iban.slice(-4)}`
}

const getTransactionDescription = (tx: TreasuryTransaction): { main: string; secondary: string | null } => {
  // Prioridad: description > counterparty_name > reference
  let main = ""
  let secondary: string | null = null

  if (tx.description && tx.description.trim() !== "") {
    main = tx.description
    // Si hay descripcion, mostrar counterparty como secundario si existe
    if (tx.counterparty_name && tx.counterparty_name.trim() !== "") {
      secondary = tx.counterparty_name
    }
  } else if (tx.counterparty_name && tx.counterparty_name.trim() !== "") {
    main = tx.counterparty_name
    // Si usamos counterparty como principal, mostrar reference como secundario
    if (tx.reference && tx.reference.trim() !== "") {
      secondary = `Ref: ${tx.reference}`
    }
  } else if (tx.reference && tx.reference.trim() !== "") {
    main = `Ref: ${tx.reference}`
  } else {
    main = "Sin descripción"
  }

  return { main, secondary }
}

const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Finanzas
  wallet: Wallet,
  "credit-card": CreditCard,
  creditcard: CreditCard,
  bank: Landmark,
  landmark: Landmark,
  building2: Building2,
  receipt: Receipt,
  piggybank: PiggyBank,
  piggy: PiggyBank,
  banknote: Banknote,
  money: Banknote,
  coins: Coins,
  dollar: CircleDollarSign,
  "circle-dollar-sign": CircleDollarSign,
  handcoins: HandCoins,
  "badge-dollar-sign": BadgeDollarSign,

  // Compras y comercio
  "shopping-cart": ShoppingCart,
  shoppingcart: ShoppingCart,
  cart: ShoppingCart,
  "shopping-bag": ShoppingBag,
  shoppingbag: ShoppingBag,
  store: Store,
  shop: Store,
  package: Package,
  box: Box,

  // Comida y bebida
  utensils: Utensils,
  food: Utensils,
  restaurant: Utensils,
  coffee: Coffee,
  cafe: Coffee,
  wine: Wine,
  beer: Beer,
  pizza: Pizza,
  apple: Apple,
  salad: Salad,
  fish: Fish,
  beef: Beef,
  egg: Egg,
  milk: Milk,
  carrot: Carrot,
  banana: Banana,
  icecream: IceCream,
  cake: Cake,
  cookie: Cookie,
  croissant: Croissant,
  candy: Candy,
  soup: Soup,

  // Transporte
  car: Car,
  truck: Truck,
  bus: Bus,
  train: Train,
  bike: Bike,
  plane: Plane,
  flight: Plane,
  travel: Plane,
  footprints: Footprints,
  walk: Footprints,

  // Hogar
  home: Home,
  house: Home,
  building: Building,
  warehouse: Warehouse,
  factory: Factory,
  key: Key,
  lock: Lock,

  // Servicios
  zap: Zap,
  electricity: Zap,
  light: Zap,
  wifi: Wifi,
  internet: Wifi,
  phone: Phone,
  mobile: Phone,
  droplet: Droplet,
  water: Droplet,
  flame: Flame,
  gas: Flame,
  fire: Flame,
  snowflake: Snowflake,
  ac: Snowflake,

  // Salud
  heart: Heart,
  health: Heart,
  stethoscope: Stethoscope,
  medical: Stethoscope,
  pill: Pill,
  medicine: Pill,

  // Educación
  "graduation-cap": GraduationCap,
  graduationcap: GraduationCap,
  education: GraduationCap,
  school: GraduationCap,
  bookopen: BookOpen,
  book: BookOpen,

  // Trabajo
  briefcase: Briefcase,
  work: Briefcase,
  job: Briefcase,
  hardhat: HardHat,
  construction: HardHat,

  // Personas
  users: Users,
  people: Users,
  family: Users,
  user: User,
  person: User,
  baby: Baby,
  child: Baby,

  // Entretenimiento
  gift: Gift,
  present: Gift,
  music: Music,
  gamepad2: Gamepad2,
  gaming: Gamepad2,
  games: Gamepad2,
  tv: Tv,
  television: Tv,
  partypopper: PartyPopper,
  party: PartyPopper,
  celebration: PartyPopper,

  // Deporte y fitness
  dumbbell: Dumbbell,
  gym: Dumbbell,
  fitness: Dumbbell,
  sport: Dumbbell,
  trophy: Trophy,
  award: Award,
  medal: Award,
  star: Star,
  target: Target,

  // Ropa y accesorios
  shirt: Shirt,
  clothes: Shirt,
  clothing: Shirt,
  scissors: Scissors,
  haircut: Scissors,
  glasses: Glasses,
  watch: Watch,
  gem: Gem,
  jewelry: Gem,
  crown: Crown,

  // Naturaleza
  leaf: Leaf,
  plant: Leaf,
  eco: Leaf,
  treepine: TreePine,
  tree: TreePine,
  flower: Flower,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  umbrella: Umbrella,
  weather: Cloud,

  // Mascotas
  cat: Cat,
  dog: Dog,
  bird: Bird,
  rabbit: Rabbit,
  pet: Dog,
  bug: Bug,

  // Herramientas y configuración
  settings: Settings,
  config: Settings,
  wrench: Wrench,
  tools: Wrench,
  hammer: Hammer,
  paintbucket: PaintBucket,
  paint: PaintBucket,
  shield: Shield,
  security: Shield,

  // Documentos y archivos
  filetext: FileText,
  document: FileText,
  file: FileText,
  filespreadsheet: FileSpreadsheet,
  spreadsheet: FileSpreadsheet,
  excel: FileSpreadsheet,
  folderopen: FolderOpen,
  folder: FolderOpen,
  archive: Archive,
  calculator: Calculator,
  calc: Calculator,
  percent: Percent,

  // Ubicación
  mappin: MapPin,
  location: MapPin,
  map: MapPin,
  globe: Globe,
  world: Globe,
  flag: Flag,

  // Tendencias
  trendingup: TrendingUp,
  "trending-up": TrendingUp,
  trendingdown: TrendingDown,
  "trending-down": TrendingDown,
  arrowupright: ArrowUpRight,
  arrowdownright: ArrowDownRight,

  // AI y magia
  sparkles: Sparkles,
  ai: Sparkles,
  magic: Sparkles,
  wand2: Wand2,
  wand: Wand2,
  sparkle: Sparkle,

  // Fallback
  layoutgrid: LayoutGrid,
  grid: LayoutGrid,
  default: LayoutGrid,
}

function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return LayoutGrid

  const normalizedName = iconName.toLowerCase().replace(/[-_\s]/g, "")
  return CATEGORY_ICON_MAP[normalizedName] || CATEGORY_ICON_MAP[iconName.toLowerCase()] || LayoutGrid
}

export default function TreasuryPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("Dashboard")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // State
  const [kpis, setKpis] = useState<TreasuryKPIs | null>(null)
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([])
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([])
  const [transactionsSummary, setTransactionsSummary] = useState<TreasuryTransactionsSummary | null>(null)
  const [categories, setCategories] = useState<TreasuryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [categoryBreakdown, setCategoryBreakdown] = useState<TreasuryCategoryBreakdown[]>([])

  const [categoryTransactions, setCategoryTransactions] = useState<TreasuryTransaction[]>([])
  const [loadingCategoryTx, setLoadingCategoryTx] = useState(false)

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const [poolResumen, setPoolResumen] = useState<PoolBancarioResumen | null>(null)
  const [poolPrestamos, setPoolPrestamos] = useState<PoolBancarioPrestamo[]>([])
  const [poolVencimientos, setPoolVencimientos] = useState<PoolBancarioVencimiento[]>([])
  const [poolPorBanco, setPoolPorBanco] = useState<PoolBancarioPorBanco[]>([])
  const [poolCalendario, setPoolCalendario] = useState<PoolBancarioCalendarioMes[]>([])

  const flattenedCategories = useMemo(() => {
    const result: { id: string; name: string; parentId?: string }[] = []
    categories.forEach((cat) => {
      result.push({ id: cat.id, name: cat.name })
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach((sub) => {
          result.push({ id: sub.id, name: `${cat.name} > ${sub.name}`, parentId: cat.id })
        })
      }
    })
    return result
  }, [categories])

  // Filters
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  })
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const hasActiveFilters =
    accountFilter !== "all" || categoryFilter !== "all" || tipoFilter !== "all" || searchTerm !== ""

  // Load initial data
  const loadData = async () => {
    setLoading(true)
    try {
      const startStr = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
      const endStr = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

      const [kpisData, accountsData, categoriesData, byCategData] = await Promise.all([
        fetchTreasuryKPIs(startStr, endStr),
        fetchTreasuryAccounts(),
        fetchTreasuryCategories(),
        fetchTreasuryByCategory(startStr, endStr),
      ])

      // Pool Bancario - cargar por separado para no bloquear si las vistas no existen
      let poolResumenData = null
      let poolPrestamosData: PoolBancarioPrestamo[] = []
      let poolVencimientosData: PoolBancarioVencimiento[] = []
      let poolPorBancoData: PoolBancarioPorBanco[] = []
      let poolCalendarioData: PoolBancarioCalendarioMes[] = []

      try {
        const poolResults = await Promise.all([
          fetchPoolBancarioResumen(),
          fetchPoolBancarioPrestamos(),
          fetchPoolBancarioVencimientos(10),
          fetchPoolBancarioPorBanco(),
          fetchPoolBancarioCalendario(12),
        ])
        poolResumenData = poolResults[0]
        poolPrestamosData = poolResults[1]
        poolVencimientosData = poolResults[2]
        poolPorBancoData = poolResults[3]
        poolCalendarioData = poolResults[4]
        console.log("[v0] Pool Bancario loaded:", {
          resumen: !!poolResumenData,
          prestamos: poolPrestamosData.length,
          vencimientos: poolVencimientosData.length,
        })
      } catch (poolErr) {
        console.warn("[v0] Pool Bancario views not available yet:", poolErr)
      }

      if (kpisData) setKpis(kpisData)
      setAccounts(accountsData)
      setCategories(categoriesData)
      setCategoryBreakdown(byCategData)
      // Pool Bancario
      setPoolResumen(poolResumenData)
      setPoolPrestamos(poolPrestamosData)
      setPoolVencimientos(poolVencimientosData)
      setPoolPorBanco(poolPorBancoData)
      setPoolCalendario(poolCalendarioData)
    } catch (err) {
      console.error("[v0] Error loading treasury data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateRange])

  useEffect(() => {
    setPage(1)
  }, [dateRange, accountFilter, categoryFilter, tipoFilter, searchTerm])

  // Load KPIs and transactions when filters or page change
  useEffect(() => {
    const loadData = async () => {
      setLoadingTransactions(true)

      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      const offset = (page - 1) * PAGE_SIZE

      const isUncategorized = categoryFilter === "uncategorized"
      const effectiveCategoryId = categoryFilter !== "all" && !isUncategorized ? categoryFilter : undefined
      const effectiveTipo = isUncategorized ? "sin_categorizar" : tipoFilter !== "all" ? tipoFilter : undefined

      console.log("[v0] Loading transactions with params:", {
        startDate,
        endDate,
        accountFilter,
        categoryFilter,
        tipoFilter,
        isUncategorized,
        effectiveCategoryId,
        effectiveTipo,
        searchTerm,
        page,
        offset,
      })

      const [kpisData, transactionsData, summaryData] = await Promise.all([
        fetchTreasuryKPIs(startDate, endDate),
        fetchTreasuryTransactions(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          effectiveCategoryId,
          effectiveTipo,
          searchTerm || undefined,
          PAGE_SIZE,
          offset,
        ),
        fetchTreasuryTransactionsSummary(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          effectiveCategoryId,
          effectiveTipo,
          searchTerm || undefined,
        ),
      ])

      console.log("[v0] Transactions loaded:", {
        transactionsCount: transactionsData?.length || 0,
        summaryCount: summaryData?.num_transacciones || 0,
      })

      setKpis(kpisData)
      setTransactions(transactionsData)
      setTransactionsSummary(summaryData)
      setTotalCount(summaryData?.num_transacciones || 0)
      setLoadingTransactions(false)
    }

    loadData()
  }, [dateRange, accountFilter, categoryFilter, tipoFilter, searchTerm, page])

  const loadCategoryTransactions = async (categoryId: string | null) => {
    setLoadingCategoryTx(true)
    const startDate = format(dateRange.from, "yyyy-MM-dd")
    const endDate = format(dateRange.to, "yyyy-MM-dd")

    const txData = await fetchTreasuryTransactions(
      startDate,
      endDate,
      undefined,
      categoryId || undefined,
      categoryId === null ? "sin_categorizar" : undefined,
      undefined,
      10,
      0,
    )
    setCategoryTransactions(txData)
    setLoadingCategoryTx(false)
  }

  const handleCategoryExpand = (categoryId: string | null) => {
    const key = categoryId || "uncategorized"
    if (expandedCategory === key) {
      setExpandedCategory(null)
      setCategoryTransactions([])
    } else {
      setExpandedCategory(key)
      loadCategoryTransactions(categoryId)
    }
  }

  const handleCategoryUpdate = async (transactionId: string, categoryId: string, subcategoryId?: string) => {
    const success = await updateTransactionCategory(transactionId, categoryId, subcategoryId)

    if (success) {
      toast({
        title: "Categoría actualizada",
        description: "La transacción ha sido categorizada correctamente.",
      })

      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      const offset = (page - 1) * PAGE_SIZE

      const [transactionsData, summaryData, kpisData, categoryBreakdownData] = await Promise.all([
        fetchTreasuryTransactions(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          categoryFilter !== "all" ? categoryFilter : undefined,
          tipoFilter !== "all" ? tipoFilter : undefined,
          searchTerm || undefined,
          PAGE_SIZE,
          offset,
        ),
        fetchTreasuryTransactionsSummary(
          startDate,
          endDate,
          accountFilter !== "all" ? accountFilter : undefined,
          categoryFilter !== "all" ? categoryFilter : undefined,
          tipoFilter !== "all" ? tipoFilter : undefined,
          searchTerm || undefined,
        ),
        fetchTreasuryKPIs(startDate, endDate),
        fetchTreasuryByCategory(startDate, endDate),
      ])
      setTransactions(transactionsData)
      setTransactionsSummary(summaryData)
      setTotalCount(summaryData?.num_transacciones || 0)
      setKpis(kpisData)
      setCategoryBreakdown(categoryBreakdownData)
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setAccountFilter("all")
    setCategoryFilter("all")
    setTipoFilter("all")
    setSearchTerm("")
    setPage(1)
  }

  const handleViewUncategorized = () => {
    console.log("[v0] handleViewUncategorized - Setting filter to sin_categorizar")
    setTipoFilter("sin_categorizar")
    setAccountFilter("all")
    setCategoryFilter("uncategorized") // Changed from "all" to "uncategorized"
    setSearchTerm("")
    setPage(1)
    setActiveTab("Movimientos")
    // Scroll to table after state update
    setTimeout(() => {
      const tableElement = document.getElementById("transactions-table")
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  const ingresosDelta = calculateDelta(kpis?.ingresos_periodo || 0, kpis?.ingresos_anterior || 0)
  const gastosDelta = calculateDelta(kpis?.gastos_periodo || 0, kpis?.gastos_anterior || 0)

  const balanceEvolutionData = useMemo(() => {
    if (transactions.length === 0) return []

    const dailyTotals: Record<string, number> = {}

    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime(),
    )

    sortedTx.forEach((tx) => {
      const date = tx.booking_date
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0
      }
      dailyTotals[date] += tx.amount
    })

    let cumulative = kpis?.saldo_total || 0
    const dates = Object.keys(dailyTotals).sort().reverse()
    const result: { date: string; saldo: number }[] = []

    dates.forEach((date) => {
      result.unshift({ date, saldo: cumulative })
      cumulative -= dailyTotals[date]
    })

    return result.slice(-30)
  }, [transactions, kpis])

  const monthlyData = useMemo(() => {
    if (transactions.length === 0) return []

    const monthlyTotals: Record<string, { ingresos: number; gastos: number }> = {}

    transactions.forEach((tx) => {
      const month = tx.booking_date.substring(0, 7)
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { ingresos: 0, gastos: 0 }
      }
      if (tx.amount > 0) {
        monthlyTotals[month].ingresos += tx.amount
      } else {
        monthlyTotals[month].gastos += Math.abs(tx.amount)
      }
    })

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        monthLabel: format(parseISO(`${month}-01`), "MMM", { locale: es }),
        ...data,
      }))
  }, [transactions])

  const topCategoriesData = useMemo(() => {
    const filtered = categoryBreakdown.filter((cat) => cat.category_id !== null && cat.total_gastos > 0)
    const sorted = filtered
      .sort((a, b) => b.total_gastos - a.total_gastos)
      .slice(0, 10)
      .map((cat) => ({
        name: cat.category_name || "Sin categoría",
        value: cat.total_gastos,
        percentage: cat.porcentaje_gastos || 0,
      }))
    return sorted
  }, [categoryBreakdown])

  const uncategorizedData = useMemo(() => {
    const uncategorized = categoryBreakdown.find((cat) => cat.category_id === null)
    return {
      totalGastos: uncategorized?.total_gastos || 0,
      totalIngresos: uncategorized?.total_ingresos || 0,
      numTransacciones: uncategorized?.num_transacciones || 0,
    }
  }, [categoryBreakdown])

  const topCategoriesWithPercentage = useMemo(() => {
    const total = topCategoriesData.reduce((sum, cat) => sum + cat.value, 0)
    return topCategoriesData.map((cat) => ({
      ...cat,
      percentage: total > 0 ? (cat.value / total) * 100 : 0,
    }))
  }, [topCategoriesData])

  const totalGastosCategories = useMemo(() => {
    return categoryBreakdown.reduce((sum, cat) => sum + cat.total_gastos, 0)
  }, [categoryBreakdown])

  const treasuryMenuItems = [
    {
      icon: TrendingUp, // Changed from Landmark
      label: "Dashboard",
      href: "#",
      gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(23,195,178,0) 70%)", // Changed color
      iconColor: "text-[#17c3b2]", // Changed color
    },
    {
      icon: ArrowDownLeft, // Added
      label: "Movimientos", // Added
      href: "#", // Added
      gradient: "radial-gradient(circle, rgba(34,124,157,0.15) 0%, rgba(34,124,157,0) 70%)", // Added
      iconColor: "text-[#227c9d]", // Added
    },
    {
      icon: Wallet, // Changed from CreditCard
      label: "Por Categoría", // Changed from Por Cuenta
      href: "#",
      gradient: "radial-gradient(circle, rgba(54,79,107,0.15) 0%, rgba(54,79,107,0) 70%)", // Changed color
      iconColor: "text-[#364f6b]", // Changed color
    },
    {
      icon: Landmark, // Added
      label: "Pool Bancario", // Added
      href: "#", // Added
      gradient: "radial-gradient(circle, rgba(254,200,105,0.15) 0%, rgba(254,200,105,0) 70%)", // Added
      iconColor: "text-[#fec869]", // Added
    },
  ]

  const [currentPage, setCurrentPage] = useState(1) // Added for transactions table pagination

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader icon={Landmark} title="Tesorería" subtitle="Control de cuentas bancarias y movimientos" />

      {/* Date Range Picker */}
      <div className="flex justify-end">
        <DateRangePickerExpenses
          from={dateRange.from}
          to={dateRange.to}
          onChange={(range) => {
            if (range.from && range.to) {
              setDateRange({ from: range.from, to: range.to })
            }
          }}
        />
      </div>

      <div className="flex justify-center mb-6">
        <MenuBar items={treasuryMenuItems} activeItem={activeTab} onItemClick={(label) => setActiveTab(label)} />
      </div>

      {/* TAB 1: Dashboard */}
      {activeTab === "Dashboard" && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Saldo Total */}
            <TremorCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Saldo Total</p>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {loading ? "..." : formatCurrency(kpis?.saldo_total || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {accounts?.length || 0} cuenta{(accounts?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
                  <Landmark className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
                </div>
              </div>
            </TremorCard>

            {/* Ingresos */}
            <TremorCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ingresos</p>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {loading ? "..." : formatCurrency(kpis?.ingresos_periodo || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {ingresosDelta >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" style={{ color: "#17c3b2" }} />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" style={{ color: "#fe6d73" }} />
                    )}
                    <span className="text-xs" style={{ color: ingresosDelta >= 0 ? "#17c3b2" : "#fe6d73" }}>
                      {ingresosDelta >= 0 ? "+" : ""}
                      {ingresosDelta.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400">vs periodo anterior</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#17c3b215" }}>
                  <TrendingUp className="h-5 w-5" style={{ color: "#17c3b2" }} />
                </div>
              </div>
            </TremorCard>

            {/* Gastos */}
            <TremorCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Gastos</p>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {loading ? "..." : formatCurrency(kpis?.gastos_periodo || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {gastosDelta <= 0 ? (
                      <ArrowDownRight className="h-3 w-3" style={{ color: "#17c3b2" }} />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" style={{ color: "#fe6d73" }} />
                    )}
                    <span className="text-xs" style={{ color: gastosDelta <= 0 ? "#17c3b2" : "#fe6d73" }}>
                      {gastosDelta >= 0 ? "+" : ""}
                      {gastosDelta.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400">vs periodo anterior</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.error}15` }}>
                  <TrendingDown className="h-5 w-5" style={{ color: BRAND_COLORS.error }} />
                </div>
              </div>
            </TremorCard>

            {/* Balance */}
            <TremorCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Balance Período</p>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {loading ? "..." : formatCurrency(kpis?.ingresos_periodo - kpis?.gastos_periodo || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-slate-400">vs periodo anterior</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
                  <TrendingUp className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
                </div>
              </div>
            </TremorCard>

            {/* Sin Categorizar - Fixed button functionality */}
          </div>

          {/* Cuentas Bancarias */}
          <TremorCard title="Cuentas Bancarias" icon={<Building2 className="h-5 w-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {loading ? (
                <p className="text-slate-400 col-span-full text-center py-8">Cargando cuentas...</p>
              ) : (accounts?.length || 0) === 0 ? (
                <p className="text-slate-400 col-span-full text-center py-8">No hay cuentas configuradas</p>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {account.bank_logo ? (
                          <img
                            src={account.bank_logo || "/placeholder.svg"}
                            alt={account.bank_name}
                            className="h-8 w-8 object-contain rounded"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-slate-400" />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{account.bank_name}</p>
                          <p className="text-xs text-slate-500">{formatIBAN(account.iban)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-slate-800">{formatCurrency(account.balance)}</p>
                      {account.last_sync && (
                        <p className="text-xs text-slate-400 mt-1">
                          Sync: {format(new Date(account.last_sync), "dd MMM HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TremorCard>

          {/* Banner sin categorizar - Fixed button */}
          {(kpis?.transacciones_sin_categorizar || uncategorizedData.numTransacciones) > 0 && (
            <TremorCard className="border-l-[6px] bg-white" style={{ borderLeftColor: "#ffcb77" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icono con fondo amarillo suave */}
                  <div className="p-3 rounded-full bg-[#ffcb77]/20">
                    <AlertCircle className="h-6 w-6 text-[#ffcb77]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#364f6b]">
                      {(kpis?.transacciones_sin_categorizar || uncategorizedData.numTransacciones).toLocaleString(
                        "es-ES",
                      )}{" "}
                      transacciones pendientes de categorizar
                    </h3>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(uncategorizedData.totalGastos)} en gastos ·{" "}
                      {formatCurrency(uncategorizedData.totalIngresos)} en ingresos
                    </p>
                  </div>
                </div>
                {/* Boton con color amarillo */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent hover:bg-[#ffcb77]/10 border-[#ffcb77] text-[#ffcb77]"
                  onClick={handleViewUncategorized}
                >
                  Ver pendientes
                </Button>
              </div>
            </TremorCard>
          )}

          {/* Graficos */}
          {/* Evolución del Saldo */}
          <TremorCard>
            <TremorTitle>Evolución del Saldo</TremorTitle>
            <div className="h-[300px] mt-4">
              {balanceEvolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => format(parseISO(v), "dd MMM", { locale: es })}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tickFormatter={formatCurrencyCompact}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      width={60}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null
                        return (
                          <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                            <p className="text-sm font-bold text-slate-700 mb-2">
                              {format(parseISO(label), "EEEE, d MMM yyyy", { locale: es })}
                            </p>
                            <p className="text-sm">
                              Saldo:{" "}
                              <span className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                                {formatCurrency(payload[0]?.value as number)}
                              </span>
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke={BRAND_COLORS.primary}
                      strokeWidth={3}
                      dot={{ fill: BRAND_COLORS.primary, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No hay datos suficientes para mostrar el gráfico
                </div>
              )}
            </div>
          </TremorCard>

          {/* Ingresos vs Gastos + Top Categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingresos vs Gastos por Mes */}
            <TremorCard>
              <TremorTitle>Ingresos vs Gastos por Mes</TremorTitle>
              <div className="h-[300px] mt-4">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        tickFormatter={formatCurrencyCompact}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        width={60}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null
                          return (
                            <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                              <p className="text-sm font-bold text-slate-700 mb-2 capitalize">{label}</p>
                              {payload.map((entry: any, index: number) => (
                                <p key={index} className="text-sm">
                                  <span
                                    className="inline-block w-3 h-3 rounded mr-2"
                                    style={{ backgroundColor: entry.color || BRAND_COLORS.primary }}
                                  />
                                  {entry.name}: <span className="font-bold">{formatCurrency(entry.value)}</span>
                                </p>
                              ))}
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="ingresos" name="Ingresos" fill={BRAND_COLORS.success} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" name="Gastos" fill={BRAND_COLORS.error} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </TremorCard>

            {/* Top Categorías de Gasto */}
            <TremorCard>
              <TremorTitle>Top Categorías de Gasto</TremorTitle>
              <div className="h-[300px] mt-4">
                {topCategoriesWithPercentage.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCategoriesWithPercentage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tickFormatter={formatCurrencyCompact}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        width={120}
                        tickFormatter={(v) => (v.length > 15 ? `${v.substring(0, 15)}...` : v)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                              <p className="text-sm font-bold text-slate-700 mb-1">{data.name}</p>
                              <p className="text-sm">
                                Total: <span className="font-bold">{formatCurrency(data.value)}</span>
                              </p>
                              <p className="text-xs text-slate-500">{data.percentage.toFixed(1)}% del total</p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="value" fill={BRAND_COLORS.primary} radius={[0, 4, 4, 0]}>
                        {topCategoriesWithPercentage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BRAND_COLORS.primary} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </TremorCard>
          </div>
        </div>
      )}

      {activeTab === "Movimientos" && (
        <div className="space-y-6">
          <TremorCard>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <TremorTitle>Movimientos</TremorTitle>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Busqueda */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 w-[180px]"
                  />
                </div>

                {/* Cuenta */}
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="h-9 w-[150px]">
                    <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las cuentas</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} {formatIBAN(account.iban)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Categoria */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 w-[150px]">
                    <Filter className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {/* <SelectItem value="uncategorized">Sin categorizar</SelectItem> // Removed this, handled by tipoFilter */}
                    {flattenedCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Tipo */}
                <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
                  <SelectTrigger className="h-9 w-[150px]">
                    <ChevronDown className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Limpiar filtros */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Resumen filtrado */}
            {transactionsSummary && (
              <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Transacciones:</span>
                  <span className="font-medium">{transactionsSummary.num_transacciones}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Ingresos:</span>
                  <span className="font-medium" style={{ color: "#17c3b2" }}>
                    {formatCurrency(transactionsSummary.total_ingresos)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Gastos:</span>
                  <span className="font-medium" style={{ color: "#fe6d73" }}>
                    {formatCurrency(transactionsSummary.total_gastos)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Balance:</span>
                  <span
                    className="font-medium"
                    style={{
                      color:
                        transactionsSummary.total_ingresos - transactionsSummary.total_gastos >= 0
                          ? "#17c3b2"
                          : "#fe6d73",
                    }}
                  >
                    {formatCurrency(transactionsSummary.total_ingresos - transactionsSummary.total_gastos)}
                  </span>
                </div>
              </div>
            )}

            {/* Tabla */}
            <div id="transactions-table" className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-500">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-500">Cuenta</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-500">Descripción</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-500">Categoría</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-500">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        Cargando movimientos...
                      </td>
                    </tr>
                  ) : (transactions?.length || 0) === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        No hay movimientos en el periodo seleccionado
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <span className="text-slate-600">
                            {format(new Date(tx.booking_date), "dd MMM yyyy", { locale: es })}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {tx.bank_logo ? (
                              <img
                                src={tx.bank_logo || "/placeholder.svg"}
                                alt={tx.bank_name}
                                className="h-6 w-6 object-contain rounded"
                              />
                            ) : (
                              <Building2 className="h-6 w-6 text-slate-400" />
                            )}
                            <span className="text-sm">{tx.account_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 max-w-[300px]">
                          {(() => {
                            const desc = getTransactionDescription(tx)
                            return (
                              <div>
                                <p className="truncate text-[#364f6b]">{desc.main}</p>
                                {desc.secondary && <p className="text-xs text-slate-400 truncate">{desc.secondary}</p>}
                              </div>
                            )
                          })()}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={tx.subcategory_id || tx.category_id || undefined}
                              onValueChange={(value) => {
                                const cat = flattenedCategories.find((c) => c.id === value)
                                if (cat) {
                                  handleCategoryUpdate(tx.id, cat.parentId || cat.id, cat.parentId ? cat.id : undefined)
                                }
                              }}
                            >
                              <SelectTrigger
                                className="h-7 w-[150px] text-xs"
                                style={
                                  !tx.category_name
                                    ? { borderColor: BRAND_COLORS.warning, color: BRAND_COLORS.warning }
                                    : tx.categorization_method === "rule"
                                      ? { borderColor: "#02b1c4" }
                                      : tx.categorization_method === "ai"
                                        ? { borderColor: "#ffcb77" }
                                        : { borderColor: "#e2e8f0" }
                                }
                              >
                                <SelectValue placeholder="Categorizar">
                                  {tx.category_name ? (
                                    <span className="truncate">
                                      {tx.category_name}
                                      {tx.subcategory_name && ` / ${tx.subcategory_name}`}
                                    </span>
                                  ) : null}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {flattenedCategories.length > 0 ? (
                                  flattenedCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                      {cat.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled className="text-xs text-slate-400">
                                    No hay categorías
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {/* Indicador visual del método de categorización */}
                            {tx.category_name && tx.categorization_method && (
                              <span title={`Categorizada: ${tx.categorization_method}`}>
                                {tx.categorization_method === "rule" && (
                                  <Wand2 className="h-3.5 w-3.5 text-[#02b1c4]" />
                                )}
                                {tx.categorization_method === "ai" && (
                                  <Sparkles className="h-3.5 w-3.5 text-[#ffcb77]" />
                                )}
                                {tx.categorization_method === "manual" && (
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                )}
                                {tx.categorization_method === "imported" && (
                                  <Download className="h-3.5 w-3.5 text-slate-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span style={{ color: tx.amount >= 0 ? "#17c3b2" : "#fe6d73" }}>
                            {tx.amount >= 0 ? "+" : ""}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-slate-600 px-2">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </TremorCard>
        </div>
      )}

      {activeTab === "Por Categoría" && (
        <div className="space-y-6">
          {loading ? (
            <p className="text-slate-400 text-center py-8">Cargando categorías...</p>
          ) : categoryBreakdown.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay datos por categoría</p>
          ) : (
            <>
              {/* Resumen de totales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TremorCard className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowUpCircle className="h-5 w-5 text-[#17c3b2]" />
                    <span className="text-sm text-slate-500">Total Ingresos</span>
                  </div>
                  <p className="text-2xl font-bold text-[#17c3b2]">
                    {formatCurrency(categoryBreakdown.reduce((sum, cat) => sum + (cat.total_ingresos || 0), 0))}
                  </p>
                </TremorCard>
                <TremorCard className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowDownCircle className="h-5 w-5 text-[#fe6d73]" />
                    <span className="text-sm text-slate-500">Total Gastos</span>
                  </div>
                  <p className="text-2xl font-bold text-[#fe6d73]">
                    {formatCurrency(categoryBreakdown.reduce((sum, cat) => sum + (cat.total_gastos || 0), 0))}
                  </p>
                </TremorCard>
                <TremorCard className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <LayoutGrid className="h-5 w-5 text-[#02b1c4]" />
                    <span className="text-sm text-slate-500">Categorías</span>
                  </div>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {categoryBreakdown.filter((cat) => cat.category_id !== null).length}
                  </p>
                </TremorCard>
              </div>

              {/* Grid de categorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryBreakdown
                  .filter((cat) => cat.category_id !== null)
                  .sort((a, b) => b.total_gastos + b.total_ingresos - (a.total_gastos + a.total_ingresos))
                  .map((cat) => {
                    const IconComponent = getCategoryIcon(cat.category_icon)

                    return (
                      <TremorCard
                        key={cat.category_id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          // Cambiar a tab movimientos y filtrar por categoría
                          setActiveTab("Movimientos")
                          setCategoryFilter(cat.category_id || "all")
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${cat.category_color || "#94a3b8"}20` }}
                            >
                              <IconComponent className="h-5 w-5" style={{ color: cat.category_color || "#94a3b8" }} />
                            </div>
                            <div>
                              <p className="font-medium text-[#364f6b]">{cat.category_name || "Sin nombre"}</p>
                              <p className="text-xs text-slate-400">{cat.num_transacciones} transacciones</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {cat.total_ingresos > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Ingresos</span>
                              <span className="text-sm font-medium text-[#17c3b2]">
                                +{formatCurrency(cat.total_ingresos)}
                              </span>
                            </div>
                          )}
                          {cat.total_gastos > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Gastos</span>
                              <span className="text-sm font-medium text-[#fe6d73]">
                                -{formatCurrency(cat.total_gastos)}
                              </span>
                            </div>
                          )}
                          {cat.porcentaje_gastos > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">% del gasto total</span>
                                <span className="font-medium text-slate-600">{cat.porcentaje_gastos.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(cat.porcentaje_gastos, 100)}%`,
                                    backgroundColor: cat.category_color || "#94a3b8",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </TremorCard>
                    )
                  })}
              </div>

              {/* Sin categorizar */}
              {categoryBreakdown.find((cat) => cat.category_id === null) && (
                <TremorCard className="p-4 border-l-4" style={{ borderLeftColor: BRAND_COLORS.warning }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5" style={{ color: BRAND_COLORS.warning }} />
                      <div>
                        <p className="font-medium text-[#364f6b]">Sin Categorizar</p>
                        <p className="text-sm text-slate-500">
                          {categoryBreakdown.find((cat) => cat.category_id === null)?.num_transacciones || 0}{" "}
                          transacciones pendientes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        Gastos:{" "}
                        <span className="font-medium text-[#fe6d73]">
                          {formatCurrency(categoryBreakdown.find((cat) => cat.category_id === null)?.total_gastos || 0)}
                        </span>
                      </p>
                      <p className="text-sm text-slate-500">
                        Ingresos:{" "}
                        <span className="font-medium text-[#17c3b2]">
                          {formatCurrency(
                            categoryBreakdown.find((cat) => cat.category_id === null)?.total_ingresos || 0,
                          )}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTab("Movimientos")
                        setCategoryFilter("uncategorized") // Changed from "all" to "uncategorized"
                      }}
                      style={{ borderColor: BRAND_COLORS.warning, color: BRAND_COLORS.warning }}
                    >
                      Ver pendientes
                    </Button>
                  </div>
                </TremorCard>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "Pool Bancario" && (
        <div className="space-y-6">
          {loading ? (
            <p className="text-slate-400 text-center py-8">Cargando pool bancario...</p>
          ) : !poolResumen ? (
            <p className="text-slate-400 text-center py-8">No hay datos de préstamos</p>
          ) : (
            <>
              {/* KPIs del Pool */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <TremorCard className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Landmark className="h-5 w-5 text-[#02b1c4]" />
                    <span className="text-sm text-slate-500">Saldo Pendiente</span>
                  </div>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {formatCurrency(poolResumen.saldo_pendiente_total || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {poolResumen.total_prestamos_activos || 0} préstamos activos
                  </p>
                </TremorCard>

                <TremorCard className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-[#02b1c4]" />
                    <span className="text-sm text-slate-500">Cuota Mensual</span>
                  </div>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {formatCurrency(poolResumen.cuota_mensual_total || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Próximos pagos</p>
                </TremorCard>

                <TremorCard className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Percent className="h-5 w-5 text-[#02b1c4]" />
                    <span className="text-sm text-slate-500">Amortizado</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-[#17c3b2]">
                      {(poolResumen.porcentaje_amortizado || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full bg-[#17c3b2]"
                      style={{ width: `${poolResumen.porcentaje_amortizado || 0}%` }}
                    />
                  </div>
                </TremorCard>

                <TremorCard className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-5 w-5 text-[#02b1c4]" />
                    <span className="text-sm text-slate-500">Total Amortizado</span>
                  </div>
                  <p className="text-2xl font-bold text-[#364f6b]">
                    {formatCurrency(poolResumen.capital_total_amortizado || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Capital devuelto</p>
                </TremorCard>
              </div>

              {/* Próximos Vencimientos + Distribución por Banco */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Próximos Vencimientos */}
                <TremorCard className="lg:col-span-2 p-4">
                  <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Próximos Vencimientos (30 días)</h3>
                  <div className="space-y-3">
                    {poolVencimientos.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No hay vencimientos próximos</p>
                    ) : (
                      poolVencimientos.slice(0, 6).map((v, idx) => (
                        <div
                          key={`${v.nombre_prestamo}-${v.fecha_vencimiento}-${idx}`}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            v.estado_vencimiento === "vencido"
                              ? "bg-red-50 border border-red-200"
                              : v.estado_vencimiento === "hoy"
                                ? "bg-orange-50 border border-orange-200"
                                : v.estado_vencimiento === "proximo"
                                  ? "bg-yellow-50 border border-yellow-200"
                                  : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {v.banco_logo ? (
                              <img
                                src={v.banco_logo || "/placeholder.svg"}
                                alt={v.banco}
                                className="h-8 w-8 object-contain rounded"
                              />
                            ) : (
                              <Landmark className="h-8 w-8 text-slate-400" />
                            )}
                            <div>
                              <p className="font-medium text-[#364f6b]">{v.nombre_prestamo}</p>
                              <p className="text-sm text-slate-500">{v.banco}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[#364f6b]">{formatCurrency(v.importe_cuota)}</p>
                            <p
                              className={`text-xs ${
                                v.estado_vencimiento === "vencido"
                                  ? "text-[#fe6d73] font-medium"
                                  : v.estado_vencimiento === "hoy"
                                    ? "text-orange-600 font-medium"
                                    : "text-slate-400"
                              }`}
                            >
                              {v.estado_vencimiento === "vencido"
                                ? `Vencido (${Math.abs(v.dias_hasta_vencimiento)} días)`
                                : v.estado_vencimiento === "hoy"
                                  ? "Hoy"
                                  : format(new Date(v.fecha_vencimiento), "dd MMM yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TremorCard>

                {/* Distribución por Banco */}
                <TremorCard className="p-4">
                  <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Por Banco</h3>
                  {poolPorBanco.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Sin datos</p>
                  ) : (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={poolPorBanco}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="saldo_pendiente"
                            nameKey="banco"
                          >
                            {poolPorBanco.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBankColor(entry.banco, index)} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null
                              const data = payload[0].payload as PoolBancarioPorBanco
                              return (
                                <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                                  <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                                    {data.banco}
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: getBankColor(data.banco) }}
                                      />
                                      <span className="text-slate-500 font-medium w-24">Saldo pendiente:</span>
                                      <span className="font-bold text-slate-700">
                                        {formatCurrency(data.saldo_pendiente)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: getBankColor(data.banco) }}
                                      />
                                      <span className="text-slate-500 font-medium w-24">Cuota mensual:</span>
                                      <span className="font-bold text-slate-700">
                                        {formatCurrency(data.cuota_mensual)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: getBankColor(data.banco) }}
                                      />
                                      <span className="text-slate-500 font-medium w-24">% del total:</span>
                                      <span className="font-bold text-slate-700">
                                        {(data.porcentaje_del_total || 0).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="mt-4 space-y-2">
                    {poolPorBanco.map((banco, idx) => (
                      <div key={banco.banco} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {banco.banco_logo ? (
                            <img
                              src={banco.banco_logo || "/placeholder.svg"}
                              alt={banco.banco}
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getBankColor(banco.banco, idx) }}
                            />
                          )}
                          <span className="text-slate-600">{banco.banco}</span>
                        </div>
                        <span className="font-medium text-[#364f6b]">
                          {(banco.porcentaje_del_total || 0).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </TremorCard>
              </div>

              {/* Evolución Mensual */}
              <TremorCard className="p-4">
                <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Evolución Cuotas Mensuales</h3>
                {poolCalendario.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Sin datos de calendario</p>
                ) : (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={poolCalendario} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="mes"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as PoolBancarioCalendarioMes
                                return (
                                  <ChartTooltip
                                    title={data.mes}
                                    items={[
                                      {
                                        label: "Capital",
                                        value: formatCurrency(data.total_capital || 0),
                                        color: "#fe6d73",
                                      },
                                      {
                                        label: "Intereses",
                                        value: formatCurrency(data.total_intereses || 0),
                                        color: "#ffcb77",
                                      },
                                      { label: "Total", value: formatCurrency(data.total_cuotas || 0) },
                                    ]}
                                  />
                                )
                              }
                              return null
                            }}
                          />
                          <Bar
                            dataKey="total_capital"
                            stackId="a"
                            fill="#fe6d73"
                            radius={[0, 0, 0, 0]}
                            name="Capital"
                          />
                          <Bar
                            dataKey="total_intereses"
                            stackId="a"
                            fill="#ffcb77"
                            radius={[4, 4, 0, 0]}
                            name="Intereses"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: "#fe6d73" }} />
                        <span className="text-sm text-slate-600">Capital</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ffcb77" }} />
                        <span className="text-sm text-slate-600">Intereses</span>
                      </div>
                    </div>
                  </>
                )}
              </TremorCard>

              {/* Cards de Préstamos */}
              <div>
                <h3 className="text-lg font-semibold text-[#364f6b] mb-4">Detalle de Préstamos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {poolPrestamos.map((prestamo, idx) => (
                    <TremorCard key={prestamo.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {prestamo.banco_logo ? (
                            <img
                              src={prestamo.banco_logo || "/placeholder.svg"}
                              alt={prestamo.banco}
                              className="h-10 w-10 object-contain rounded"
                            />
                          ) : (
                            <Landmark className="h-10 w-10 text-slate-400" />
                          )}
                          <div>
                            <p className="font-semibold text-[#364f6b]">{prestamo.nombre_prestamo}</p>
                            <p className="text-sm text-slate-500">{prestamo.banco}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            prestamo.estado === "activo"
                              ? "bg-[#17c3b2]/10 text-[#17c3b2]"
                              : prestamo.estado === "liquidado"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-[#fe6d73]/10 text-[#fe6d73]"
                          }`}
                        >
                          {prestamo.estado}
                        </span>
                      </div>

                      {/* Barra de progreso amortizacion */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Amortizado</span>
                          <span>{Number(prestamo.porcentaje_amortizado || 0).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-[#17c3b2]"
                            style={{
                              width: `${prestamo.porcentaje_amortizado || 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Importe pendiente</p>
                          <p className="font-semibold text-[#364f6b]">
                            {formatCurrency(prestamo.saldo_pendiente || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cuota mensual</p>
                          <p className="font-semibold text-[#364f6b]">{formatCurrency(prestamo.cuota_mensual || 0)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Tipo interés</p>
                          <p className="font-medium text-[#364f6b]">{Number(prestamo.tasa_interes || 0).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cuotas pendientes</p>
                          <p className="font-medium text-[#364f6b]">{prestamo.cuotas_pendientes || 0}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-500">Capital concedido</p>
                          <p className="font-medium text-[#364f6b]">{formatCurrency(prestamo.capital_inicial || 0)}</p>
                        </div>
                      </div>

                      {prestamo.proxima_cuota_fecha && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-500">Próxima cuota</span>
                          <span className="text-sm font-medium text-[#364f6b]">
                            {format(new Date(prestamo.proxima_cuota_fecha), "dd MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      )}
                    </TremorCard>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Previously TAB 3: Por Cuenta - This section is now replaced by Pool Bancario */}
      {activeTab === "Por Cuenta" && (
        <div className="space-y-6">
          {loading ? (
            <p className="text-slate-400 text-center py-8">Cargando cuentas...</p>
          ) : (accounts?.length || 0) === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay cuentas configuradas</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {accounts.map((account) => (
                <TremorCard key={account.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {account.bank_logo ? (
                        <img
                          src={account.bank_logo || "/placeholder.svg"}
                          alt={account.bank_name}
                          className="h-12 w-12 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{account.bank_name}</p>
                        <p className="text-sm text-slate-500">{account.account_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{account.iban}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">{formatCurrency(account.balance)}</p>
                      {account.last_sync && (
                        <p className="text-xs text-slate-400 mt-1">
                          Última sync: {format(new Date(account.last_sync), "dd MMM HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setAccountFilter(account.id)
                        setActiveTab("Movimientos") // Changed from "Dashboard" to "Movimientos"
                      }}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Ver movimientos
                    </Button>
                  </div>
                </TremorCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
