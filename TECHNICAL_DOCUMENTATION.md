# NUA Smart App - Documentacion Tecnica

## Indice

1. [Vision General](#1-vision-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Modulos Funcionales](#5-modulos-funcionales)
6. [Modelo de Datos](#6-modelo-de-datos)
7. [Integracion con Backend](#7-integracion-con-backend)
8. [Sistema de Diseno](#8-sistema-de-diseno)
9. [Guia de Desarrollo](#9-guia-de-desarrollo)
10. [Configuracion y Despliegue](#10-configuracion-y-despliegue)

---

## 1. Vision General

### 1.1 Descripcion del Proyecto

**NUA Smart App** es una aplicacion web de gestion empresarial diseñada especificamente para el sector de la restauracion. Proporciona un dashboard inteligente que centraliza y visualiza datos operativos, financieros y de negocio en tiempo real.

### 1.2 Objetivos Principales

- Centralizar la informacion de gestion del restaurante en una unica plataforma
- Proporcionar insights accionables basados en datos historicos y en tiempo real
- Facilitar la toma de decisiones mediante visualizaciones claras y KPIs relevantes
- Automatizar el seguimiento de metricas operativas y financieras
- Integrar predicciones y analisis mediante inteligencia artificial

### 1.3 Usuarios Objetivo

- Gerentes de restaurante
- Propietarios y socios
- Equipos de administracion y finanzas
- Personal de operaciones

---

## 2. Arquitectura del Sistema

### 2.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   App Router │  │  Components │  │     State Management    │  │
│  │   (Pages)    │  │   (Views)   │  │  (React Hooks + SWR)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ dataService │  │  treasury   │  │     comprasService      │  │
│  │             │  │  Service    │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ facturacion │  │  operativa  │  │     whatIfService       │  │
│  │  Service    │  │  Service    │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Views     │  │    RPCs     │  │       Tables            │  │
│  │  (vw_*)     │  │  (fn_*, rpc)│  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  GoCardless │  │  Weather    │  │       Google AI         │  │
│  │   (Banking) │  │     API     │  │       (Gemini)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

1. **Usuario** interactua con la interfaz (selecciona fechas, filtros, etc.)
2. **Componente React** llama a funciones del servicio correspondiente
3. **Service Layer** realiza llamadas a Supabase (vistas o RPCs)
4. **Supabase** procesa la consulta y devuelve datos
5. **Service Layer** transforma/mapea los datos al formato esperado
6. **Componente React** renderiza los datos en la UI

---

## 3. Stack Tecnologico

### 3.1 Frontend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Next.js | 16.0.10 | Framework React con App Router |
| React | 19.2.0 | Libreria de UI |
| TypeScript | 5.x | Tipado estatico |
| Tailwind CSS | 4.x | Framework CSS utilitario |
| Recharts | 2.15.4 | Graficos y visualizaciones |
| Framer Motion | 12.x | Animaciones |
| Radix UI | Various | Componentes accesibles |
| Lucide React | 0.454.0 | Iconografia |

### 3.2 Backend y Base de Datos

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Supabase | 2.84.0 | Backend-as-a-Service |
| PostgreSQL | - | Base de datos (via Supabase) |

### 3.3 Integraciones Externas

| Servicio | Uso |
|----------|-----|
| GoCardless | Conexion bancaria Open Banking |
| Open-Meteo | Datos meteorologicos |
| Google Gemini | Asistente IA y analisis |
| Vercel Analytics | Metricas de uso |

### 3.4 Herramientas de Desarrollo

| Herramienta | Uso |
|-------------|-----|
| ESLint | Linting de codigo |
| Biome | Formateo y linting |
| PostCSS | Procesamiento CSS |

---

## 4. Estructura del Proyecto

```
/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── chat/route.ts         # Endpoint para Smart Assistant
│   ├── invoices/page.tsx         # Pagina de facturas
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Pagina principal (SPA routing)
│   └── globals.css               # Estilos globales
│
├── components/
│   ├── charts/                   # Componentes de graficos
│   │   └── ChartTooltip.tsx      # Tooltip personalizado
│   │
│   ├── features/                 # Componentes de funcionalidades
│   │   ├── AIInsightCard.tsx     # Tarjeta de insights IA
│   │   ├── BenchmarksTab.tsx     # Tab de benchmarks
│   │   ├── FoodCostTab.tsx       # Tab de food cost
│   │   ├── SmartAssistant.tsx    # Chat IA
│   │   ├── WeatherCard.tsx       # Widget de clima
│   │   └── WeekReservationsCard.tsx # Reservas semanales
│   │
│   ├── layout/                   # Componentes de layout
│   │   ├── PageContent.tsx       # Wrapper de contenido
│   │   ├── PageHeader.tsx        # Cabecera de pagina
│   │   └── Sidebar.tsx           # Menu lateral
│   │
│   ├── ui/                       # Componentes UI base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── TremorCard.tsx        # Card personalizada estilo Tremor
│   │   ├── MetricGroupCard.tsx   # Tarjeta de metricas agrupadas
│   │   ├── menu-bar.tsx          # Barra de navegacion por tabs
│   │   ├── date-range-picker.tsx # Selector de rango de fechas
│   │   └── ... (40+ componentes)
│   │
│   └── views/                    # Paginas/Vistas principales
│       ├── DashboardPage.tsx     # Dashboard principal
│       ├── ReservationsPage.tsx  # Reservas y ocupacion
│       ├── IncomePage.tsx        # Ingresos
│       ├── ExpensesPage.tsx      # Gastos
│       ├── ComprasPage.tsx       # Compras
│       ├── CostesPage.tsx        # Costes (Food Cost, Laboral)
│       ├── ProductsPage.tsx      # Mix de productos
│       ├── OperationsPage.tsx    # Operativa en tiempo real
│       ├── FacturacionPage.tsx   # Facturacion
│       ├── TreasuryPage.tsx      # Tesoreria
│       ├── ForecastingPage.tsx   # Predicciones
│       ├── WhatIfPage.tsx        # Simulador What-If
│       ├── BankConnectionsPage.tsx # Conexiones bancarias
│       └── SmartAssistantPage.tsx  # Asistente IA
│
├── lib/                          # Servicios y utilidades
│   ├── supabase.ts               # Cliente Supabase
│   ├── dataService.ts            # Servicio principal de datos
│   ├── treasuryService.ts        # Servicio de tesoreria
│   ├── comprasService.ts         # Servicio de compras
│   ├── facturacionService.ts     # Servicio de facturacion
│   ├── operativaService.ts       # Servicio de operativa
│   ├── whatIfService.ts          # Servicio del simulador
│   ├── gemini.ts                 # Integracion Google Gemini
│   ├── weather.ts                # Servicio meteorologico
│   ├── assistantChips.ts         # Chips del asistente IA
│   └── utils.ts                  # Utilidades generales
│
├── hooks/                        # Custom React Hooks
│   ├── use-mobile.ts             # Deteccion de dispositivo movil
│   ├── use-toast.ts              # Sistema de notificaciones
│   └── useComparison.ts          # Hook de comparacion de periodos
│
├── types.ts                      # Definiciones de tipos TypeScript
├── constants.ts                  # Constantes de la aplicacion
└── package.json                  # Dependencias del proyecto
```

---

## 5. Modulos Funcionales

### 5.1 Dashboard

**Archivo:** `components/views/DashboardPage.tsx`

**Funcionalidad:**
- Vista general con KPIs principales del dia
- Metricas en tiempo real
- Widget de clima
- Reservas de la semana
- Top productos del dia
- Insights generados por IA

**Datos:**
- `vw_kpis_live` - KPIs en tiempo real
- `vw_dashboard_ventas_facturas_live` - Facturacion del dia
- Weather API - Prediccion meteorologica

---

### 5.2 Reservas y Ocupacion

**Archivo:** `components/views/ReservationsPage.tsx`

**Funcionalidad:**
- KPIs de reservas (totales, comensales, ocupacion)
- Graficos de tendencia por turno
- Comparativa anual mes a mes
- Comparativa de periodos personalizados
- Heatmap de ocupacion semanal

**Vistas/RPCs:**
- `fn_reservas_comparacion_anual` - Comparativa anual
- `fn_reservas_comparacion_periodo` - Comparativa de periodos
- `dia_reservas` - Datos diarios de reservas

---

### 5.3 Ingresos

**Archivo:** `components/views/IncomePage.tsx`

**Funcionalidad:**
- Total facturado con desglose
- Facturacion por mesa
- Metodos de pago
- Propinas
- Tendencias temporales

**Vistas:**
- `vw_metricas_diarias_base` - Metricas diarias
- `vw_facturacion_mesas` - Facturacion por mesa

---

### 5.4 Gastos

**Archivo:** `components/views/ExpensesPage.tsx`

**Tabs:**
- Por Categoria
- Por Proveedor
- Calendario de Pagos

**Funcionalidad:**
- KPIs de gastos (total, pagado, pendiente, vencido)
- Desglose por categoria/proveedor
- Calendario visual de vencimientos
- Filtrado por tags

**RPCs:**
- `get_expense_tags` - Tags disponibles
- `get_gastos_by_tags` - Gastos filtrados por tags
- `get_gastos_by_due_date` - Gastos por fecha de vencimiento
- `get_gastos_resumen_by_tags` - Resumen por tags
- `get_gastos_resumen_by_provider` - Resumen por proveedor

---

### 5.5 Compras

**Archivo:** `components/views/ComprasPage.tsx`

**Tabs:**
- Pedidos
- Conciliacion
- Analisis

**Funcionalidad:**
- Gestion de pedidos a proveedores
- Conciliacion de albaranes con facturas
- Analisis de compras (KPIs, evolucion, distribucion)

**Vistas/RPCs:**
- `vw_compras_pedidos` - Listado de pedidos
- `vw_compras_conciliacion` - Estado de conciliacion
- `vw_compras_albaranes_para_vincular` - Albaranes pendientes
- `vw_compras_proveedores` - Catalogo de proveedores
- `vw_compras_resumen` - Resumen general
- `compras_kpis` - KPIs del periodo
- `compras_evolucion_mensual` - Evolucion mensual
- `compras_distribucion` - Distribucion por categoria
- `compras_top_productos` - Ranking de productos
- `compras_tabla_jerarquica` - Desglose jerarquico
- `fn_conciliar_manual` - Conciliacion manual
- `fn_confirmar_conciliacion` - Confirmar conciliacion
- `fn_descartar_conciliacion` - Descartar conciliacion

---

### 5.6 Costes

**Archivo:** `components/views/CostesPage.tsx`

**Tabs:**
- Food Cost
- Coste Laboral
- Benchmarks

**Funcionalidad:**
- Calculo de food cost por producto
- Analisis de coste laboral vs ventas
- Comparativa con benchmarks del sector

**Vistas/RPCs:**
- `vw_food_cost` - Food cost por producto
- `vw_labor_cost_analysis` - Coste laboral
- `get_benchmarks_resumen` - Benchmarks del sector
- `update_manual_price` - Actualizar precio manual
- `update_variant_manual_price` - Actualizar precio de variante

---

### 5.7 Productos

**Archivo:** `components/views/ProductsPage.tsx`

**Funcionalidad:**
- Mix de productos (ventas por producto)
- Mix de categorias
- Mix de opciones/modificadores
- Analisis de voids

**Vistas:**
- `vw_mix_productos` - Mix de productos
- `vw_mix_categorias` - Mix de categorias
- `vw_mix_opciones` - Mix de opciones

---

### 5.8 Operaciones

**Archivo:** `components/views/OperationsPage.tsx`

**Tabs:**
- Tiempo Real
- Historico

**Funcionalidad:**
- Monitoreo de cocina en tiempo real
- Tiempos de preparacion
- Alertas de items criticos
- Analisis historico de tiempos

**Vistas/RPCs:**
- `vw_operaciones_tiempo_real` - Estado actual
- `vw_operativa_items` - Items procesados
- `get_operativa_kpis` - KPIs de operativa
- `get_operativa_productos` - Tiempos por producto
- `get_operativa_cliente` - Experiencia del cliente
- `get_operativa_por_hora` - Distribucion horaria

---

### 5.9 Facturacion

**Archivo:** `components/views/FacturacionPage.tsx`

**Tabs:**
- Facturas
- Ingresos
- Alertas

**Funcionalidad:**
- Listado de facturas emitidas
- Estado VeriFactu
- Desglose de ingresos
- Alertas de facturacion

**RPCs:**
- `rpc_facturacion_semana` - Facturacion semanal

---

### 5.10 Tesoreria

**Archivo:** `components/views/TreasuryPage.tsx`

**Tabs:**
- Cuentas
- Movimientos
- Pool Bancario
- Categorias

**Funcionalidad:**
- Saldos de cuentas bancarias
- Movimientos con categorizacion
- Gestion de prestamos
- Analisis por categoria

**RPCs:**
- `get_treasury_kpis` - KPIs de tesoreria
- `get_treasury_accounts` - Cuentas bancarias
- `get_treasury_transactions` - Movimientos
- `get_treasury_transactions_summary` - Resumen de movimientos
- `get_treasury_categories` - Categorias
- `get_treasury_by_category` - Desglose por categoria
- `get_treasury_monthly_summary` - Resumen mensual
- `update_transaction_category` - Categorizar movimiento

---

### 5.11 Forecasting

**Archivo:** `components/views/ForecastingPage.tsx`

**Funcionalidad:**
- Predicciones de demanda
- Ocupacion prevista
- Precision del modelo
- Factores que afectan la prediccion

**Vistas:**
- `vw_forecasting_analysis` - Datos de forecasting

---

### 5.12 Simulador What-If

**Archivo:** `components/views/WhatIfPage.tsx`

**Funcionalidad:**
- Simulacion de escenarios
- Impacto de cambios en ocupacion
- Impacto de cambios en ticket medio
- Proyecciones financieras

**Vistas:**
- `vw_forecasting_analysis` - Datos de referencia

---

### 5.13 Smart Assistant

**Archivo:** `components/views/SmartAssistantPage.tsx`

**Funcionalidad:**
- Chat con IA
- Respuestas contextuales sobre el negocio
- Chips de acceso rapido

**Integracion:**
- Google Gemini (via API Route `/api/chat`)

---

## 6. Modelo de Datos

### 6.1 Tipos Principales

#### Metricas de Turno (ShiftMetrics)

```typescript
interface ShiftMetrics {
  reservations: number
  pax: number
  tables: number
  occupancy_rate: number
  avg_pax_per_res: number
  avg_pax_per_table: number
  tables_used: number
  table_rotation: number
  revenue: number
  tips: number
  tips_count: number
  transactions: number
  avg_ticket_transaction: number
  avg_ticket_res: number
  avg_ticket_pax: number
  avg_ticket_table: number
  payment_methods: PaymentMethods
  sales_data: SalesBreakdown
  tables_breakdown: TableSales[]
  expenses: ExpenseStats
  verifactu_metrics: { success: number; error: number; pending: number }
}
```

#### Gasto (Expense)

```typescript
interface Expense {
  id: string
  cuentica_id: number
  fecha: string
  mes: string
  document_number: string
  status: "partial" | "pending" | "overdue"
  total_amount: number
  base_amount: number
  tax_amount: number
  due_date: string | null
  categoria_codigo: string
  categoria_nombre: string
  grupo_categoria: string
  proveedor: string
  tags: ExpenseTagInfo[]
}
```

#### Transaccion de Tesoreria (TreasuryTransaction)

```typescript
interface TreasuryTransaction {
  id: string
  account_id: string
  account_name: string
  bank_name: string
  bank_logo: string | null
  booking_date: string
  value_date: string
  amount: number
  currency: string
  description: string
  category_id: string | null
  category_name: string | null
  category_type: string | null
  subcategory_id: string | null
  subcategory_name: string | null
  counterparty_name: string | null
  reference: string | null
  categorization_method?: "manual" | "rule" | "ai" | "imported" | null
}
```

#### Producto Mix (ProductMixItem)

```typescript
interface ProductMixItem {
  fecha: string
  mes: string
  dia_semana: number
  turno_id: number
  turno_nombre: string
  product_sku: string
  producto_nombre: string
  category_sku: string
  categoria_nombre: string
  precio_carta: number
  coste_unitario: number | null
  unidades: number
  facturado: number
  precio_medio_real: number
  diferencia_precio: number
  pct_unidades_dia: number
  pct_facturado_dia: number
  ranking_dia_facturado: number
  ranking_dia_unidades: number
  unidades_void: number
  facturado_void: number
  pct_void_producto: number
}
```

### 6.2 Vistas de Supabase

| Vista | Descripcion | Modulo |
|-------|-------------|--------|
| `vw_kpis_live` | KPIs en tiempo real | Dashboard |
| `vw_dashboard_ventas_facturas_live` | Ventas del dia | Dashboard |
| `vw_dashboard_financiero` | KPIs financieros | Dashboard |
| `vw_dashboard_ocupacion` | Ocupacion del dia | Dashboard |
| `vw_metricas_diarias_base` | Metricas diarias historicas | Ingresos |
| `vw_facturacion_mesas` | Facturacion por mesa | Ingresos |
| `vw_mix_productos` | Mix de productos | Productos |
| `vw_mix_categorias` | Mix de categorias | Productos |
| `vw_mix_opciones` | Mix de opciones | Productos |
| `vw_compras_pedidos` | Pedidos de compra | Compras |
| `vw_compras_conciliacion` | Conciliacion de compras | Compras |
| `vw_compras_albaranes_para_vincular` | Albaranes pendientes | Compras |
| `vw_compras_proveedores` | Proveedores | Compras |
| `vw_compras_resumen` | Resumen de compras | Compras |
| `vw_operaciones_tiempo_real` | Operativa en tiempo real | Operaciones |
| `vw_operativa_items` | Items de operativa | Operaciones |
| `vw_forecasting_analysis` | Datos de prediccion | Forecasting |
| `vw_food_cost` | Food cost por producto | Costes |
| `vw_labor_cost_analysis` | Coste laboral | Costes |

### 6.3 RPCs de Supabase

| RPC | Descripcion | Parametros |
|-----|-------------|------------|
| `get_expense_tags` | Tags de gastos | - |
| `get_gastos_by_tags` | Gastos filtrados | fecha_inicio, fecha_fin, tags[], status |
| `get_gastos_by_due_date` | Gastos por vencimiento | fecha_inicio, fecha_fin |
| `get_gastos_resumen_by_tags` | Resumen por tags | fecha_inicio, fecha_fin |
| `get_gastos_resumen_by_provider` | Resumen por proveedor | fecha_inicio, fecha_fin |
| `compras_kpis` | KPIs de compras | fecha_inicio, fecha_fin |
| `compras_evolucion_mensual` | Evolucion mensual | meses_atras |
| `compras_distribucion` | Distribucion | fecha_inicio, fecha_fin |
| `compras_top_productos` | Top productos | fecha_inicio, fecha_fin, limite |
| `compras_tabla_jerarquica` | Desglose jerarquico | fecha_inicio, fecha_fin |
| `fn_conciliar_manual` | Conciliar albaran | factura_id, albaran_id |
| `fn_confirmar_conciliacion` | Confirmar conciliacion | factura_id |
| `fn_descartar_conciliacion` | Descartar conciliacion | factura_id |
| `get_treasury_kpis` | KPIs tesoreria | fecha_inicio, fecha_fin |
| `get_treasury_accounts` | Cuentas bancarias | - |
| `get_treasury_transactions` | Movimientos | cuenta_id, fecha_inicio, fecha_fin |
| `get_treasury_transactions_summary` | Resumen movimientos | fecha_inicio, fecha_fin |
| `get_treasury_categories` | Categorias | - |
| `get_treasury_by_category` | Por categoria | fecha_inicio, fecha_fin |
| `get_treasury_monthly_summary` | Resumen mensual | meses |
| `update_transaction_category` | Categorizar | transaction_id, category_id |
| `get_operativa_kpis` | KPIs operativa | fecha_inicio, fecha_fin |
| `get_operativa_productos` | Tiempos productos | fecha_inicio, fecha_fin |
| `get_operativa_cliente` | Experiencia cliente | fecha_inicio, fecha_fin |
| `get_operativa_por_hora` | Por hora | fecha_inicio, fecha_fin |
| `get_benchmarks_resumen` | Benchmarks | fecha_inicio, fecha_fin |
| `update_manual_price` | Precio manual | product_sku, price |
| `update_variant_manual_price` | Precio variante | variant_sku, price |
| `clear_manual_price` | Limpiar precio | product_sku |
| `fn_reservas_comparacion_anual` | Comparativa anual | año1, año2 |
| `fn_reservas_comparacion_periodo` | Comparativa periodo | fecha_inicio, fecha_fin |
| `rpc_facturacion_semana` | Facturacion semanal | week_offset |

---

## 7. Integracion con Backend

### 7.1 Cliente Supabase

**Archivo:** `lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 7.2 Patron de Servicios

Cada servicio sigue el patron:

```typescript
// Ejemplo: fetchExpensesByTags
export async function fetchExpensesByTags(params: {
  startDate: string
  endDate: string
  tags?: string[]
  status?: string
}): Promise<{ data: Expense[]; total: number }> {
  
  const { data, error } = await supabase.rpc("get_gastos_by_tags", {
    p_fecha_inicio: params.startDate,
    p_fecha_fin: params.endDate,
    p_tags: params.tags || [],
    p_status: params.status || null,
  })

  if (error) {
    console.error("Error fetching expenses:", error)
    return { data: [], total: 0 }
  }

  // Mapeo de datos
  const expenses: Expense[] = (data || []).map((item: any) => ({
    id: item.id,
    fecha: item.fecha,
    // ... mapeo de campos
  }))

  return { data: expenses, total: expenses.length }
}
```

### 7.3 Manejo de Errores

```typescript
try {
  const { data, error } = await supabase.rpc("nombre_rpc", params)
  
  if (error) {
    console.error("[v0] Error en RPC:", error.message)
    return defaultValue
  }
  
  return transformData(data)
} catch (err) {
  console.error("[v0] Exception:", err)
  return defaultValue
}
```

---

## 8. Sistema de Diseno

### 8.1 Paleta de Colores

```typescript
const BRAND_COLORS = {
  primary: "#02b1c4",    // Cyan - Acciones principales, tabs activos
  dark: "#364f6b",       // Dark blue-gray - Titulos y texto principal
  secondary: "#223143",  // Darker blue-gray - Texto secundario
  accent: "#227c9d",     // Teal - Acentos, cena/noche
  lunch: "#ffcb77",      // Yellow - Comida/dia, warnings
  success: "#17c3b2",    // Green - Exito, tendencias positivas
  error: "#fe6d73",      // Red - Errores, tendencias negativas
  warning: "#ffcb77",    // Yellow - Advertencias
}
```

### 8.2 Tipografia

- **Font Family:** Inter (sans-serif)
- **Mono:** Geist Mono
- **Serif:** Source Serif 4

### 8.3 Componentes Base

| Componente | Uso |
|------------|-----|
| `TremorCard` | Contenedor de seccion con titulo |
| `MetricGroupCard` | Grupo de KPIs |
| `MenuBar` | Navegacion por tabs |
| `DateRangePicker` | Selector de fechas |
| `PageHeader` | Cabecera de pagina |
| `PageContent` | Wrapper de contenido |

### 8.4 Graficos

- **Libreria:** Recharts
- **Colores:** Paleta de la marca
- **Tooltip:** Estilo consistente con borde, sombra y fondo blanco

```typescript
const tooltipStyle = {
  contentStyle: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  }
}
```

---

## 9. Guia de Desarrollo

### 9.1 Agregar una Nueva Vista

1. Crear componente en `components/views/NuevaVistPage.tsx`
2. Agregar item de navegacion en `constants.ts`
3. Agregar ruta en `app/page.tsx`
4. Crear funciones de servicio en `lib/`
5. Definir tipos en `types.ts`

### 9.2 Agregar una Nueva RPC

1. Crear RPC en Supabase
2. Crear funcion en servicio correspondiente:

```typescript
export async function fetchNuevosDatos(params: {
  fechaInicio: string
  fechaFin: string
}): Promise<NuevoTipo[]> {
  const { data, error } = await supabase.rpc("nombre_rpc", {
    fecha_inicio: params.fechaInicio,
    fecha_fin: params.fechaFin,
  })

  if (error) {
    console.error("Error:", error)
    return []
  }

  return data || []
}
```

3. Agregar tipo en `types.ts`
4. Usar en componente

### 9.3 Convenciones de Codigo

- **Nombres de archivos:** PascalCase para componentes, camelCase para servicios
- **Tipos:** Prefijo con modulo (ej: `TreasuryTransaction`, `ComprasPedido`)
- **Servicios:** Prefijo `fetch` para lecturas, verbos para acciones
- **Componentes:** Funcionales con hooks, evitar clases

### 9.4 Debugging

```typescript
console.log("[v0] Descripcion:", variable)
```

---

## 10. Configuracion y Despliegue

### 10.1 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# GoCardless (Open Banking)
GOCARDLESS_SECRET_KEY=xxx
GOCARDLESS_SECRET_ID=xxx

# Google AI (Gemini)
IA_ASSISTANT_SMART_APP=xxx
```

### 10.2 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de produccion
npm run build

# Iniciar produccion
npm start

# Linting
npm run lint
```

### 10.3 Despliegue

La aplicacion esta optimizada para despliegue en **Vercel**:

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Despliegue automatico con cada push a main

### 10.4 Estructura de URLs

| Ruta | Vista |
|------|-------|
| `/` | Dashboard |
| `/reservations` | Reservas y Ocupacion |
| `/revenue` | Ingresos |
| `/expenses` | Gastos |
| `/purchases` | Compras |
| `/costs` | Costes |
| `/products` | Productos |
| `/operations` | Operaciones |
| `/invoices` | Facturacion |
| `/treasury` | Tesoreria |
| `/forecasting` | Forecasting |
| `/ai-assistant` | Smart Assistant |
| `/settings` | Configuracion |

---

## Historial de Versiones

| Version | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | Enero 2026 | Version inicial |

---

**Documento generado el:** 29 de Enero de 2026  
**Proyecto:** NUA Smart App  
**Autor:** Equipo de Desarrollo
