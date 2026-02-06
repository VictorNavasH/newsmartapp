# Instrucciones del Proyecto — NÜA Smart App

## Documentación obligatoria

Cada vez que se implemente un cambio en el código (nueva vista, nuevo servicio, modificación de lógica, nuevo componente, nueva integración, etc.), se DEBE actualizar la documentación local correspondiente:

1. **`docs/VIEWS.md`** — Si se modifica o crea una vista
2. **`docs/SERVICES.md`** — Si se modifica o crea un servicio en `lib/`
3. **`docs/INTEGRATIONS.md`** — Si se añade o modifica una integración externa
4. **`docs/TYPES.md`** — Si se añaden o modifican tipos en `types.ts`
5. **`docs/ARCHITECTURE.md`** — Si cambia la arquitectura, navegación, autenticación o patrones
6. **`docs/CHANGELOG.md`** — SIEMPRE añadir entrada con el cambio realizado
7. **`README.md`** — Si cambia el stack, estructura de carpetas o setup

La documentación se actualiza como parte del mismo trabajo, sin necesidad de que el usuario lo pida.

## Documentación en Notion

El proyecto también tiene documentación en Notion que debe mantenerse sincronizada:
- Frontend: https://www.notion.so/2f932092823181b2aecbdb810a5a0b4d
- Backend: https://www.notion.so/28632092823181619910ca97cf472e80

## Idioma

El código usa nombres en inglés para variables y funciones. Los comentarios, documentación y UI están en español.

## Stack principal

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + Shadcn/Radix UI
- Supabase (PostgreSQL + Auth)
- pnpm como package manager
- Vercel para hosting (auto-deploy desde main)

## Navegación

La app NO usa file-based routing de Next.js para las vistas. Usa un estado `currentPath` en `app/page.tsx` con un `switch` que renderiza el componente correspondiente (patrón SPA).

## Autenticación

Google OAuth vía Supabase Auth. Solo emails `@nuasmartrestaurant.com`.
