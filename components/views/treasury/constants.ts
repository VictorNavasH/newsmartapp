import {
  type LucideIcon,
  Wallet,
  CreditCard,
  Landmark,
  Building2,
  Receipt,
  PiggyBank,
  Banknote,
  Coins,
  CircleDollarSign,
  HandCoins,
  BadgeDollarSign,
  ShoppingCart,
  ShoppingBag,
  Store,
  Package,
  Box,
  Utensils,
  Coffee,
  Wine,
  Beer,
  Pizza,
  Apple,
  Salad,
  Fish,
  Beef,
  Egg,
  Milk,
  Carrot,
  Banana,
  IceCream,
  Cake,
  Cookie,
  Croissant,
  Candy,
  Soup,
  Car,
  Truck,
  Bus,
  Train,
  Bike,
  Plane,
  Footprints,
  Home,
  Building,
  Warehouse,
  Factory,
  Key,
  Lock,
  Zap,
  Wifi,
  Phone,
  Droplet,
  Flame,
  Snowflake,
  Heart,
  Stethoscope,
  Pill,
  GraduationCap,
  BookOpen,
  Briefcase,
  HardHat,
  Users,
  User,
  Baby,
  Gift,
  Music,
  Gamepad2,
  Tv,
  PartyPopper,
  Dumbbell,
  Trophy,
  Award,
  Star,
  Target,
  Shirt,
  Scissors,
  Glasses,
  Watch,
  Gem,
  Crown,
  Leaf,
  TreePine,
  Flower,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Cat,
  Dog,
  Bird,
  Rabbit,
  Bug,
  Settings,
  Wrench,
  Hammer,
  PaintBucket,
  Shield,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  Archive,
  Calculator,
  Percent,
  MapPin,
  Globe,
  Flag,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wand2,
  Sparkle,
  LayoutGrid,
} from "lucide-react"
import type { TreasuryTransaction } from "@/types"

export const PAGE_SIZE = 50

export type TipoFilter = "all" | "ingreso" | "gasto" | "sin_categorizar"

export const TIPO_LABELS: Record<TipoFilter, string> = {
  all: "Todos",
  ingreso: "Ingresos",
  gasto: "Gastos",
  sin_categorizar: "Sin categorizar",
}

export const BANK_INFO: Record<string, { color: string }> = {
  CaixaBank: { color: "#32CBFF" },
  BBVA: { color: "#004481" },
  Santander: { color: "#EC0000" },
  Sabadell: { color: "#00A6DE" },
}

export const getBankInfo = (banco: string) => {
  const normalizedName = Object.keys(BANK_INFO).find((key) => banco.toLowerCase().includes(key.toLowerCase()))
  return normalizedName ? BANK_INFO[normalizedName] : { color: "#64748b" }
}

export const getBankLogo = (banco: string): string | null => {
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

export const getBankColor = (banco: string, fallbackIndex = 0): string => {
  const bankInfo = getBankInfo(banco)
  if (bankInfo.color) return bankInfo.color
  const fallbackColors = ["#227c9d", "#17c3b2", "#ffcb77", "#fe6d73"]
  return fallbackColors[fallbackIndex % fallbackColors.length]
}

export const formatIBAN = (iban: string): string => {
  if (!iban) return ""
  return `****${iban.slice(-4)}`
}

export const getTransactionDescription = (tx: TreasuryTransaction): { main: string; secondary: string | null } => {
  let main = ""
  let secondary: string | null = null

  if (tx.description && tx.description.trim() !== "") {
    main = tx.description
    if (tx.counterparty_name && tx.counterparty_name.trim() !== "") {
      secondary = tx.counterparty_name
    }
  } else if (tx.counterparty_name && tx.counterparty_name.trim() !== "") {
    main = tx.counterparty_name
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

export const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
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

export function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return LayoutGrid

  const normalizedName = iconName.toLowerCase().replace(/[-_\s]/g, "")
  return CATEGORY_ICON_MAP[normalizedName] || CATEGORY_ICON_MAP[iconName.toLowerCase()] || LayoutGrid
}
