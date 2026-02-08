"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, RotateCcw, MessageCircle } from "lucide-react"
import { MovingBorderButton } from "@/components/ui/moving-border-button"
import { ASSISTANT_CHIPS } from "@/lib/assistantChips"
import { BRAND_COLORS } from "@/constants"
import { supabase } from "@/lib/supabase"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface SmartAssistantProps {
  currentPath: string
}

export function SmartAssistant({ currentPath }: SmartAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Obtener chips según la página actual
  const chips = ASSISTANT_CHIPS[currentPath] || ASSISTANT_CHIPS["/"]

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const resetConversation = () => {
    setMessages([])
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

  const handleChipClick = (chip: string) => {
    sendMessage(chip)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <MovingBorderButton
          borderRadius="1rem"
          containerClassName="h-14 w-14"
          className="cursor-pointer hover:scale-105 transition-transform bg-white/70 backdrop-blur-sm"
          duration={3000}
          onClick={() => setIsOpen(true)}
        >
          <Sparkles className="h-6 w-6 text-[#02b1c4]" />
        </MovingBorderButton>
      </div>

      {/* Panel del chat - Integrado */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay sutil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/10 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-6 bottom-24 w-[400px] max-h-[600px] bg-white rounded-2xl shadow-xl border border-slate-200/60 z-50 flex flex-col overflow-hidden"
            >
              {/* Header con gradiente sutil */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_COLORS.primary}08 0%, ${BRAND_COLORS.secondary}05 100%)`,
                  borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%)`,
                    }}
                  >
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800 text-[15px]">NÜA Smart Assistant</h2>
                    <p className="text-xs text-slate-500">Asistente inteligente</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={resetConversation}
                      className="p-2 rounded-lg hover:bg-white/60 transition-colors"
                      title="Nueva conversación"
                    >
                      <RotateCcw className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/60 transition-colors"
                  >
                    <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Chips de sugerencias - más compactos */}
              {messages.length === 0 && (
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Sugerencias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {chips.slice(0, 4).map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleChipClick(chip)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.02] bg-white border border-slate-200 text-slate-600 hover:border-[#02b1c4] hover:text-[#02b1c4] shadow-sm"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[350px]">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div
                      className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${BRAND_COLORS.primary}10` }}
                    >
                      <MessageCircle className="h-8 w-8" style={{ color: BRAND_COLORS.primary }} />
                    </div>
                    <p className="text-slate-600 font-medium">¿En qué puedo ayudarte?</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[250px] mx-auto">
                      Pregúntame sobre ventas, reservas, gastos o cualquier dato de tu restaurante
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.role === "user"
                          ? "bg-slate-800 text-white rounded-br-md"
                          : "bg-slate-100 text-slate-800 rounded-bl-md"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-headings:text-slate-800">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-slate-100 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-[#02b1c4] rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-[#02b1c4] rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-[#02b1c4] rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                      <span className="text-xs text-slate-500 ml-1">Consultando datos...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input - más compacto e integrado */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-slate-50/30">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#02b1c4]/30 focus:border-[#02b1c4] transition-all text-sm placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md active:scale-95"
                    style={{ backgroundColor: BRAND_COLORS.primary }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
