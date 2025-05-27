"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://sscrtcxeitwmbhtnwtfk.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function BancosConfig() {
  const [institutions, setInstitutions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [realCount, setRealCount] = useState(0)

  useEffect(() => {
    loadRealData()
  }, [])

  const loadRealData = async () => {
    setLoading(true)
    try {
      // Contar registros REALES en la tabla
      const { count, error: countError } = await supabase
        .from("gocardless_institutions")
        .select("*", { count: "exact", head: true })

      if (countError) {
        console.error("Error contando:", countError)
        setRealCount(0)
      } else {
        setRealCount(count || 0)
      }

      // Obtener datos REALES
      const { data, error } = await supabase.from("gocardless_institutions").select("*").order("name").limit(20)

      if (error) {
        console.error("Error cargando:", error)
        setInstitutions([])
        setMessage({ type: "error", text: `Error: ${error.message}` })
      } else {
        setInstitutions(data || [])
        if (data && data.length === 0) {
          setMessage({ type: "error", text: "No hay bancos en la base de datos. Haz clic en Sincronizar." })
        }
      }
    } catch (error: any) {
      console.error("Error:", error)
      setInstitutions([])
      setRealCount(0)
      setMessage({ type: "error", text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const syncInstitutions = async () => {
    setSyncing(true)
    setMessage({ type: "success", text: "Sincronizando con GoCardless..." })

    try {
      const response = await fetch("/api/gocardless/sync-institutions", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: `✅ ${result.count} bancos sincronizados correctamente` })
        await loadRealData()
      } else {
        setMessage({ type: "error", text: `❌ Error: ${result.error}` })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `❌ Error de red: ${error.message}` })
    } finally {
      setSyncing(false)
    }
  }

  const connectBank = async (bank: any) => {
    setConnecting(bank.id)
    setMessage(null)

    try {
      const response = await fetch("/api/gocardless/connect-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId: bank.id }),
      })

      const result = await response.json()

      if (result.success && result.authUrl) {
        window.open(result.authUrl, "_blank")
        setConnected((prev) => [...prev, bank.id])
        setMessage({ type: "success", text: `✅ ${bank.name} - Ventana abierta para autorización` })
      } else {
        setMessage({ type: "error", text: `❌ Error conectando ${bank.name}: ${result.error}` })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `❌ Error: ${error.message}` })
    } finally {
      setConnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-nua-primary" />
        <span className="ml-2 text-[12px] text-nua-dark">Cargando datos reales...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con contador REAL */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-medium text-nua-title">Conexiones Bancarias</h3>
          <p className="text-[12px] text-nua-subtitle">
            {realCount > 0 ? `${realCount} bancos disponibles en base de datos` : "No hay bancos cargados"}
          </p>
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
              Sincronizar desde GoCardless
            </>
          )}
        </Button>
      </div>

      {/* Estado REAL */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          {realCount > 0 ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-[12px] font-medium text-green-600">
                {realCount} bancos cargados desde GoCardless
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-[12px] font-medium text-red-600">
                No hay bancos en la base de datos. Sincroniza primero.
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Bancos REALES o mensaje */}
      {institutions.length > 0 ? (
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

                {connected.includes(bank.id) && (
                  <div className="text-[9px] text-green-600 font-medium">✓ Conectado</div>
                )}

                <Button
                  onClick={() => connectBank(bank)}
                  disabled={connecting === bank.id || connected.includes(bank.id)}
                  size="sm"
                  className="w-full h-7 text-[10px] px-2"
                  variant={connected.includes(bank.id) ? "secondary" : "default"}
                >
                  {connecting === bank.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Conectando
                    </>
                  ) : connected.includes(bank.id) ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Conectado
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
      ) : (
        <Card className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-[12px] text-gray-600">No hay bancos para mostrar</p>
          <p className="text-[11px] text-gray-500 mt-1">
            Haz clic en "Sincronizar" para cargar bancos desde GoCardless
          </p>
        </Card>
      )}

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

      {/* Debug info */}
      <Card className="p-3 bg-gray-50">
        <p className="text-[10px] text-gray-600">
          Debug: {realCount} registros en gocardless_institutions | {institutions.length} mostrados
        </p>
      </Card>
    </div>
  )
}
