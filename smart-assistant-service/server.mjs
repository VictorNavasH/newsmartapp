// Servicio del Smart Assistant de NÜA.
//
// Expone POST /chat. Recibe { message, sessionId, userEmail } y responde { output }.
// Internamente usa el Claude Agent SDK (Claude Code) autenticado con la SUSCRIPCIÓN
// (CLAUDE_CODE_OAUTH_TOKEN, generado con `claude setup-token`). El agente consulta la
// base de datos de Supabase en SOLO LECTURA mediante un MCP de Postgres.
//
// La Smart App (Vercel) llama a este servicio desde app/api/chat/route.ts.

import express from "express"
import { query } from "@anthropic-ai/claude-agent-sdk"

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

Tienes acceso de SOLO LECTURA a la base de datos PostgreSQL del restaurante (Supabase) a través de la herramienta de consulta MCP. Úsala para responder con datos reales.

Reglas:
- Consulta la base de datos antes de responder cualquier pregunta sobre cifras, ventas, personal, reservas, gastos, etc. NUNCA inventes datos.
- Solo lectura: jamás intentes INSERT, UPDATE, DELETE ni DDL.
- Responde en español, claro, conciso y orientado a negocio.
- Si una consulta devuelve mucho dato, resume lo relevante.
- Si no encuentras el dato o la pregunta es ambigua, dilo claramente y pide precisión.
- Hay vistas útiles que empiezan por v_ y vw_ (ventas, food cost, ocupación, personal/Connecteam, compras, tesorería). Explóralas con el esquema si lo necesitas.`

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
