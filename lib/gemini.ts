import { GoogleGenAI } from "@google/genai"

export const generateInsight = async (contextName: string, data: any): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Configura tu API_KEY para obtener insights de IA."
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })

    // Compact data for token efficiency
    const dataString = JSON.stringify(data, null, 2)

    const prompt = `
      Actúa como un experto analista de datos para un restaurante de alta cocina.
      Analiza los siguientes datos de la sección: ${contextName}.
      
      Datos JSON:
      ${dataString}
      
      Tu tarea:
      1. Identifica un patrón clave, anomalía o tendencia positiva/negativa.
      2. Dame una recomendación accionable corta.
      
      Restricciones:
      - Responde SOLO con texto plano.
      - Máximo 2 frases.
      - Sé directo y profesional pero moderno.
      - No uses markdown.
    `

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    return response.text() || "No se pudieron generar insights en este momento."
  } catch (error: any) {
    console.error("Gemini Error:", error)

    // Handle Rate Limiting / Quota Exceeded
    if (
      error.status === 429 ||
      error.code === 429 ||
      error?.response?.status === 429 ||
      (error.message &&
        (error.message.includes("429") ||
          error.message.includes("quota") ||
          error.message.includes("RESOURCE_EXHAUSTED")))
    ) {
      return "Has alcanzado el límite de consultas de IA. Por favor intenta más tarde."
    }

    return "Error conectando con el asistente de IA."
  }
}
