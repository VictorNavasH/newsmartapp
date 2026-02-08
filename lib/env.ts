function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[NÜA Smart App] Variable de entorno '${name}' no configurada. ` +
      `Revisa tu archivo .env.local`
    )
  }
  return value
}

// Variables requeridas
export const SUPABASE_URL = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_ANON_KEY = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Variables opcionales
export const AI_API_KEY = process.env.IA_ASSISTANT_SMART_APP || null
