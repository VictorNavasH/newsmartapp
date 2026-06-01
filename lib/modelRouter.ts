import { GoogleGenAI } from "@google/genai"
import { Anthropic } from "@anthropic-ai/sdk"
import { AI_API_KEY, ANTHROPIC_API_KEY } from "./env"
import { classifyQuery } from "./classifierService"

const gemini = new GoogleGenAI({ apiKey: AI_API_KEY || "" })

// Lazy initialize Anthropic SDK only when the key is available
const getAnthropicClient = () => {
  if (!ANTHROPIC_API_KEY) return null
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY })
}

export interface RouterResult {
  response: string;
  modelUsed: string;
  category: string;
}

/**
 * Routes the user's message dynamically to the best-suited model based on semantic classification.
 * Falls back safely to Gemini Flash if Anthropic's API key is missing or if the task is simple.
 */
export async function routeAndExecuteQuery(
  message: string,
  contextData?: any
): Promise<RouterResult> {
  const category = await classifyQuery(message)
  const dataCtx = contextData ? `\n\nContexto del negocio proporcionado:\n${JSON.stringify(contextData, null, 2)}` : ""

  const anthropic = getAnthropicClient()

  // ROUTING RULES
  if (category === "KITCHEN_FAQ") {
    // Highly specific recipe/allergy lookup -> Gemini 2.5 Flash (Instant, cheap, great for QA)
    const prompt = `
      Eres NÜA Smart Assistant, el ayudante de cocina inteligente del restaurante.
      Responde de forma concisa, clara, directa y en español a esta pregunta de cocina.
      Usa el contexto proporcionado si es necesario para dar cantidades exactas, alérgenos o recetas.
      
      Pregunta: ${message}
      ${dataCtx}
    `
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      })
      return {
        response: response.text || "No se pudo generar una respuesta de cocina.",
        modelUsed: "Gemini 2.5 Flash (Kitchen FAQ Tier)",
        category
      }
    } catch (e) {
      console.error("[NÜA Router] Gemini FAQ query failed:", e)
    }
  }

  if (category === "OPERATIONAL" || !anthropic) {
    // Daily metric summaries, weather, or simple chat -> Gemini 2.5 Flash (Operational Tier)
    const prompt = `
      Eres el asistente de operaciones NÜA Smart Assistant de NÜA Smart Restaurant.
      Ayuda al usuario con su consulta sobre las operaciones diarias del restaurante.
      Sé directo, preciso, profesional y amigable en español.
      
      Pregunta: ${message}
      ${dataCtx}
    `
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      })
      return {
        response: response.text || "No se pudo generar una respuesta operativa.",
        modelUsed: "Gemini 2.5 Flash (Operational Tier)",
        category
      }
    } catch (e) {
      console.error("[NÜA Router] Gemini Operational query failed:", e)
    }
  }

  // STRATEGIC and DEVELOPMENT categories default to Claude 3.5 Sonnet (High reasoning, paid tier)
  try {
    const promptMessage = `
      Pregunta del usuario: ${message}
      ${dataCtx}
    `
    const systemPrompt = category === "DEVELOPMENT"
      ? `Eres NÜA Smart Assistant, el ingeniero de software senior y administrador de sistemas del restaurante. Das respuestas de código limpias, explicas qué archivos tocar, sigues las mejores prácticas de Next.js/Supabase y eres extremadamente exacto y conciso.`
      : `Eres NÜA Smart Assistant, el analista financiero y consultor estratégico de dirección de NÜA Smart Restaurant. Tu tarea es analizar métricas, calcular márgenes (food cost, labor cost), encontrar deltas de variación y proponer 2 o 3 recomendaciones tácticas de alta restauración para el restaurante de Víctor.`

    const response = await anthropic!.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: promptMessage }],
    })

    const textContent = response.content[0].type === "text" ? response.content[0].text : ""
    return {
      response: textContent || "No se pudo generar respuesta de Claude.",
      modelUsed: `Claude 3.5 Sonnet (${category === "DEVELOPMENT" ? "Development Tier" : "Strategic Tier"})`,
      category
    }
  } catch (error) {
    console.error(`[NÜA Router] Claude query failed for category ${category}, falling back to Gemini Pro:`, error)
    
    // Resilient Fallback to Gemini 1.5 Pro (which uses the active Google billing)
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-1.5-pro",
        contents: `Eres NÜA Smart Assistant. Actúa como el cerebro de contingencia de alta capacidad. Responde a esta consulta:\n\n${message}\n${dataCtx}`,
      })
      return {
        response: response.text || "Respuesta de contingencia fallida.",
        modelUsed: "Gemini 1.5 Pro (Fallback Strategic Tier)",
        category
      }
    } catch (fallbackErr) {
      console.error("[NÜA Router] Critical fallback to Gemini Pro failed:", fallbackErr)
      return {
        response: "Lo siento, ha habido un problema de comunicación entre mis cerebros de IA. Por favor, intenta de nuevo.",
        modelUsed: "None (Error)",
        category
      }
    }
  }
}
