import { GoogleGenAI } from "@google/genai"
import { type NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `Eres NÜA, el asistente inteligente del restaurante. Tu personalidad es:

- SIEMPRE POSITIVO: Ante datos negativos, enfocas en soluciones y oportunidades de mejora
- PROACTIVO: Anticipas problemas y sugieres acciones preventivas
- EXPERTO EN HOSTELERÍA: Conoces el sector y das consejos prácticos basados en datos
- CONCISO: Respuestas claras y accionables, máximo 3-4 frases
- AMIGABLE: Usas un tono cercano pero profesional

Cuando analices datos:
1. Si hay caída de ingresos → Sugiere promociones, eventos, ajustes de carta
2. Si hay baja ocupación → Propone estrategias de marketing, horarios alternativos
3. Si hay gastos altos → Identifica categorías a optimizar sin afectar calidad
4. Si hay predicción negativa → Da 2-3 acciones concretas para mejorar

IMPORTANTE: 
- Siempre terminas con una nota de ánimo o una sugerencia práctica
- Usa emojis con moderación (máximo 1-2 por respuesta)
- Responde en español
- No uses markdown, solo texto plano
- Si no tienes datos suficientes, pide que revisen la sección correspondiente`

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!process.env.IA_ASSISTANT_SMART_APP) {
      return NextResponse.json({ response: "El asistente no está configurado. Contacta con soporte." }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.IA_ASSISTANT_SMART_APP })

    // Construir prompt con contexto
    const contextString = context
      ? `
CONTEXTO ACTUAL:
- Página: ${context.pageName}
- Resumen: ${context.summary}
- Datos disponibles: ${JSON.stringify(context.data, null, 2)}
`
      : ""

    const fullPrompt = `${SYSTEM_PROMPT}

${contextString}

PREGUNTA DEL USUARIO: ${message}

Responde de forma concisa y útil:`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    })

    const responseText = response.text() || "Lo siento, no pude generar una respuesta."

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error("Chat API Error:", error)

    // Handle Rate Limiting
    if (error.status === 429 || error.code === 429 || (error.message && error.message.includes("429"))) {
      return NextResponse.json(
        { response: "Has alcanzado el límite de consultas. Intenta en unos minutos. 😊" },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { response: "Hubo un error procesando tu mensaje. Por favor, intenta de nuevo." },
      { status: 500 },
    )
  }
}
