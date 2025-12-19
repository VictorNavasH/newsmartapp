"use client"

import {
  Folder,
  Home,
  Utensils,
  ShoppingCart,
  Car,
  Zap,
  Wifi,
  Phone,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  Receipt,
  FileText,
  Building,
  Building2,
  Briefcase,
  Users,
  User,
  Heart,
  Shield,
  Lock,
  Key,
  Settings,
  Wrench,
  Hammer,
  Package,
  Box,
  Gift,
  ShoppingBag,
  Tag,
  Percent,
  DollarSign,
  Euro,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Activity,
  Target,
  Award,
  Star,
  Coffee,
  Beer,
  Wine,
  UtensilsCrossed,
  ChefHat,
  Truck,
  Plane,
  Train,
  Bus,
  Fuel,
  Droplet,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Thermometer,
  Wind,
  Leaf,
  TreePine,
  Flower,
  Apple,
  Carrot,
  Beef,
  Fish,
  Egg,
  Milk,
  IceCream,
  Cake,
  Cookie,
  Pizza,
  Sandwich,
  Salad,
  Soup,
  Popcorn,
  Candy,
  Cigarette,
  Pill,
  Stethoscope,
  Syringe,
  Ambulance,
  Hospital,
  Scissors,
  Paintbrush,
  Palette,
  Camera,
  Video,
  Tv,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Music,
  Radio,
  Gamepad,
  Dumbbell,
  Bike,
  Trophy,
  Medal,
  Ticket,
  Calendar,
  Clock,
  Album as Alarm,
  Bell,
  Mail,
  MessageSquare,
  Send,
  Inbox,
  Archive,
  Database,
  Server,
  Printer,
  Clipboard,
  Edit,
  Pencil,
  BookOpen,
  Book,
  Library,
  GraduationCap,
  School,
  Backpack,
  PenTool,
  Ruler,
  Compass,
  Calculator,
  Code,
  Terminal,
  Globe,
  Map,
  MapPin,
  Navigation,
  Flag,
  Bookmark,
  Link,
  Paperclip,
  Pin,
  Lightbulb,
  Power,
  Battery,
  Plug,
  Cable,
  Landmark,
  ArrowDownCircle,
  ArrowLeftRight,
  HelpCircle,
  Megaphone,
  type LucideIcon,
} from "lucide-react"

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  // Folders & Files
  Folder,
  FileText,
  Receipt,
  Clipboard,
  Archive,

  // Buildings & Places
  Home,
  Building,
  Building2,
  Hospital,
  School,
  Library,
  Landmark,
  Bank: Landmark,

  // Finance
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  DollarSign,
  Euro,
  Percent,
  CurrencyDollar: DollarSign,
  ArrowDownCircle,

  // Food & Drinks
  Utensils,
  UtensilsCrossed,
  ChefHat,
  Coffee,
  Beer,
  Wine,
  Pizza,
  Sandwich,
  Salad,
  Soup,
  Cake,
  Cookie,
  IceCream,
  Candy,
  Popcorn,
  Apple,
  Carrot,
  Beef,
  Fish,
  Egg,
  Milk,

  // Shopping
  ShoppingCart,
  ShoppingBag,
  Package,
  Box,
  Gift,
  Tag,

  // Transport
  Car,
  Truck,
  Plane,
  Train,
  Bus,
  Bike,
  Fuel,

  // Utilities
  Zap,
  Lightning: Zap,
  Wifi,
  Phone,
  Droplet,
  Flame,
  Snowflake,
  Plug,
  Power,
  Battery,
  Cable,
  Lightbulb,

  // Business
  Briefcase,
  Users,
  People: Users,
  User,
  Target,
  Award,
  Trophy,
  Medal,
  Star,
  Megaphone,

  // Health
  Heart,
  Pill,
  Stethoscope,
  Syringe,
  Ambulance,

  // Security
  Shield,
  Lock,
  Key,

  // Tools & Settings
  Settings,
  Wrench,
  Hammer,
  Scissors,

  // Creative
  Paintbrush,
  Palette,
  Camera,
  Video,
  PenTool,
  Pencil,
  Edit,

  // Tech
  Tv,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Printer,

  // Entertainment
  Music,
  Radio,
  Gamepad,
  Ticket,
  Dumbbell,

  // Time
  Calendar,
  Clock,
  Alarm,

  // Communication
  Bell,
  Mail,
  MessageSquare,
  Send,
  Inbox,

  // Charts
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Activity,

  // Nature
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Thermometer,
  Wind,
  Leaf,
  TreePine,
  Flower,

  // Education
  BookOpen,
  Book,
  GraduationCap,
  Backpack,
  Ruler,
  Compass,
  Calculator,

  // Tech/Dev
  Code,
  Terminal,
  Database,
  Server,
  Globe,

  // Navigation
  Map,
  MapPin,
  Navigation,
  Flag,
  Bookmark,
  Link,
  Paperclip,
  Pin,
  ArrowLeftRight,

  // Help
  HelpCircle,

  // Other
  Cigarette,
  DocumentText: FileText,
}

interface DynamicIconProps {
  name: string | null | undefined
  className?: string
  size?: number
  fallback?: string
}

export function DynamicIcon({ name, className = "", size = 20, fallback }: DynamicIconProps) {
  // Get the icon component from the map
  const IconComponent = name ? iconMap[name] : null

  if (IconComponent) {
    return <IconComponent className={className} size={size} />
  }

  // Fallback to first letter if no icon found
  if (fallback) {
    return (
      <span className={`font-bold ${className}`} style={{ fontSize: size * 0.6 }}>
        {fallback.charAt(0).toUpperCase()}
      </span>
    )
  }

  // Default folder icon
  return <Folder className={className} size={size} />
}

export { iconMap }
