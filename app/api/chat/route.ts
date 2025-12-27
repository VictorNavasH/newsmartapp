import { GoogleGenAI } from "@google/genai"
import { type NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `Eres NÜA Smart Assistant, el asistente inteligente del restaurante. Tu trabajo es ANALIZAR LOS DATOS que recibes y dar insights CONCRETOS.

ESTRUCTURA DE DATOS QUE RECIBES:
- "hoy": métricas del día actual (ventas, tickets, comida/cena, etc.)
- "mes": resumen del mes completo (total facturado, facturas, ticket medio)
- "financiero": comparativa con período anterior (ingresos, gastos, margen, variación %)
- "semana": array con cada día de la semana (facturado real vs prevision)

REGLAS OBLIGATORIAS:
1. SIEMPRE usa los números exactos de los datos que recibes
2. NUNCA digas "no tengo datos" si hay datos en el contexto
3. Si preguntan por HOY, usa datos de "hoy"
4. Si preguntan por el MES, usa datos de "mes" y "financiero"
5. Si preguntan por la SEMANA, usa datos de "semana"
6. Compara con período anterior usando "financiero.ingresos_anterior" y "financiero.variacion_ingresos_pct"

FORMATO DE RESPUESTA:
- Comienza con los datos clave según la pregunta
- Añade comparativa temporal si aplica
- Termina con un insight o recomendación

PERSONALIDAD:
- Positivo y orientado a soluciones
- Experto en hostelería
- Conciso (máximo 6-8 frases)
- Amigable pero profesional
- Usa 1-2 emojis máximo

EJEMPLOS DE BUENAS RESPUESTAS:

Para "¿Cómo vamos hoy?":
"Hoy llevas 3.689€ de facturación con 37 tickets, un ticket medio de 99,71€. La comida representa 2.400€ (25 tickets) y la cena 1.289€ (12 tickets). El 87% de las ventas son con tarjeta. Has alcanzado el 115% de la previsión del día. ¡Excelente ritmo! 📈"

Para "¿Qué tal el mes?":
"En diciembre llevas 41.241€ facturados en 450 facturas, con ticket medio de 91,65€. Comparado con noviembre, los ingresos han crecido un 6,2%. El margen actual es del 16,2%. Vas por buen camino para cerrar un mes sólido. 💪"

Para "¿Cómo va la semana?":
"Esta semana llevas facturados 15.230€. El mejor día fue el viernes con 4.200€, superando la previsión en un 18%. El lunes fue más flojo con 2.100€ (-12% vs previsión). Recomiendo reforzar promociones de inicio de semana."

IMPORTANTE: Responde en español. No uses markdown, solo texto plano.`

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!process.env.IA_ASSISTANT_SMART_APP) {
      return NextResponse.json({ response: "El asistente no está configurado. Contacta con soporte." }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.IA_ASSISTANT_SMART_APP })

    let contextString = ""
    if (context && context.data) {
      contextString = `
DATOS DISPONIBLES PARA ANALIZAR:
================================
Sección: ${context.pageName || "Dashboard"}
Fecha de los datos: ${context.data.fecha || new Date().toISOString().split("T")[0]}
Resumen: ${context.summary || "Datos del restaurante"}

MÉTRICAS:
${JSON.stringify(context.data, null, 2)}
================================

INSTRUCCIÓN: Usa ESTOS DATOS para responder. Menciona números específicos del JSON anterior.
`
    }

    const fullPrompt = `${SYSTEM_PROMPT}

${contextString}

PREGUNTA DEL USUARIO: ${message}

RESPUESTA (usa los datos de arriba):`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    })

    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta."

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error("Chat API Error:", error)

    if (error.status === 429 || error.code === 429 || (error.message && error.message.includes("429"))) {
      return NextResponse.json(
        { response: "Has alcanzado el límite de consultas. Intenta en unos minutos." },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { response: "Hubo un error procesando tu mensaje. Por favor, intenta de nuevo." },
      { status: 500 },
    )
  }
}
