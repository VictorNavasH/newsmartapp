# Arquitectura — NÜA Smart App

## Visión General

NÜA Smart App es un dashboard de gestión integral para restaurantes. Aunque usa Next.js App Router, la navegación entre vistas es **interna (SPA)** mediante hash-based routing gestionado por el hook `useAppRouter`, no mediante el router de archivos de Next.js. Esto permite transiciones instantáneas sin recarga de página, soporte de historial del navegador (back/forward), y URLs compartibles.

---

## Flujo de Renderizado

```
app/layout.tsx                    # Layout raíz: fonts, <Analytics />, dark mode script
  └── app/page.tsx                # Componente principal "use client"
        ├── useAuth()             # Autenticación (Supabase Google OAuth)
        ├── useAppRouter()        # Navegación SPA con hash routing
        │   ├── loading → Spinner
        │   └── !user → <LoginScreen />
        │
        └── Autenticado:
            ├── <Sidebar />       # Navegación lateral (usa navigate())
            ├── <ErrorBoundary>   # Captura errores de render en vistas
            │   └── <Suspense>    # Loading fallback para lazy imports
            │       └── <main>    # Vista activa según currentPath
            │           └── renderContent() → switch(currentPath)
            │               ├── "/" → <DashboardPage />          (lazy)
            │               ├── "/reservations" → <ReservationsPage /> (lazy)
            │               ├── "/revenue" → <IncomePage />      (lazy)
            │               ├── ... (16 vistas, todas lazy)
            │               └── "/settings" → <SettingsPage />   (lazy)
            └── <SmartAssistant /> # Widget flotante de chat IA
```

---

## Navegación SPA

La app **no usa** el file-based routing de Next.js para las vistas principales. En su lugar:

1. `hooks/useAppRouter.ts` gestiona la navegación con hash-based routing (`#/ruta`)
2. El hook valida rutas contra un `Set` de 16 paths válidos y sincroniza con `window.history`
3. El `<Sidebar>` recibe `onNavigate={navigate}` y actualiza el path al hacer clic
4. `renderContent()` usa un `switch(currentPath)` para renderizar la vista correspondiente
5. Las 16 vistas se importan con `React.lazy()` (code splitting) y se envuelven en `<Suspense>`
6. Un `<ErrorBoundary>` envuelve el contenido principal para capturar errores de render

**Ventajas del hash routing:**
- Soporte de botones back/forward del navegador
- URLs compartibles (e.g., `https://app.com/#/reservations`)
- Persistencia del path al recargar la pagina

**Excepción:** La ruta `/api/chat` sí usa el router de Next.js (es una API route).

---

## Autenticación

### Configuración
- **Proveedor:** Google OAuth a través de Supabase Auth
- **Restricción de dominio:** Solo emails `@nuasmartrestaurant.com`
- **Hook:** `hooks/useAuth.ts` exporta `useAuth()`

### Flujo
```
1. App se carga → useAuth() verifica sesión con Supabase
2. Si no hay sesión → muestra <LoginScreen />
3. Usuario hace clic en "Acceder con Google"
4. Google OAuth → Supabase Auth valida dominio
5. Si dominio correcto → sesión activa → muestra dashboard
6. Si dominio incorrecto → error "Solo emails @nuasmartrestaurant.com"
```

### Datos del Usuario
- **Nombre:** `user.user_metadata.full_name` (configurado en Supabase `raw_user_meta_data`)
- **Email:** `user.email`
- **Se pasan a:** `<Sidebar>` (muestra nombre + iniciales) y `<SettingsPage>` (perfil)

### Cierre de Sesión
- Botón `LogOut` en la parte inferior del Sidebar
- Llama a `signOut()` del hook `useAuth()`
- Redirige automáticamente a `<LoginScreen />`

---

## Modo Oscuro

### Implementación
- **Mecanismo:** Clase CSS `.dark` en el elemento `<html>`
- **Variables CSS:** Definidas en `globals.css` con `:root` (claro) y `.dark` (oscuro)
- **Persistencia:** `localStorage` con clave `nua-theme`
- **Valores posibles:** `light`, `dark`, `system`

### Prevención de Flash (FOUC)
En `layout.tsx`, un script inline en `<head>` lee `localStorage` antes del primer render:
```javascript
(function(){
  try {
    var t = localStorage.getItem("nua-theme");
    if (t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme:dark)").matches)) {
      document.documentElement.classList.add("dark")
    }
  } catch(e) {}
})()
```

### Selector de Tema
Disponible en **Configuración > Apariencia** con 3 opciones: Claro / Oscuro / Sistema.
El componente actualiza `localStorage` y la clase del `<html>` simultáneamente.

---

## Estructura de Componentes

```
components/
├── views/          # 16 paginas principales (una por ruta SPA, cargadas con React.lazy)
│   ├── DashboardPage.tsx
│   ├── ReservationsPage.tsx
│   ├── reservations/                # Sub-componentes de Reservas
│   │   ├── constants.ts             # PeriodKey, YearlyMetric, YearlyTurno, YEAR_COLORS, MONTH_NAMES
│   │   ├── ReservationsKPISection.tsx      # Capacidad + 6 MetricGroupCards + grafico 30 dias
│   │   ├── ReservationsYearlyChart.tsx     # Comparativa anual LineChart + trend insight
│   │   └── ReservationsComparatorSection.tsx # Comparador de periodos
│   ├── IncomePage.tsx
│   ├── ExpensesPage.tsx
│   ├── expenses/                    # Sub-componentes de Gastos
│   │   ├── constants.ts             # StatusFilter, ProviderStatusFilter, STATUS_LABELS, CATEGORY_COLORS
│   │   ├── ExpensesCategoriaTab.tsx  # Tab Por Categoria
│   │   ├── ExpensesProveedorTab.tsx  # Tab Por Proveedor
│   │   └── ExpensesCalendarioTab.tsx # Tab Calendario
│   ├── CostesPage.tsx
│   ├── ComprasPage.tsx
│   ├── compras/                     # Sub-componentes de Compras
│   │   ├── constants.tsx            # ESTADO_PEDIDO_CONFIG, ESTADO_CONCILIACION_CONFIG (JSX), colores
│   │   ├── ComprasPedidosTab.tsx    # Tab Pedidos
│   │   ├── ComprasConciliacionTab.tsx # Tab Conciliacion
│   │   └── ComprasAnalisisTab.tsx   # Tab Analisis
│   ├── OperationsPage.tsx
│   ├── ProductsPage.tsx
│   ├── FacturacionPage.tsx
│   ├── TreasuryPage.tsx
│   ├── treasury/                    # Sub-componentes de Tesoreria
│   │   ├── constants.ts             # PAGE_SIZE, TipoFilter, TIPO_LABELS, BANK_INFO, CATEGORY_ICON_MAP
│   │   ├── TreasuryDashboardTab.tsx # Tab Resumen
│   │   ├── TreasuryMovimientosTab.tsx # Tab Movimientos
│   │   ├── TreasuryCategoriaTab.tsx # Tab Categorias
│   │   ├── TreasuryPoolBancarioTab.tsx # Tab Pool Bancario
│   │   └── TreasuryCuentaTab.tsx    # Tab Cuentas
│   ├── ForecastingPage.tsx
│   ├── WhatIfPage.tsx
│   ├── SmartAssistantPage.tsx
│   ├── BankConnectionsPage.tsx
│   ├── TabletUsagePage.tsx
│   └── SettingsPage.tsx
│
├── ErrorBoundary.tsx # Captura errores en el arbol de componentes (class component)
│
├── features/       # Componentes de negocio reutilizables
│   ├── SmartAssistant.tsx      # Widget flotante de chat IA
│   ├── LoginScreen.tsx         # Pantalla de login
│   ├── WeatherCard.tsx         # Previsión meteorológica
│   ├── WeekReservationsCard.tsx # Ocupación semanal
│   ├── AIInsightCard.tsx       # Insights generados por IA
│   ├── BenchmarksTab.tsx       # Comparación con sector
│   └── FoodCostTab.tsx         # Análisis de márgenes
│
├── layout/         # Componentes estructurales
│   ├── Sidebar.tsx             # Navegación lateral (260px / 80px colapsado)
│   ├── PageHeader.tsx          # Cabecera con icono, título, subtítulo, acciones
│   └── PageContent.tsx         # Wrapper del contenido principal
│
├── charts/         # Componentes de gráficos
│   └── ChartTooltip.tsx        # Tooltip genérico para Recharts
│
└── ui/             # Componentes UI base (Shadcn/Radix)
    ├── badge.tsx, button.tsx, calendar.tsx, card.tsx ...
    ├── MetricGroupCard.tsx     # Tarjetas de métricas con delta
    ├── TremorCard.tsx          # Wrapper de tarjetas Tremor
    └── MovingBorderButton.tsx  # Botón animado
```

---

## Tipos TypeScript (`types/`)

Los tipos del proyecto están organizados en módulos por dominio funcional:

```
types.ts                    # Re-export: export * from './types/index'
types/
├── index.ts               # Barrel re-export de todos los módulos
├── sales.ts               # ShiftType, PaymentMethods, ShiftMetrics, DailyCompleteMetrics
├── common.ts              # ComparisonResult, MetricComparison, DateRange, InsightResponse
├── weather.ts             # WeatherDay
├── dashboard.ts           # WeekReservationDay, FinancialKPIs, RealTimeData, LaborCostDay
├── expenses.ts            # ExpenseStats, Invoice, Expense, ExpenseTag
├── operations.ts          # OperacionesResumen, OperativaItem, OperativaKPI
├── products.ts            # ProductMixItem, CategoryMixItem, agregados
├── forecasting.ts         # ForecastDay, YearlyComparisonData, PeriodComparisonAggregate
├── treasury.ts            # TreasuryKPIs, TreasuryAccount, TreasuryTransaction
├── whatif.ts              # WhatIfReferenceData
├── pool-bancario.ts       # PoolBancarioResumen, PoolBancarioPrestamo
├── billing.ts             # FacturacionResumenGlobal, CuadreListadoItem, BenchmarkResumen
├── food-cost.ts           # FoodCostProduct, FoodCostSummary
├── purchases.ts           # CompraPedido, CompraKPIs, CompraFacturaConciliacion
└── recharts.ts            # RechartsPayloadEntry, RechartsTooltipProps
```

El archivo raíz `types.ts` re-exporta todo desde `types/index.ts`, por lo que los imports existentes (`import { X } from '@/types'`) siguen funcionando sin cambios.

---

## Gestión de Estado

La app usa **estado local** por página, sin store global:

| Patrón | Uso |
|--------|-----|
| `useState` | Estado de datos, filtros, tabs activos, fechas seleccionadas |
| `useEffect` | Data fetching cuando cambian las dependencias (fechas, filtros) |
| `useMemo` | Datos derivados, filtrados, cálculos sobre datos raw |
| `useCallback` | Funciones de fetch memoizadas para evitar re-renders |
| `useAsyncData<T>` | Hook genérico para fetching con loading/error/refresh automático |

### Patron de sub-componentes por tab/seccion

Las vistas grandes (>1000 lineas) se dividen en sub-componentes organizados en carpetas por dominio:

```
views/
├── ExamplePage.tsx              # Parent: estado, effects, memos, tab switching
└── example/
    ├── constants.ts             # Tipos, colores, labels, configuracion compartida
    ├── ExampleTabA.tsx          # Sub-componente con Props interface tipado
    └── ExampleTabB.tsx          # Sub-componente con Props interface tipado
```

**Reglas:**
- **Parent mantiene:** useState, useEffect, data fetching, useMemo, navegacion de tabs
- **Sub-componentes reciben:** datos y callbacks via props tipados (interfaces explicitas)
- **Constants extraen:** tipos repetidos, configuraciones de colores, labels, mapas de iconos
- **Archivos .tsx** se usan cuando los constants contienen JSX (ej: iconos de estado)
- **Compatibilidad:** El default export del parent no cambia

Vistas refactorizadas: TreasuryPage, ComprasPage, ExpensesPage, ReservationsPage.

### Patron tipico de una vista:
```typescript
export default function ExamplePage() {
  // 1. Estado de filtros
  const [dateRange, setDateRange] = useState<DateRange>(...)
  const [activeTab, setActiveTab] = useState("overview")

  // 2. Estado de datos
  const [data, setData] = useState<Type[]>([])
  const [loading, setLoading] = useState(true)

  // 3. Fetch de datos
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchDataFromService(dateRange)
      setData(result)
    } catch (error) {
      console.error("[ExamplePage] Error:", error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { loadData() }, [loadData])

  // 4. Datos derivados
  const filteredData = useMemo(() =>
    data.filter(item => ...), [data, filter])

  // 5. Render con skeleton loading
  return loading ? <Skeleton /> : <Content data={filteredData} />
}
```

---

## Manejo de Errores

| Nivel | Estrategia |
|-------|-----------|
| Variables de entorno | `lib/env.ts` valida variables requeridas al iniciar. Si falta alguna, lanza error con nombre de la variable y referencia a `.env.local` |
| Servicios (`lib/`) | `try/catch` en todas las funciones, `console.error` con prefijo `[nombreFunción]`. Se puede usar `logError()` de `lib/errorLogger.ts` para logging estructurado |
| Componentes | Fallback a arrays vacíos `[]` o valores por defecto |
| ErrorBoundary | `components/ErrorBoundary.tsx` — React class component que captura errores en el árbol de componentes. Muestra UI de fallback con botón de reset. Loguea errores críticos via `logError()` |
| UI | Skeleton loading states en todas las vistas, mensajes de error cuando aplica |
| Red | Sin retry automático (excepto API chat: 1 reintento, timeout 30s) |
| Logging | `lib/errorLogger.ts` — Sistema estructurado con severidades (`info`, `warning`, `error`, `critical`). Preparado para envío a servicio externo (Supabase, Sentry) |

---

## Constantes Globales (`constants.ts`)

### Colores de Marca (`BRAND_COLORS`)
```
primary:   #02b1c4  (Cyan - Color principal)
dark:      #364f6b  (Azul oscuro - Texto)
secondary: #223143  (Azul más oscuro)
accent:    #227c9d  (Teal - Cena)
lunch:     #ffcb77  (Amarillo - Comida)
success:   #17c3b2  (Verde)
error:     #fe6d73  (Rojo)
warning:   #ffcb77  (Amarillo)
```

### Capacidad del Restaurante
```
Capacidad comida:  66 pax
Capacidad cena:    66 pax
Total mesas:       19 (18 Smart Tables + 1 Demo)
Ubicación:         41.4031, 2.1524 (Barcelona)
```

### Configuración de Charts (`CHART_CONFIG`)
Configuración centralizada para ejes, grids, cards, tooltips y colores de ticket medio.

### Tooltips de Tarjetas (`CARD_TOOLTIPS`)
20+ explicaciones para cada métrica del dashboard.

---

## Fuentes Tipográficas

Configuradas en `layout.tsx` con `next/font/google`:
- **Inter** — Fuente principal sans-serif
- **Geist Mono** — Fuente monoespaciada
- **Source Serif 4** — Fuente serif

---

## CSS y Estilos

- **Framework:** Tailwind CSS v4
- **Variantes:** `@custom-variant dark (&:is(.dark *))` para modo oscuro
- **Tema:** Variables CSS en `:root` y `.dark` en `globals.css`
- **Componentes:** Patrón Shadcn/Radix con `class-variance-authority`
- **Utilidades:** `cn()` de `lib/utils.ts` (merge de clases con `tailwind-merge` + `clsx`)
- **Animación personalizada:** `live-pulse` para badges "Live" con keyframes CSS

---

## API Endpoints

### POST `/api/chat`
Endpoint del asistente IA.

**Request:** `{ "message": "string", "sessionId": "string" }`
**Response:** `{ "response": "string" }`

**Flujo:**
1. Recibe mensaje del usuario
2. Envía al webhook N8N: `https://n8n.nuasmartrestaurant.com/webhook/nua-assistant-api`
3. N8N procesa con contexto del restaurante
4. Retorna respuesta

**Timeout:** 30 segundos, 1 reintento.
