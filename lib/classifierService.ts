import { GoogleGenAI } from "@google/genai"
import { AI_API_KEY } from "./env"

export type ModelCategory = "OPERATIONAL" | "STRATEGIC" | "DEVELOPMENT" | "KITCHEN_FAQ";

const ai = new GoogleGenAI({ apiKey: AI_API_KEY || "" })

/**
 * Classifies an incoming user query into one of four distinct business categories
 * to optimize token usage, reasoning depth, and operational costs.
 */
export async function classifyQuery(message: string): Promise<ModelCategory> {
  if (!AI_API_KEY) {
    return "OPERATIONAL"
  }

  const prompt = `
    Actúa como el clasificador semántico de NÜA Smart Restaurant.
    Tu tarea es clasificar la siguiente consulta de un usuario en una de estas 4 categorías operativas:

    1. "KITCHEN_FAQ": Preguntas rápidas de cocina sobre recetas, ingredientes, alérgenos o cantidades específicas. (Ej: "¿Qué lleva el bao de calamar?", "¿Cuánta sal lleva la base de hummus?", "¿Tiene gluten el crujiente?").
    2. "OPERATIONAL": Preguntas del día a día sobre facturación de hoy, comensales sentados, reservas, el clima, ocupación de mesas o saludos sencillos. (Ej: "¿Cuánto llevamos facturado hoy?", "¿Cuántas mesas hay reservadas para cenar?", "Hola, ¿qué tal?").
    3. "STRATEGIC": Análisis financieros profundos, comparativas mensuales/anuales de ventas, análisis de rentabilidad (P&L), optimización de costes de personal (labor cost) o costes de comida (food cost). (Ej: "Hazme un informe del labor cost de este mes", "Compara la facturación de mayo con abril", "¿Cómo influye el tiempo en nuestras ventas?").
    4. "DEVELOPMENT": Solicitudes de modificación de código, errores en la web, actualizar base de datos, crear scripts o tareas técnicas de programación. (Ej: "Corrige el botón de exportación", "Escribe una migración de base de datos").

    Consulta: "${message}"

    Responde ÚNICAMENTE con una sola palabra en mayúsculas, que sea uno de estos valores: KITCHEN_FAQ, OPERATIONAL, STRATEGIC o DEVELOPMENT.
  `

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    const category = response.text?.trim().toUpperCase() as ModelCategory
    const validCategories: ModelCategory[] = ["KITCHEN_FAQ", "OPERATIONAL", "STRATEGIC", "DEVELOPMENT"]
    
    if (validCategories.includes(category)) {
      return category
    }
    return "OPERATIONAL" // Safe default
  } catch (error) {
    console.error("[NÜA Classifier] Error during query classification:", error)
    return "OPERATIONAL" // Fallback to operational tier
  }
}
