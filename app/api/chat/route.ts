import { type NextRequest, NextResponse } from "next/server"

const N8N_WEBHOOK_URL = "https://n8n.nuasmartrestaurant.com/webhook/nua-assistant-api"

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ response: "No se recibió ningún mensaje." }, { status: 400 })
    }

    // Crear AbortController para timeout de 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response: Response
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId)

        if (fetchError.name === "AbortError") {
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
  } catch (error: any) {
    console.error("Chat API Error:", error)

    return NextResponse.json(
      { response: "Hubo un error conectando con el asistente. Por favor, intenta de nuevo." },
      { status: 500 },
    )
  }
}
