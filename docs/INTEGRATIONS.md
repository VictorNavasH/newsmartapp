# Integraciones Externas — NÜA Smart App

Documentación de las 12 integraciones externas del ecosistema NÜA Smart App.

---

## Índice

1. [Supabase (PostgreSQL + Auth)](#1-supabase)
2. [Dotyk POS](#2-dotyk-pos)
3. [Cuentica (Facturación Principal)](#3-cuentica)
4. [Billin (Facturación Histórica)](#4-billin)
5. [GoCardless (Open Banking)](#5-gocardless)
6. [CoverManager (Reservas)](#6-covermanager)
7. [Connecteam (RRHH)](#7-connecteam)
8. [GStock (Stock y Proveedores)](#8-gstock)
9. [n8n (Orquestación)](#9-n8n)
10. [Google Generative AI (Gemini)](#10-google-generative-ai)
11. [Vercel (Hosting + Analytics)](#11-vercel)
12. [Sentry (Error Monitoring)](#12-sentry)

---

## Diagrama General

```
                         ┌─────────────────────────────┐
                         │       NÜA Smart App         │
                         │    (Next.js Frontend)       │
                         └──────────┬──────────────────┘
                                    │
                              Lee / Escribe
                                    │
                         ┌──────────▼──────────────────┐
                         │       Supabase              │
                         │    (PostgreSQL + Auth)       │
                         └──────────┬──────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
     ┌────────▼───────┐   ┌────────▼───────┐   ┌────────▼───────┐
     │    n8n          │   │   GoCardless   │   │   Direct DB    │
     │  (Orquestador)  │   │  (Open Banking)│   │   Sync         │
     └───┬──┬──┬──┬────┘   └────────────────┘   └────────────────┘
         │  │  │  │
    ┌────┘  │  │  └────┐
    │       │  │       │
    ▼       ▼  ▼       ▼
 Dotyk  GStock Cuentica CoverManager
 (POS)  (Stock) (Fact.)  (Reservas)
```

---

## 1. Supabase

| Campo | Valor |
|-------|-------|
| **Tipo** | Base de datos + Autenticación |
| **Protocolo** | SDK JavaScript (supabase-js) |
| **URL** | `NEXT_PUBLIC_SUPABASE_URL` (env var) |
| **Auth** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (env var) |
| **Backend self-hosted** | `backend.nuasmartrestaurant.com` |
| **Studio** | `backend.nuasmartrestaurant.com:8000` |

### Rol en la webapp

- **Base de datos principal:** Todas las vistas, tablas, RPCs
- **Autenticación:** Google OAuth con restricción de dominio `@nuasmartrestaurant.com`
- **Cliente:** Singleton en `lib/supabase.ts`, compartido por todos los servicios

### Datos gestionados

| Categoría | Vistas/Tablas |
|-----------|---------------|
| Dashboard | `vw_dashboard_ventas_facturas_live`, `vw_dashboard_financiero`, `vw_dashboard_ocupacion` |
| Reservas | `reservas_agregadas_diarias`, `vw_metricas_diarias_base` |
| Ventas | `vw_facturacion_mesas`, `vw_mix_productos`, `vw_mix_categorias`, `vw_mix_opciones` |
| Operaciones | `vw_operaciones_tiempo_real`, `vw_operativa_items` |
| Finanzas | `vw_labor_cost_analysis`, `vw_food_cost`, `vw_forecasting_analysis` |
| Facturación | `v_facturas_listado`, `v_facturas_cuadre_diario`, `v_facturacion_mensual` |
| Tesorería | `v_pool_bancario_*` (5 vistas), RPCs `get_treasury_*` |
| Compras | `vw_compras_*` (5 vistas), RPCs `compras_*` |
| Configuración | `business_views_refresh_log`, `tables`, `turnos` |

### Autenticación OAuth

```
1. Usuario → "Acceder con Google"
2. → Supabase Auth → Google OAuth
3. ← Token + user_metadata
4. Frontend verifica dominio email
5. Si @nuasmartrestaurant.com → acceso
6. Si otro dominio → error
```

---

## 2. Dotyk POS

| Campo | Valor |
|-------|-------|
| **Tipo** | Terminal punto de venta |
| **Protocolo** | Webhooks → n8n → Supabase |
| **Dirección** | Dotyk → n8n → Supabase (unidireccional) |
| **Frecuencia** | Tiempo real (evento por evento) |

### Flujo de datos

```
Dotyk POS (TPV del restaurante)
  │
  ├─ Evento: Venta cerrada
  ├─ Evento: Factura emitida
  ├─ Evento: Z-Report generado
  │
  └──► Webhook n8n
        └──► Procesa y normaliza
              └──► INSERT Supabase
                    ├── ventas
                    ├── facturas
                    └── z_reports
```

### Tablas afectadas

- Ventas y facturación en tiempo real
- Z-reports diarios
- Facturas individuales
- Datos de productos vendidos

---

## 3. Cuentica

| Campo | Valor |
|-------|-------|
| **Tipo** | Plataforma de facturación y contabilidad |
| **Protocolo** | REST API vía n8n |
| **Dirección** | Cuentica → n8n → Supabase |
| **Frecuencia** | Diaria (sincronización programada) |
| **Estado** | **Sistema principal de facturación** (desde Nov 2025) |

### Tablas en Supabase

| Tabla | Descripción |
|-------|-------------|
| `cuentica_transactions` | Transacciones contables (ingresos y gastos) |
| `cuentica_expenses` | Gastos detallados con categorías |
| `cuentica_providers` | Proveedores registrados en Cuentica |
| `cuentica_logs` | Logs de sincronización (action, status, created_at) |

### Flujo de datos

```
Cuentica (API REST)
  │
  └──► n8n (flujo programado diario)
        ├── GET /api/transactions → cuentica_transactions
        ├── GET /api/expenses → cuentica_expenses
        ├── GET /api/providers → cuentica_providers
        └── Log resultado → cuentica_logs
```

### En la webapp

- Los gastos que muestra `ExpensesPage` provienen de Cuentica (vía RPCs que leen `cuentica_*`)
- El estado de sincronización se muestra en `SettingsPage` → tab Integraciones

---

## 4. Billin

| Campo | Valor |
|-------|-------|
| **Tipo** | Facturación electrónica |
| **Protocolo** | REST API vía n8n |
| **Dirección** | Billin → n8n → Supabase |
| **Frecuencia** | Sincronización diaria (legacy) |
| **Estado** | **⚠️ Sistema histórico/secundario** |

### Transición Billin → Cuentica

| Período | Sistema activo | Notas |
|---------|---------------|-------|
| Hasta Oct 2025 | Solo Billin | Facturación principal |
| Nov 2025 | Billin + Cuentica en paralelo | Período de transición |
| Dic 2025 en adelante | **Solo Cuentica** | Billin solo como histórico |

### Tablas en Supabase

| Tabla | Descripción |
|-------|-------------|
| `billin_logs` | Logs de sincronización (legacy) |

### En la webapp

- La webapp **NO lee datos de Billin** para mostrar información actual
- `SettingsPage` verifica el estado de la integración (tabla `billin_logs`) como indicador de salud
- Los datos históricos de Billin permanecen en Supabase pero se acceden vía las vistas unificadas

---

## 5. GoCardless

| Campo | Valor |
|-------|-------|
| **Tipo** | Open Banking |
| **Protocolo** | REST API vía n8n |
| **Dirección** | GoCardless → n8n → Supabase |
| **Frecuencia** | Periódica (varias veces al día) |

### Flujo de datos

```
GoCardless (Open Banking API)
  │
  ├── Conecta con cuentas bancarias del restaurante
  │   ├── CaixaBank (cuenta principal)
  │   └── BBVA (cuenta proveedores)
  │
  └──► n8n (flujo periódico)
        ├── GET /accounts → listado de cuentas
        ├── GET /transactions → movimientos bancarios
        └── Log resultado → gocardless_sync_logs
```

### Tablas afectadas

| Tabla/Vista | Descripción |
|-------------|-------------|
| `gocardless_sync_logs` | Logs de sincronización con `total_accounts`, `successful_accounts`, `failed_accounts` |
| Tablas de transacciones | Movimientos bancarios (consultados por `TreasuryPage` vía RPCs) |

### En la webapp

- `TreasuryPage` — Muestra saldos, transacciones, categorización
- `BankConnectionsPage` — Interfaz de gestión de conexiones (actualmente mock)
- `SettingsPage` — Estado de sincronización GoCardless

---

## 6. CoverManager

| Campo | Valor |
|-------|-------|
| **Tipo** | Gestión de reservas |
| **Protocolo** | API → n8n → Supabase |
| **Dirección** | CoverManager → n8n → Supabase |
| **Frecuencia** | Tiempo real / periódica |

### Flujo de datos

```
CoverManager (Reservas online)
  │
  ├── Reservas nuevas
  ├── Modificaciones
  └── Cancelaciones
  │
  └──► n8n
        └──► Supabase
              └── reservas_agregadas_diarias (vista agregada)
```

### En la webapp

- `ReservationsPage` — Datos históricos y actuales de reservas
- `DashboardPage` — Ocupación semanal (componente `WeekReservationsCard`)
- `ForecastingPage` — Datos históricos para modelo predictivo

---

## 7. Connecteam

| Campo | Valor |
|-------|-------|
| **Tipo** | Gestión de RRHH y turnos |
| **Protocolo** | API → n8n → Supabase |
| **Dirección** | Connecteam → n8n → Supabase |
| **Frecuencia** | Diaria |

### Flujo de datos

```
Connecteam (RRHH)
  │
  ├── Fichajes de empleados
  ├── Horas trabajadas
  └── Turnos planificados
  │
  └──► n8n
        └──► Supabase
              └── Datos de labor cost
```

### En la webapp

- `DashboardPage` — Gráfico de coste laboral (`fetchLaborCostAnalysis`)
- `CostesPage` → Benchmarks — Ratio de labor cost vs facturación

---

## 8. GStock

| Campo | Valor |
|-------|-------|
| **Tipo** | Gestión de stock y proveedores |
| **Protocolo** | API → n8n → Supabase |
| **Dirección** | GStock ↔ n8n ↔ Supabase (bidireccional) |
| **Frecuencia** | Periódica (sincronización programada) |

### Flujo de datos

```
GStock (Gestión de stock)
  │
  ├── Catálogo de productos
  ├── Proveedores
  ├── Pedidos de compra
  ├── Albaranes de entrega
  └── Formatos de producto
  │
  └──► n8n (flujo periódico)
        ├── Sync productos → Supabase
        ├── Sync proveedores → Supabase
        ├── Sync pedidos → Supabase
        └── Log resultado → gstock_sync_logs
```

### Tablas afectadas

| Tabla/Vista | Descripción |
|-------------|-------------|
| `gstock_sync_logs` | Logs: `sync_type`, `status`, `records_processed`, `records_failed`, `error_message` |
| `gstock_product_formats` | Formatos de producto (id, name) |
| `vw_compras_pedidos` | Vista de pedidos (fuente: GStock) |
| `vw_compras_conciliacion` | Vista de conciliación facturas vs albaranes |
| `vw_compras_albaranes_para_vincular` | Albaranes disponibles para vincular |
| `vw_compras_proveedores` | Lista de proveedores |

### En la webapp

- `ComprasPage` — Toda la vista de compras consume datos originados en GStock
- `CostesPage` → Food Cost — Productos con precios de compra de GStock
- `SettingsPage` — Estado de sincronización GStock

---

## 9. n8n

| Campo | Valor |
|-------|-------|
| **Tipo** | Plataforma de orquestación/automatización |
| **URL** | `https://n8n.nuasmartrestaurant.com` |
| **Protocolo** | Webhooks + cron |
| **Dirección** | Hub central de automatización |

### Rol

n8n es el **orquestador central** que conecta todos los sistemas externos con Supabase. No se accede directamente desde la webapp excepto para:

1. **Smart Assistant:** La webapp envía mensajes a un webhook n8n que procesa con contexto del restaurante
   ```
   POST /api/chat → https://n8n.nuasmartrestaurant.com/webhook/nua-assistant-api
   ```

### Flujos principales

| Flujo | Trigger | Origen → Destino |
|-------|---------|-------------------|
| Ventas en tiempo real | Webhook (Dotyk) | Dotyk → Supabase |
| Sincronización bancaria | Cron (periódico) | GoCardless → Supabase |
| Sincronización stock | Cron (diario) | GStock → Supabase |
| Sincronización contable | Cron (diario) | Cuentica → Supabase |
| Sincronización reservas | Cron/webhook | CoverManager → Supabase |
| Sincronización RRHH | Cron (diario) | Connecteam → Supabase |
| Asistente IA | Webhook (webapp) | Webapp → n8n → respuesta |
| Refresh vistas materializadas | Cron (periódico) | n8n → Supabase RPCs |

---

## 10. Google Generative AI

| Campo | Valor |
|-------|-------|
| **Tipo** | IA Generativa |
| **Modelo** | Gemini 2.5 Flash |
| **SDK** | `@google/genai` |
| **Variable de entorno** | `IA_ASSISTANT_SMART_APP` |
| **Protocolo** | SDK JavaScript (API REST bajo el capó) |

### Uso en la webapp

| Componente | Función | Descripción |
|------------|---------|-------------|
| `AIInsightCard` | `generateInsight(contextName, data)` | Genera insights automáticos sobre datos del restaurante |

### No confundir

- Los **insights automáticos** usan Gemini directamente vía `lib/gemini.ts`
- El **Smart Assistant** (chat) usa n8n como intermediario (webhook), no llama a Gemini directamente

### Manejo de errores

- Error 429 (rate limit) → retorna mensaje amigable
- Otros errores → retorna mensaje genérico de error

---

## 11. Vercel

| Campo | Valor |
|-------|-------|
| **Tipo** | Hosting + CI/CD + Analytics |
| **URL producción** | `https://newsmartapp.vercel.app` |
| **Framework** | Next.js (detección automática) |
| **Build tool** | Turbopack |

### Funcionalidades usadas

| Feature | Uso |
|---------|-----|
| Auto-deploy | Push a `main` → build → deploy automático |
| Preview deployments | PRs generan URLs de preview |
| Analytics | `@vercel/analytics` integrado en `layout.tsx` |
| Edge functions | API route `/api/chat` |

### Flujo de deploy

```
git push main
  → Vercel detecta push
    → Build con Turbopack
      → Si exitoso → Deploy a producción
      → Si falla → Notifica, mantiene versión anterior
```

---

## 12. Sentry

| Campo | Valor |
|-------|-------|
| **Tipo** | Error Monitoring + Performance |
| **SDK** | `@sentry/nextjs` |
| **DSN** | `NEXT_PUBLIC_SENTRY_DSN` (env var) |
| **Protocolo** | SDK JavaScript (envío automático de errores) |
| **Entornos** | Solo producción (`enabled: process.env.NODE_ENV === "production"`) |

### Configuración

| Archivo | Entorno | Descripción |
|---------|---------|-------------|
| `sentry.client.config.ts` | Cliente (browser) | Traces 10%, Replay 100% en errores / 10% normal, filtro de extensiones, sanitización de URLs Supabase |
| `sentry.server.config.ts` | Servidor (Node.js) | Traces 10%, filtro de errores de red |
| `sentry.edge.config.ts` | Edge Runtime | Traces 10% |
| `instrumentation.ts` | Hook Next.js | Carga server/edge configs según runtime |
| `instrumentation-client.ts` | Hook Next.js | Carga client config |
| `next.config.mjs` | Build config | `withSentryConfig` para source maps |

### Flujo de errores

```
Error en la app
  │
  ├── ErrorBoundary → Sentry.captureException() (con componentStack)
  ├── logError(severity=error|critical) → Sentry.captureException() (con tags y context)
  ├── logError(severity=warning) → Sentry.captureMessage() (level warning)
  └── Errores no capturados → SDK de Sentry (auto-capture)
```

### Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | No* | DSN del proyecto. Sin ella Sentry se desactiva silenciosamente |
| `SENTRY_ORG` | No | Organización para subir source maps |
| `SENTRY_PROJECT` | No | Proyecto para subir source maps |
| `SENTRY_AUTH_TOKEN` | No | Token de auth. Sin él se desactiva la subida de source maps |

> *Sentry funciona en modo degradado sin DSN: no envía datos pero no rompe la app.

### En la webapp

- **Errores de render:** Capturados por `ErrorBoundary` → `Sentry.captureException`
- **Errores de servicio:** Via `logError()` de `errorLogger.ts` → `Sentry.captureException`
- **Warnings:** Via `logError()` o `logWarning()` → `Sentry.captureMessage`
- **Session replay:** Graba sesiones de usuario cuando hay error (100% de sesiones con error)
- **Performance:** 10% de transacciones monitorizadas para detectar cuellos de botella

---

## Resumen: Qué sistema alimenta cada vista

| Vista | Fuente(s) de datos |
|-------|-------------------|
| Dashboard | Dotyk (ventas live), Connecteam (labor cost), CoverManager (reservas) |
| Reservas | CoverManager |
| Ingresos | Dotyk |
| Gastos | Cuentica |
| Costes | GStock (food cost), Connecteam (labor cost), Dotyk (benchmarks) |
| Compras | GStock |
| Operaciones | Dotyk (tiempos de cocina/sala) |
| Productos | Dotyk (mix de ventas) |
| Facturación | Dotyk (facturas, Z-reports) |
| Tesorería | GoCardless (movimientos bancarios) |
| Forecasting | CoverManager + Dotyk + AEMET (weather) |
| What-If | Datos agregados (múltiples fuentes) |
| Asistente IA | n8n + contexto del restaurante |
| Conexiones Bancarias | GoCardless (mock actualmente) |
| Uso de Mesas | Power BI + Smart Performance (externos) |
| Configuración | Supabase meta-datos (logs, tablas, capacidad) |
