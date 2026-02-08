import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Verifica que la petición tiene una sesión válida de Supabase.
 * Extrae el token del header Authorization: Bearer <token>
 */
export async function verifyAuth(req: NextRequest): Promise<{
  authenticated: boolean
  userId?: string
  email?: string
  error?: string
}> {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Token de autenticación requerido' }
  }

  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { authenticated: false, error: 'Sesión inválida o expirada' }
  }

  // Verificar dominio permitido
  if (!user.email?.endsWith('@nuasmartrestaurant.com')) {
    return { authenticated: false, error: 'Dominio de email no autorizado' }
  }

  return { authenticated: true, userId: user.id, email: user.email }
}

/**
 * Helper para crear respuestas de error de autenticación
 */
export function unauthorizedResponse(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}
