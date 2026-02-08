# NÜA Smart App

Dashboard inteligente para gestión integral de restaurantes. Proporciona analítica en tiempo real, seguimiento financiero, gestión de compras, forecasting con IA y más.

**Producción:** [newsmartapp.vercel.app](https://newsmartapp.vercel.app)
**Repositorio:** [github.com/VictorNavasH/newsmartapp](https://github.com/VictorNavasH/newsmartapp)

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router + Turbopack) | 16.0.10 |
| UI Library | React | 19.2.0 |
| Testing | Vitest + Testing Library | 4.0.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS + PostCSS | 4.1.9 |
| Componentes UI | Radix UI (patrón Shadcn) | últimas |
| Charts | Recharts + Tremor | 2.15.4 / 3.18.7 |
| Base de datos | Supabase (PostgreSQL) | 2.84.0 |
| IA | Google Generative AI (Gemini 2.5 Flash) | 1.30.0 |
| Animaciones | Framer Motion | 12.23.25 |
| Iconos | Lucide React | 0.454.0 |
| Analytics | Vercel Analytics | 1.3.1 |
| Package Manager | pnpm | - |

---

## Quick Start

```bash
# Clonar repositorio
git clone https://github.com/VictorNavasH/newsmartapp.git
cd newsmartapp

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales (ver sección Variables de Entorno)

# Ejecutar en desarrollo
pnpm dev
```

### Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL       # URL del backend Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Clave anónima de Supabase
IA_ASSISTANT_SMART_APP         # API Key de Google Generative AI
```

---

## Estructura del Proyecto

```
NÜA Smart App/
├── app/                          # Next.js App Router
│   ├── api/chat/route.ts         # API del asistente IA (N8N webhook)
│   ├── layout.tsx                # Layout raíz (fonts, Analytics, dark mode)
│   └── page.tsx                  # Página principal (router SPA)
├── components/
│   ├── charts/                   # Componentes de gráficos
│   ├── ErrorBoundary.tsx         # Error boundary para captura de errores
│   ├── features/                 # Componentes de negocio (SmartAssistant, Login, etc.)
│   ├── layout/                   # Sidebar, PageHeader, PageContent
│   ├── ui/                       # Componentes UI base (Shadcn/Radix)
│   └── views/                    # 16 páginas principales (lazy loaded)
│       ├── treasury/             # Sub-componentes TreasuryPage (5 tabs)
│       ├── compras/              # Sub-componentes ComprasPage (3 tabs)
│       ├── expenses/             # Sub-componentes ExpensesPage (3 tabs)
│       └── reservations/         # Sub-componentes ReservationsPage (3 secciones)
├── hooks/                        # Custom React hooks (useAuth, useAppRouter, etc.)
│   └── __tests__/                # Tests de hooks
├── lib/                          # Servicios de datos, utilidades, API clients
│   ├── __tests__/                # Tests de servicios
│   ├── env.ts                    # Validación de variables de entorno
│   ├── errorLogger.ts            # Logging estructurado de errores
│   ├── mockData.ts               # Datos mock separados de datos reales
│   ├── dataService.ts            # Servicio principal (solo datos reales)
│   └── ...                       # Otros servicios (supabase, gemini, etc.)
├── types/                        # Tipos TypeScript organizados por dominio (15 archivos)
├── types.ts                      # Barrel re-export → types/index.ts
├── constants.ts                  # Constantes de la app (colores, capacidad, etc.)
├── vitest.config.ts              # Configuración de Vitest
└── docs/                         # Documentación técnica detallada
```

---

## Comandos

```bash
pnpm dev          # Servidor de desarrollo (localhost:3000)
pnpm build        # Build de producción
pnpm start        # Ejecutar build de producción
pnpm lint         # Ejecutar linter
pnpm test         # Tests en modo watch (Vitest)
pnpm test:run     # Tests en modo single-run
```

---

## Despliegue

El proyecto usa **Vercel** con auto-deploy:

1. Push a `main` en GitHub
2. Vercel detecta el push automáticamente
3. Ejecuta build con Turbopack
4. Despliega a producción si el build es exitoso

---

## Autenticación

- **Proveedor:** Google OAuth vía Supabase Auth
- **Restricción:** Solo emails `@nuasmartrestaurant.com`
- **Hook:** `useAuth()` en `hooks/useAuth.ts`

---

## Documentación Detallada

| Documento | Contenido |
|-----------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura, navegación SPA, autenticación, modo oscuro, patrones |
| [docs/VIEWS.md](docs/VIEWS.md) | Documentación detallada de las 15 vistas (métricas, filtros, cálculos) |
| [docs/SERVICES.md](docs/SERVICES.md) | 9 servicios de datos: funciones, queries Supabase, tipos |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | 11 integraciones externas: Supabase, Dotyk, Cuentica, GoCardless, etc. |
| [docs/TYPES.md](docs/TYPES.md) | Referencia de tipos TypeScript por dominio |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Registro de cambios del proyecto |

### Documentación en Notion

- [Documentación Frontend](https://www.notion.so/2f932092823181b2aecbdb810a5a0b4d)
- [Documentación Backend](https://www.notion.so/28632092823181619910ca97cf472e80)

---

## Datos del Restaurante

```
Capacidad por turno:  66 plazas (19 mesas)
Turnos activos:       Comida + Cena = 132 plazas/día
Ubicación:            Barcelona (41.4031, 2.1524)
```

---

## Contacto

**Administrador:** Víctor Navas
- Backend: [backend.nuasmartrestaurant.com](https://backend.nuasmartrestaurant.com)
- n8n: [n8n.nuasmartrestaurant.com](https://n8n.nuasmartrestaurant.com)
- Supabase Studio: [backend.nuasmartrestaurant.com:8000](https://backend.nuasmartrestaurant.com:8000)
