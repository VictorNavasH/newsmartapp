"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Sparkles, RotateCcw } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { Button } from "@/components/ui/button"
import { BRAND_COLORS } from "@/constants"
import { ASSISTANT_CHIPS } from "@/lib/assistantChips"
import { supabase } from "@/lib/supabase"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function SmartAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chips = ASSISTANT_CHIPS["/"]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const startNewConversation = () => {
    setMessages([])
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Obtener token de sesión para autenticación
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          message: content,
          sessionId,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Lo siento, no pude procesar tu mensaje.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Hubo un error conectando con el asistente. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <PageContent>
      <PageHeader
        title="Smart Assistant"
        subtitle="Tu asistente inteligente con acceso a todos tus datos"
        icon={Sparkles}
      />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header integrado */}
          <div
            className="px-6 py-4 border-b border-slate-100"
            style={{
              background: `linear-gradient(135deg, ${BRAND_COLORS.primary}08 0%, ${BRAND_COLORS.secondary}05 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%)`,
                  }}
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">NÜA Smart Assistant</h2>
                  <p className="text-xs text-slate-500">Acceso directo a tu base de datos</p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewConversation}
                  className="gap-2 bg-white/80 hover:bg-white border-slate-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Nueva conversación
                </Button>
              )}
            </div>
          </div>

          {/* Area de mensajes */}
          <div className="h-[calc(100vh-340px)] overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div
                  className="h-20 w-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ backgroundColor: `${BRAND_COLORS.primary}10` }}
                >
                  <Sparkles className="h-10 w-10" style={{ color: BRAND_COLORS.primary, opacity: 0.6 }} />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Hola, soy NÜA Smart Assistant</h3>
                <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                  Tu asistente inteligente con acceso directo a todos los datos de tu restaurante. Puedo consultar
                  ventas, reservas, gastos, productos y mucho más.
                </p>

                {/* Chips de sugerencias */}
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="px-4 py-2 rounded-full text-sm border-2 transition-all hover:scale-105 hover:shadow-md bg-white"
                      style={{
                        borderColor: `${BRAND_COLORS.primary}40`,
                        color: BRAND_COLORS.primary,
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === "user" ? "text-white" : "bg-white border border-slate-100 text-slate-800"
                  }`}
                  style={
                    message.role === "user"
                      ? {
                          background: `linear-gradient(135deg, ${BRAND_COLORS.dark} 0%, ${BRAND_COLORS.secondary} 100%)`,
                        }
                      : {}
                  }
                >
                  {message.role === "assistant" ? (
                    <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:text-slate-800">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className={`text-[10px] mt-1.5 ${message.role === "user" ? "text-white/60" : "text-slate-400"}`}>
                    {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: BRAND_COLORS.primary, animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: BRAND_COLORS.primary, animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: BRAND_COLORS.primary, animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">Consultando datos...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input integrado */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm bg-slate-50"
                style={{ "--tw-ring-color": `${BRAND_COLORS.primary}40` } as React.CSSProperties}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 rounded-xl shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageContent>
  )
}
