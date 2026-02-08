// Next.js requiere acceso estático a process.env.NEXT_PUBLIC_* para inlining en build.
// No se puede usar process.env[variable] dinámicamente para vars NEXT_PUBLIC_.

// Variables requeridas — acceso estático para que Next.js las inline en build
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validación en tiempo de ejecución (solo server-side o si no se inlinearon)
if (!SUPABASE_URL) {
  throw new Error(
    `[NÜA Smart App] Variable de entorno 'NEXT_PUBLIC_SUPABASE_URL' no configurada. ` +
    `Revisa tu archivo .env.local`
  )
}
if (!SUPABASE_ANON_KEY) {
  throw new Error(
    `[NÜA Smart App] Variable de entorno 'NEXT_PUBLIC_SUPABASE_ANON_KEY' no configurada. ` +
    `Revisa tu archivo .env.local`
  )
}

// Variables opcionales
export const AI_API_KEY = process.env.IA_ASSISTANT_SMART_APP || null

// Variable opcional — URL del webhook n8n para el asistente AI
export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || null

// Sentry — configuración opcional para monitoreo de errores
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || null
