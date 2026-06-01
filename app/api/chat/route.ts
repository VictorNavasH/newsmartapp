import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth, unauthorizedResponse } from "@/lib/apiAuth"
import { checkRateLimit } from "@/lib/rateLimit"
import { routeAndExecuteQuery } from "@/lib/modelRouter"

export async function POST(request: NextRequest) {
  // 1. Verificar autenticación
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!)
  }

  // 2. Verificar rate limit (20 peticiones por minuto para el chat inteligente)
  const rateLimit = checkRateLimit(`chat:${auth.email}`, {
    maxRequests: 20,
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

  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ response: "No se recibió ningún mensaje." }, { status: 400 })
    }

    // 3. Ejecutar el enrutador inteligente de modelos (Model Router)
    // El router clasifica semánticamente la pregunta y llama de forma optimizada
    // a Gemini Flash, Claude Sonnet o Gemini Pro, según coste y complejidad.
    const result = await routeAndExecuteQuery(message)

    // 4. Retornar respuesta unificada con metadatos del modelo utilizado
    return NextResponse.json({
      response: result.response,
      modelUsed: result.modelUsed,
      category: result.category
    })
  } catch (error: unknown) {
    console.error("[NÜA Chat Endpoint] Critical error:", error)

    return NextResponse.json(
      { response: "Hubo un error al procesar tu consulta con el asistente inteligente. Por favor, intenta de nuevo." },
      { status: 500 },
    )
  }
}
