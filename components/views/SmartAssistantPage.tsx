"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Send,
  Sparkles,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Calendar,
  DollarSign,
  Clock,
  Receipt,
  ShoppingBag,
  Wallet,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BRAND_COLORS } from "@/constants"
import { ASSISTANT_CHIPS, getAssistantContext, type AssistantContext } from "@/lib/assistantContext"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  context?: string
}

// Insights predefinidos que la IA puede generar
const INSIGHT_CATEGORIES = [
  {
    id: "trends",
    icon: TrendingUp,
    label: "Tendencias",
    color: BRAND_COLORS.success,
    prompt: "Analiza las tendencias de mi negocio en la última semana",
  },
  {
    id: "alerts",
    icon: AlertTriangle,
    label: "Alertas",
    color: BRAND_COLORS.error,
    prompt: "¿Hay alguna alerta o anomalía que deba revisar?",
  },
  {
    id: "recommendations",
    icon: Lightbulb,
    label: "Recomendaciones",
    color: BRAND_COLORS.warning,
    prompt: "Dame recomendaciones para mejorar mis métricas",
  },
  {
    id: "summary",
    icon: BarChart3,
    label: "Resumen",
    color: BRAND_COLORS.primary,
    prompt: "Dame un resumen ejecutivo del estado actual del negocio",
  },
]

// Contextos rápidos para análisis
const QUICK_CONTEXTS = [
  { id: "dashboard", icon: BarChart3, label: "Dashboard", path: "/" },
  { id: "reservations", icon: Calendar, label: "Reservas", path: "/reservations" },
  { id: "revenue", icon: DollarSign, label: "Ingresos", path: "/revenue" },
  { id: "expenses", icon: Receipt, label: "Gastos", path: "/expenses" },
  { id: "products", icon: ShoppingBag, label: "Productos", path: "/products" },
  { id: "operations", icon: Clock, label: "Operaciones", path: "/operations" },
  { id: "forecasting", icon: TrendingUp, label: "Forecasting", path: "/forecasting" },
  { id: "treasury", icon: Wallet, label: "Tesorería", path: "/treasury" },
]

export default function SmartAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<AssistantContext | null>(null)
  const [selectedContext, setSelectedContext] = useState("/")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Chips según el contexto seleccionado
  const chips = ASSISTANT_CHIPS[selectedContext] || ASSISTANT_CHIPS["/"]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConversation?.messages])

  useEffect(() => {
    loadContext(selectedContext)
  }, [selectedContext])

  const loadContext = async (path: string) => {
    try {
      const ctx = await getAssistantContext(path)
      setContext(ctx)
    } catch (error) {
      console.error("Error loading context:", error)
    }
  }

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "Nueva conversación",
      messages: [],
      createdAt: new Date(),
      context: selectedContext,
    }
    setConversations((prev) => [newConversation, ...prev])
    setActiveConversation(newConversation)
  }

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversation?.id === id) {
      setActiveConversation(null)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // Si no hay conversación activa, crear una nueva
    if (!activeConversation) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
        context: selectedContext,
      }
      setConversations((prev) => [newConversation, ...prev])
      setActiveConversation(newConversation)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    // Actualizar mensajes
    const updateMessages = (msgs: Message[]) => {
      if (activeConversation) {
        const updated = {
          ...activeConversation,
          messages: msgs,
          title:
            activeConversation.messages.length === 0
              ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
              : activeConversation.title,
        }
        setActiveConversation(updated)
        setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      }
    }

    const currentMessages = activeConversation?.messages || []
    updateMessages([...currentMessages, userMessage])
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

      updateMessages([...currentMessages, userMessage, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Hubo un error conectando con el asistente. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      }
      updateMessages([...currentMessages, userMessage, errorMessage])
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
        subtitle="NÜA - Tu asistente inteligente para análisis de datos"
        icon={Sparkles}
      />

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
        {/* Sidebar - Historial de conversaciones */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Botón nueva conversación */}
          <Button
            onClick={createNewConversation}
            className="w-full justify-start gap-2"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            <Plus className="h-4 w-4" />
            Nueva conversación
          </Button>

          {/* Selector de contexto */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Contexto de análisis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {QUICK_CONTEXTS.map((ctx) => {
                  const Icon = ctx.icon
                  const isSelected = selectedContext === ctx.path
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => setSelectedContext(ctx.path)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${
                        isSelected ? "text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                      style={isSelected ? { backgroundColor: BRAND_COLORS.primary } : {}}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {ctx.label}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lista de conversaciones */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Historial</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 overflow-y-auto max-h-[calc(100%-60px)]">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay conversaciones</p>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        activeConversation?.id === conv.id ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                      onClick={() => setActiveConversation(conv)}
                    >
                      <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-600 truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conv.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                      >
                        <Trash2 className="h-3 w-3 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Área principal de chat */}
        <div className="col-span-6 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Header del chat */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
                </div>
                <div>
                  <CardTitle className="text-base">NÜA</CardTitle>
                  <p className="text-xs text-slate-500">
                    {context?.pageName ? `Analizando: ${context.pageName}` : "Listo para ayudarte"}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* Mensajes */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {(!activeConversation || activeConversation.messages.length === 0) && (
                <div className="text-center py-8">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-20" style={{ color: BRAND_COLORS.primary }} />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">¡Hola! Soy NÜA Smart Assistant</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Tu asistente inteligente para análisis de datos del restaurante.
                    <br />
                    Pregúntame lo que necesites o selecciona una sugerencia.
                  </p>

                  {/* Chips de sugerencias */}
                  <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                    {chips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
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

              {activeConversation?.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      message.role === "user" ? "bg-slate-800 text-white" : "text-slate-800"
                    }`}
                    style={message.role === "assistant" ? { backgroundColor: `${BRAND_COLORS.primary}10` } : {}}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-50">
                      {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: `${BRAND_COLORS.primary}10` }}>
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND_COLORS.primary }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 transition-all text-sm"
                  style={{ "--tw-ring-color": BRAND_COLORS.primary } as React.CSSProperties}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Panel derecho - Insights rápidos */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Categorías de análisis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Análisis rápido</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {INSIGHT_CATEGORIES.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => sendMessage(category.prompt)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-all text-left disabled:opacity-50"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: category.color }} />
                    </div>
                    <span className="text-sm text-slate-700">{category.label}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Info del contexto actual */}
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Datos disponibles</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {context?.data ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-3">{context.summary}</p>
                  <div className="bg-slate-50 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                    <pre className="text-[10px] text-slate-600 whitespace-pre-wrap">
                      {JSON.stringify(context.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContent>
  )
}
