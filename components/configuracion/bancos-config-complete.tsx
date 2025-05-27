"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Database } from "lucide-react"
import {
  syncInstitutionsToSupabase,
  getInstitutionsFromSupabase,
  createBankConnection,
  getBankAccountsFromSupabase,
} from "@/app/actions/gocardless-complete"

export function BancosConfigComplete() {
  const [institutions, setInstitutions] = useState<any[]>([])
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar instituciones desde Supabase
      const institutionsResult = await getInstitutionsFromSupabase()
      if (institutionsResult.success && institutionsResult.data) {
        setInstitutions(institutionsResult.data)
      }

      // Cargar cuentas conectadas
      const accountsResult = await getBankAccountsFromSupabase()
      if (accountsResult.success && accountsResult.data) {
        setConnectedAccounts(accountsResult.data)
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncInstitutions = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const result = await syncInstitutionsToSupabase()
      if (result.success) {
        setMessage({ type: "success", text: `${result.count} bancos sincronizados en Supabase` })
        await loadData()
      } else {
        setMessage({ type: "error", text: result.error || "Error sincronizando" })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setSyncing(false)
    }
  }

  const handleConnectBank = async (institutionId: string) => {
    setConnecting(institutionId)
    setMessage(null)

    try {
      const result = await createBankConnection(institutionId)

      if (result.success && result.authUrl) {
        window.open(result.authUrl, "_blank")
        setMessage({
          type: "success",
          text: "Redirigiendo al banco. Completa la autorización en la nueva ventana.",
        })
      } else {
        setMessage({ type: "error", text: result.error || "Error conectando banco" })
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
        <span className="ml-2 text-[12px] text-nua-dark">Cargando datos desde Supabase...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sincronización */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] text-nua-title">Sincronización con GoCardless</CardTitle>
          <CardDescription className="text-[12px] text-nua-subtitle">
            Sincroniza la lista de bancos disponibles en Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-nua-primary" />
              <span className="text-[12px] text-nua-dark">{institutions.length} bancos en Supabase</span>
            </div>
            <Button onClick={handleSyncInstitutions} disabled={syncing} size="sm" className="text-[11px]">
              {syncing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Sincronizar Bancos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cuentas Conectadas */}
      {connectedAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] text-nua-title">Cuentas Conectadas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="text-[12px] font-medium text-nua-title">{account.account_name}</span>
                    <p className="text-[10px] text-gray-500">
                      ****{account.iban?.slice(-4)} • {account.currency}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-bold text-nua-title">
                      {new Intl.NumberFormat("es-ES", { style: "currency", currency: account.currency }).format(
                        account.balance,
                      )}
                    </span>
                    <p className="text-[9px] text-gray-400">{new Date(account.last_sync).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bancos Disponibles */}
      {institutions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] text-nua-title">Bancos Disponibles</CardTitle>
            <CardDescription className="text-[12px] text-nua-subtitle">
              Conecta con bancos españoles disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {institutions.slice(0, 16).map((institution) => {
                const isConnected = connectedAccounts.some((acc) => acc.institution_id === institution.id)

                return (
                  <div
                    key={institution.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-nua-primary/30 transition-all duration-200 bg-white"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">🏦</span>
                      </div>

                      <div className="min-h-[32px] flex items-center">
                        <span className="text-[11px] font-medium text-nua-title leading-tight">{institution.name}</span>
                      </div>

                      {isConnected && (
                        <Badge variant="secondary" className="text-[9px] px-2 py-0.5">
                          Conectado
                        </Badge>
                      )}

                      <Button
                        onClick={() => handleConnectBank(institution.id)}
                        disabled={connecting === institution.id || isConnected}
                        size="sm"
                        className="w-full h-7 text-[10px] px-2"
                        variant={isConnected ? "secondary" : "default"}
                      >
                        {connecting === institution.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Conectando
                          </>
                        ) : isConnected ? (
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
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensajes */}
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
