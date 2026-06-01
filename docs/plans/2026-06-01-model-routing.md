# NÜA Smart App - Intelligent Model Router Implementation Plan

> **For Hermes:** Use the subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement an intelligent, automated Model Router in the `newsmartapp` backend that classifies user chat queries and routes them dynamically to the most cost-effective and capable LLM model (Gemini Flash for operational metrics, Claude Sonnet for code/strategic tasks).

**Architecture:**
1.  **Classification Layer (`lib/classifierService.ts`):** Uses a lightning-fast, cheap `gemini-2.5-flash` call with structured JSON output to categorize incoming user messages into `OPERATIONAL` (low cost), `STRATEGIC` (medium-high reasoning), or `DEVELOPMENT` (coding context).
2.  **Routing Hub (`lib/modelRouter.ts`):** Consumes the classification and maps it to the corresponding API client (Gemini SDK or Anthropic SDK) using decrypted Vercel environment keys.
3.  **Unified Chat API Integration (`app/api/chat/route.ts`):** Intercepts the POST body and forwards it through the Router instead of blindly hitting n8n, saving major webhook latency and cost.

**Tech Stack:** Next.js Route handlers, Google Gen AI SDK (`@google/genai`), Anthropic SDK (`@anthropic-ai/sdk`), TypeScript, Supabase Auth.

---

## 1. Environment Variable Setup
Verify and expose Anthropic credentials inside the application settings.

### Task 1.1: Map Anthropic API Key
Expose `ANTHROPIC_API_KEY` inside `lib/env.ts` so the system can authenticate Claude requests.

*   **Modify:** `lib/env.ts`
*   **Step 1: Check existing env structure**
    Verify the existing variables in `lib/env.ts` using `read_file`.
*   **Step 2: Add ANTHROPIC_API_KEY**
    Append `export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY` to the env file.
*   **Step 3: Verification**
    Ensure no compilation/linting errors occur in `lib/env.ts`.

---

## 2. Classification Service
Build the core classifier that parses user queries.

### Task 2.1: Create Classifier Engine (`lib/classifierService.ts`)
Implement a structured classifier using Gemini Flash to output categories: `OPERATIONAL`, `STRATEGIC`, or `DEVELOPMENT`.

*   **Create:** `lib/classifierService.ts`
*   **Code Implementation:**
    ```typescript
    import { GoogleGenAI } from "@google/genai"
    import { AI_API_KEY } from "./env"

    export type ModelCategory = "OPERATIONAL" | "STRATEGIC" | "DEVELOPMENT";

    const ai = new GoogleGenAI({ apiKey: AI_API_KEY || "" })

    export async function classifyQuery(message: string): Promise<ModelCategory> {
      if (!AI_API_KEY) return "OPERATIONAL";

      const prompt = `
        Clasifica la siguiente consulta de un usuario para un restaurante inteligente en una de estas 3 categorías:
        1. "OPERATIONAL": Preguntas simples de datos, facturación del día, reservas de hoy/mañana, el clima, platos vendidos, o saludos.
        2. "STRATEGIC": Análisis financiero complejo, optimización de escandallos (food cost), cálculo de rentabilidad, comparativa de meses o predicciones de negocio.
        3. "DEVELOPMENT": Solicitud de cambios de código, modificar base de datos, escribir scripts o reportar bugs del software.

        Consulta: "${message}"

        Responde únicamente con una palabra en mayúsculas: OPERATIONAL, STRATEGIC, o DEVELOPMENT.
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const category = response.text?.trim().toUpperCase();
        if (category === "STRATEGIC" || category === "DEVELOPMENT") {
          return category;
        }
        return "OPERATIONAL";
      } catch (e) {
        console.error("Classification error:", e);
        return "OPERATIONAL"; // Fallback to safe cheap tier
      }
    }
    ```
*   **Verification:** Create a temporary execution test and verify classification results.

---

## 3. Multi-Model Router Hub
Direct queries to either Gemini or Anthropic SDKs depending on category.

### Task 3.1: Create Router Hub (`lib/modelRouter.ts`)
Combine Gemini and Claude integrations. If the category is `OPERATIONAL`, run with `gemini-2.5-flash`. If `STRATEGIC` or `DEVELOPMENT`, route to Anthropic's Claude 3.5 Sonnet.

*   **Create:** `lib/modelRouter.ts`
*   **Code Implementation:**
    ```typescript
    import { GoogleGenAI } from "@google/genai"
    import { Anthropic } from "@anthropic-ai/sdk"
    import { AI_API_KEY, ANTHROPIC_API_KEY } from "./env"
    import { classifyQuery } from "./classifierService"

    const gemini = new GoogleGenAI({ apiKey: AI_API_KEY || "" })
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY || "" })

    export async function routeAndExecuteQuery(message: string, contextData?: any): Promise<{ response: string; modelUsed: string }> {
      const category = await classifyQuery(message);
      const dataCtx = contextData ? `\nContexto actual: ${JSON.stringify(contextData)}` : "";

      if (category === "OPERATIONAL" || !ANTHROPIC_API_KEY) {
        // Route to Gemini Flash (Super cheap and fast)
        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Responde de forma clara y directa como el asistente de NÜA.${dataCtx}\nPregunta: ${message}`,
        });
        return {
          response: response.text || "No response",
          modelUsed: "Gemini 2.5 Flash (Operational)"
        };
      } else {
        // Route to Claude 3.5 Sonnet (High reasoning, paid tier)
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 1500,
          system: `Eres NÜA Smart Assistant, el analista de negocios y consultor estratégico del restaurante. Das respuestas profesionales, detalladas, con métricas exactas y consejos tácticos de alta restauración.${dataCtx}`,
          messages: [{ role: "user", content: message }],
        });
        return {
          response: response.content[0].type === "text" ? response.content[0].text : "No text",
          modelUsed: "Claude 3.5 Sonnet (Strategic/Dev)"
        };
      }
    }
    ```
*   **Verification:** Validate TypeScript compile checks.

---

## 4. API Endpoint Integration
Expose the router inside the unified `/api/chat` route to drive the frontend chatbot.

### Task 4.1: Integrate Router into `/app/api/chat/route.ts`
Replace or augment the n8n webhook forwarder to invoke our direct, intelligent model router when appropriate.

*   **Modify:** `app/api/chat/route.ts`
*   **Step 1: Read Route Logic**
    Map the routing flow in `/app/api/chat/route.ts`.
*   **Step 2: Add Router Execution**
    Import `routeAndExecuteQuery` and execute it for incoming user queries. Keep n8n webhook forwarding as a fallback or specialized action if needed.
*   **Step 3: Symmetrize Response**
    Ensure the returned JSON structure is `{ response: string, modelUsed?: string }` matching the frontend expectations.
