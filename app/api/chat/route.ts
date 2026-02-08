import { type NextRequest, NextResponse } from "next/server"
import { N8N_WEBHOOK_URL } from "@/lib/env"
import { verifyAuth, unauthorizedResponse } from "@/lib/apiAuth"
import { checkRateLimit } from "@/lib/rateLimit"

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!)
  }

  // Verificar rate limit (10 peticiones por minuto para chat)
  const rateLimit = checkRateLimit(`chat:${auth.email}`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta de nuevo en unos segundos." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateLimit.resetIn / 1000).toString(),
        },
      }
    )
  }

  // Verificar que el webhook está configurado
  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json(
      { response: "El asistente no está configurado. Contacta al administrador." },
      { status: 503 }
    )
  }

  try {
    const { message, sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ response: "No se recibió ningún mensaje." }, { status: 400 })
    }

    // Crear AbortController para timeout de 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response: Response | undefined
    let retries = 0
    const maxRetries = 1

    while (retries <= maxRetries) {
      try {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            sessionId: sessionId || `session_${Date.now()}`,
            userEmail: auth.email,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          break
        }

        // Si no es ok y no hemos agotado reintentos, intentar de nuevo
        if (retries < maxRetries) {
          retries++
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return NextResponse.json(
            { response: "La consulta está tardando demasiado. Por favor, intenta de nuevo." },
            { status: 504 },
          )
        }

        // Si hay error y no hemos agotado reintentos, intentar de nuevo
        if (retries < maxRetries) {
          retries++
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }

        throw fetchError
      }
    }

    const data = await response!.json()

    // n8n devuelve { output: "..." }
    const assistantResponse = data.output || data.response || "No se pudo obtener una respuesta."

    return NextResponse.json({ response: assistantResponse })
  } catch (error: unknown) {
    console.error("Chat API Error:", error)

    return NextResponse.json(
      { response: "Hubo un error conectando con el asistente. Por favor, intenta de nuevo." },
      { status: 500 },
    )
  }
}
