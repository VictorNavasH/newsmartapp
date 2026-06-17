// Servicio del Smart Assistant de NÜA.
//
// Expone POST /chat. Recibe { message, sessionId, userEmail } y responde { output }.
// Internamente usa el Claude Agent SDK (Claude Code) autenticado con la SUSCRIPCIÓN
// (CLAUDE_CODE_OAUTH_TOKEN, generado con `claude setup-token`). El agente consulta la
// base de datos de Supabase en SOLO LECTURA mediante un MCP de Postgres.
//
// La Smart App (Vercel) llama a este servicio desde app/api/chat/route.ts.

import express from "express"
import { readFileSync } from "node:fs"
import { query } from "@anthropic-ai/claude-agent-sdk"

// Diccionario de datos (fuente única, compartible con Hermes). Si falta, el agente
// funciona igual pero sin mapa (más lento).
let DATA_DICTIONARY = ""
try {
  DATA_DICTIONARY = readFileSync(new URL("./data-dictionary.md", import.meta.url), "utf8")
} catch {
  console.warn("[asistente] No se encontró data-dictionary.md — el agente irá sin mapa de datos.")
}

const PORT = process.env.PORT || 8645
const MODEL = process.env.ASSISTANT_MODEL || "claude-sonnet-4-6"
const SHARED_SECRET = process.env.ASSISTANT_SHARED_SECRET || null
const DB_URL = process.env.SUPABASE_DB_URL // cadena de conexión Postgres de Supabase (solo lectura)

if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
  console.error("[asistente] FALTA CLAUDE_CODE_OAUTH_TOKEN. Genera uno con `claude setup-token`.")
}
if (!DB_URL) {
  console.error("[asistente] FALTA SUPABASE_DB_URL (cadena de conexión Postgres de Supabase).")
}

const SYSTEM_PROMPT = `Eres el asistente interno de NÜA Smart Restaurant. Respondes a Víctor (gerente) preguntas sobre los datos del restaurante.

Tienes acceso de SOLO LECTURA a la base de datos PostgreSQL (Supabase) vía la herramienta de consulta MCP. Úsala para responder con datos reales.

## REGLAS
- Consulta la BD antes de responder cualquier cifra (ventas, personal, reservas, gastos…). NUNCA inventes datos.
- Solo lectura: jamás INSERT/UPDATE/DELETE/DDL.
- Responde en español, claro, conciso y orientado a negocio.
- VELOCIDAD: usa el DICCIONARIO DE DATOS de abajo para ir DIRECTO a la vista correcta. NO listes todas las tablas ni explores a ciegas — hay 150+ tablas. Solo mira el esquema de una vista concreta si te falta una columna.
- Zona horaria Europe/Madrid. "Hoy" = CURRENT_DATE, "ayer" = CURRENT_DATE - 1.

## ESTILO DE RESPUESTA (MUY IMPORTANTE)
- Habla como en una **conversación de chat normal**: natural, cercano y directo. NADA de tablas.
- **PROHIBIDO usar tablas markdown** (nada de \`| col | col |\` ni \`|---|\`): la app no las pinta y se ven feas.
- Da el dato principal en la primera frase. Si hay varias cifras, intégralas en la frase o usa como mucho una lista corta con guiones.
- Sé breve: 1-3 frases suele bastar. Puedes usar **negrita** para la cifra clave. Sin relleno ni preámbulos.
- Ejemplo BUENO: "Ayer (martes 16) facturasteis **408,82 €** con 16 comensales (~25,6 €/cabeza), un 3 % por encima de la previsión. 👍"

${DATA_DICTIONARY || "(diccionario de datos no disponible; explora el esquema con cuidado)"}`

const app = express()
app.use(express.json({ limit: "1mb" }))

app.get("/health", (_req, res) => res.json({ ok: true, model: MODEL }))

app.post("/chat", async (req, res) => {
  // Autenticación por secreto compartido
  if (SHARED_SECRET) {
    const auth = req.get("authorization") || ""
    if (auth !== `Bearer ${SHARED_SECRET}`) {
      return res.status(401).json({ error: "No autorizado" })
    }
  }

  const message = req.body?.message
  if (!message || typeof message !== "string") {
    return res.status(400).json({ output: "No se recibió ningún mensaje." })
  }

  console.log(`[asistente] pregunta de ${req.body?.userEmail || "?"}: ${message.slice(0, 120)}`)

  try {
    let result = ""
    for await (const m of query({
      prompt: message,
      options: {
        model: MODEL,
        systemPrompt: SYSTEM_PROMPT,
        // MCP de Postgres en solo lectura apuntando a Supabase
        mcpServers: {
          db: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-postgres", DB_URL],
          },
        },
        // Solo permitimos la herramienta de consulta del MCP. El agente NO tiene
        // Bash/Write/Edit ni acceso a internet.
        allowedTools: ["mcp__db__query"],
        disallowedTools: ["Bash", "Write", "Edit", "WebFetch", "WebSearch"],
        maxTurns: 12,
      },
    })) {
      if (m.type === "result" && m.subtype === "success") {
        result = m.result
      }
    }
    res.json({ output: result || "No pude obtener una respuesta." })
  } catch (err) {
    console.error("[asistente] error:", err)
    res.status(500).json({ output: "Hubo un error consultando los datos. Inténtalo de nuevo." })
  }
})

app.listen(PORT, () => console.log(`[asistente] NÜA Smart Assistant escuchando en :${PORT} (modelo ${MODEL})`))
