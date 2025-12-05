"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, Loader2 } from "lucide-react"
import { MovingBorderButton } from "@/components/ui/moving-border-button"
import { ASSISTANT_CHIPS, getAssistantContext, type AssistantContext } from "@/lib/assistantContext"
import { BRAND_COLORS } from "@/constants"

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
  const [context, setContext] = useState<AssistantContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Obtener chips según la página actual
  const chips = ASSISTANT_CHIPS[currentPath] || ASSISTANT_CHIPS["/"]

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Cargar contexto cuando se abre el asistente
  useEffect(() => {
    if (isOpen) {
      loadContext()
    }
  }, [isOpen, currentPath])

  const loadContext = async () => {
    try {
      const ctx = await getAssistantContext(currentPath)
      setContext(ctx)
    } catch (error) {
      console.error("Error loading context:", error)
    }
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          context: context,
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
      {/* Botón flotante con efecto MovingBorder */}
      <div className="fixed bottom-6 right-6 z-50">
        <MovingBorderButton
          borderRadius="1rem"
          containerClassName="h-14 w-14"
          className="cursor-pointer hover:scale-105 transition-transform"
          duration={3000}
          onClick={() => setIsOpen(true)}
        >
          <Sparkles className="h-6 w-6 text-[#02b1c4]" />
        </MovingBorderButton>
      </div>

      {/* Panel del chat */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel deslizante */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: `${BRAND_COLORS.primary}30` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
                  >
                    <Sparkles className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">NÜA Smart Assistant</h2>
                    <p className="text-xs text-slate-500">
                      {context?.pageName ? `En ${context.pageName}` : "Cargando..."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Chips de sugerencias */}
              {messages.length === 0 && (
                <div className="p-4 border-b border-slate-100">
                  <p className="text-sm text-slate-500 mb-3">Sugerencias rápidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleChipClick(chip)}
                        className="px-3 py-1.5 rounded-full text-sm border transition-all hover:scale-105"
                        style={{
                          borderColor: BRAND_COLORS.primary,
                          color: BRAND_COLORS.primary,
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 mt-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>¡Hola! Soy NÜA, tu asistente inteligente.</p>
                    <p className="text-sm mt-2">Pregúntame sobre tus datos o selecciona una sugerencia.</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.role === "user" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
                      }`}
                      style={message.role === "assistant" ? { backgroundColor: `${BRAND_COLORS.primary}10` } : {}}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: `${BRAND_COLORS.primary}10` }}>
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND_COLORS.primary }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{
                      focusRing: BRAND_COLORS.primary,
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                    style={{ backgroundColor: BRAND_COLORS.primary }}
                  >
                    <Send className="h-5 w-5" />
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
