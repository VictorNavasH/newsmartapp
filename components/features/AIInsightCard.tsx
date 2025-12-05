"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { generateInsight } from "../../lib/gemini"

interface Props {
  context: string
  data: any
}

export const AIInsightCard: React.FC<Props> = ({ context, data }) => {
  const [insight, setInsight] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchInsight = async () => {
      if (!data) return
      setLoading(true)
      const result = await generateInsight(context, data)
      setInsight(result)
      setLoading(false)
    }

    if (data) {
      fetchInsight()
    }
  }, [data, context])

  return (
    // Light Mode: White gradient to very light indigo, subtle border
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-[#02b1c4]/5 border border-[#02b1c4]/20 p-6 shadow-sm">
      {/* Background Glow - Light Mode */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#02b1c4]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none opacity-50" />

      <div className="flex items-center gap-2 mb-3 relative z-10">
        <Sparkles size={18} className="text-[#02b1c4] animate-pulse" />
        <h3 className="text-sm font-bold text-[#364f6b] uppercase tracking-wider">NÜA AI Assistant</h3>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse relative z-10">
          <div className="h-4 bg-[#02b1c4]/10 rounded w-3/4"></div>
          <div className="h-4 bg-[#02b1c4]/10 rounded w-1/2"></div>
        </div>
      ) : (
        <p className="text-slate-600 text-sm leading-relaxed font-medium relative z-10">{insight}</p>
      )}
    </div>
  )
}
