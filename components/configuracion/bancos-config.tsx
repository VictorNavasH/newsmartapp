"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sscrtcxeitwmbhtnwtfk.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "tu_anon_key"
const supabase = createClient(supabaseUrl, supabaseKey)

export function BancosConfig() {
  const [institutions, setInstitutions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadInstitutions()
  }, [])

  const loadInstitutions = async () => {
    try {
      const { data, error } = await supabase.from("gocardless_institutions").select("*").order("name")

      if (error) {
        console.error("Error loading institutions:", error)
        // Si no hay datos, usar bancos españoles comunes
        setInstitutions([
          { id: "BBVA_BBVAESMM", name: "BBVA", bic: "BBVAESMM" },
          { id: "CAIXABANK_CAIXESBB", name: "CaixaBank", bic: "CAIXESBB" },
          { id: "SABADELL_BSABESBB", name: "Banco Sabadell", bic: "BSABESBB" },
          { id: "SANTANDER_BSCHESMM", name: "Banco Santander", bic: "BSCHESMM" },
          { id: "BANKINTER_BKBKESMM", name: "Bankinter", bic: "BKBKESMM" },
          { id: "ING_INGDESMM", name: "ING", bic: "INGDESMM" },
          { id: "OPENBANK_OPENESMM", name: "Openbank", bic: "OPENESMM" },
          { id: "UNICAJA_UCJAES2M", name: "Unicaja", bic: "UCJAES2M" },
        ])
      } else {
        setInstitutions(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setInstitutions([])
    } finally {
      setLoading(false)
    }
  }

  const syncInstitutions = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const response = await fetch("/api/gocardless/sync-institutions", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: `${result.count} bancos sincronizados` })
        await loadInstitutions()
      } else {
        setMessage({ type: "error", text: result.error || "Error sincronizando" })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setSyncing(false)
    }
  }

  const connectBank = async (institutionId: string) => {
    setConnecting(institutionId)
    setMessage(null)

    try {
      const response = await fetch("/api/gocardless/connect-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId }),
      })

      const result = await response.json()

      if (result.success && result.authUrl) {
        window.open(result.authUrl, "_blank")
        setMessage({ type: "success", text: "Redirigiendo al banco..." })
      } else {
        setMessage({ type: "error", text: result.error || "Error conectando" })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setConnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-nua-primary" />
        <span className="ml-2 text-[12px] text-nua-dark">Cargando bancos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-medium text-nua-title">Conexiones Bancarias</h3>
          <p className="text-[12px] text-nua-subtitle">Conecta con bancos españoles via GoCardless</p>
        </div>
        <Button onClick={syncInstitutions} disabled={syncing} size="sm" className="text-[11px]">
          {syncing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3 mr-2" />
              Sincronizar
            </>
          )}
        </Button>
      </div>

      {/* Bancos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {institutions.map((bank) => (
          <Card key={bank.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 bg-nua-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg">🏦</span>
              </div>

              <div className="min-h-[32px] flex items-center">
                <span className="text-[11px] font-medium text-nua-title leading-tight">{bank.name}</span>
              </div>

              <Button
                onClick={() => connectBank(bank.id)}
                disabled={connecting === bank.id}
                size="sm"
                className="w-full h-7 text-[10px] px-2"
              >
                {connecting === bank.id ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Conectando
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Conectar
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Mensaje */}
      {message && (
        <div
          className={`
          p-3 rounded-lg flex items-center space-x-2
          ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
        `}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-[12px]">{message.text}</span>
        </div>
      )}
    </div>
  )
}
