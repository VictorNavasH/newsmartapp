"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Building2, Database, Copy } from "lucide-react"
import { getInstitutions, getAccounts, getBankingTablesSQL } from "@/app/actions/banking"

interface Institution {
  id: string
  name: string
  bic: string
  logo?: string
  countries: string[]
}

interface Account {
  id: string
  institution_id: string
  name: string
  iban: string
  currency: string
  balance: number
  status: string
}

export function BancosConfig() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showSQL, setShowSQL] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Reemplazar la función getInstitutions en el componente BancosConfig
  const loadData = async () => {
    setLoading(true)
    try {
      const [institutionsResult, accountsResult] = await Promise.all([getInstitutions(), getAccounts()])

      if (institutionsResult.success) {
        // Filtrar solo los bancos españoles principales
        const spanishBanks = institutionsResult.data.filter(
          (inst) =>
            inst.countries?.includes("ES") ||
            ["CaixaBank", "BBVA", "Santander", "Sabadell", "Bankinter"].some((bank) =>
              inst.name.toLowerCase().includes(bank.toLowerCase()),
            ),
        )

        setInstitutions(spanishBanks)
        setNeedsSetup(institutionsResult.needsSetup || false)
      } else {
        setMessage({ type: "error", text: institutionsResult.error || "Error loading institutions" })
        setNeedsSetup(true)
      }

      if (accountsResult.success) {
        setAccounts(accountsResult.data)
      } else {
        setMessage({ type: "error", text: accountsResult.error || "Error loading accounts" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error loading data" })
      setNeedsSetup(true)
    } finally {
      setLoading(false)
    }
  }

  const handleShowSQL = () => {
    setShowSQL(!showSQL)
  }

  const handleCopySQL = () => {
    navigator.clipboard.writeText(getBankingTablesSQL())
    setMessage({ type: "success", text: "SQL script copied to clipboard" })
  }

  const handleSyncInstitutions = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const response = await fetch("/api/banking/sync-institutions", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: `${result.count} institutions synced successfully` })
        setNeedsSetup(false)
        await loadData()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to sync institutions" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" })
    } finally {
      setSyncing(false)
    }
  }

  const handleConnectBank = async (institutionId: string) => {
    setConnecting(institutionId)
    setMessage(null)

    try {
      const response = await fetch("/api/banking/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ institutionId }),
      })

      const result = await response.json()

      if (result.success && result.authUrl) {
        window.open(result.authUrl, "_blank")
        setMessage({
          type: "success",
          text: "Redirecting to bank for authorization. Complete the process in the new window.",
        })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to connect bank" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" })
    } finally {
      setConnecting(null)
    }
  }

  const getConnectedAccounts = (institutionId: string) => {
    return accounts.filter((account) => account.institution_id === institutionId)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-nua-primary" />
        <span className="ml-2 text-[12px] text-nua-dark">Loading banking data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-medium text-nua-title">Bank Connections</h3>
          <p className="text-[12px] text-nua-subtitle">Connect to Spanish banks via GoCardless</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleShowSQL} size="sm" variant="outline" className="text-[11px]">
            <Database className="w-3 h-3 mr-2" />
            {showSQL ? "Hide SQL" : "Show SQL"}
          </Button>
          <Button
            onClick={handleSyncInstitutions}
            disabled={syncing}
            size="sm"
            className="text-[11px] bg-gradient-to-r from-[#17c3b2] to-[#1EADB8] hover:from-[#1EADB8] hover:to-[#17c3b2] text-white border-0"
          >
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
      </div>

      {/* SQL Script */}
      {showSQL && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px] text-nua-title">Database Setup</CardTitle>
              <Button onClick={handleCopySQL} size="sm" variant="outline" className="text-[11px]">
                <Copy className="w-3 h-3 mr-2" />
                Copy SQL
              </Button>
            </div>
            <CardDescription className="text-[12px] text-nua-subtitle">
              Run this SQL script in your Supabase SQL Editor to create the required tables
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <pre className="text-[10px] bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
              {getBankingTablesSQL()}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Setup Required */}
      {needsSetup && institutions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Database className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-[12px] text-orange-600 font-medium">Database Setup Required</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Please create the banking tables first. Click "Show SQL" above and run the script in Supabase.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts Summary */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] text-nua-title flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Connected Accounts ({accounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden mr-3">
                      {institutions.find((i) => i.id === account.institution_id)?.logo ? (
                        <img
                          src={institutions.find((i) => i.id === account.institution_id)?.logo || "/placeholder.svg"}
                          alt="Bank logo"
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Crect x='3' y='8' width='18' height='12' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M19 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2'%3E%3C/path%3E%3Cline x1='12' y1='12' x2='12' y2='16'%3E%3C/line%3E%3Cline x1='8' y1='12' x2='8' y2='16'%3E%3C/line%3E%3Cline x1='16' y1='12' x2='16' y2='16'%3E%3C/line%3E%3C/svg%3E"
                          }}
                        />
                      ) : (
                        <span className="text-sm">🏦</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-nua-title">{account.name}</p>
                      <p className="text-[10px] text-gray-500">
                        ****{account.iban.slice(-4)} • {account.currency}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-nua-title">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    <Badge variant="secondary" className="text-[9px]">
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Banks */}
      {institutions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] text-nua-title">Bancos Disponibles ({institutions.length})</CardTitle>
            <CardDescription className="text-[12px] text-nua-subtitle">
              Conecta con tus bancos para obtener 90 días de movimientos. Solo se muestran los principales bancos
              españoles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {institutions.map((institution) => {
                const connectedAccounts = getConnectedAccounts(institution.id)
                const isConnected = connectedAccounts.length > 0

                return (
                  <div
                    key={institution.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-nua-primary/30 transition-all duration-200 bg-white"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                        {institution.logo ? (
                          <img
                            src={institution.logo || "/placeholder.svg"}
                            alt={`${institution.name} logo`}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Crect x='3' y='8' width='18' height='12' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M19 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2'%3E%3C/path%3E%3Cline x1='12' y1='12' x2='12' y2='16'%3E%3C/line%3E%3Cline x1='8' y1='12' x2='8' y2='16'%3E%3C/line%3E%3Cline x1='16' y1='12' x2='16' y2='16'%3E%3C/line%3E%3C/svg%3E"
                            }}
                          />
                        ) : (
                          <span className="text-lg">🏦</span>
                        )}
                      </div>

                      <div className="min-h-[32px] flex items-center">
                        <span className="text-[11px] font-medium text-nua-title leading-tight">{institution.name}</span>
                      </div>

                      {isConnected && (
                        <Badge variant="secondary" className="text-[9px] px-2 py-0.5">
                          {connectedAccounts.length} cuenta{connectedAccounts.length !== 1 ? "s" : ""}
                        </Badge>
                      )}

                      <Button
                        onClick={() => handleConnectBank(institution.id)}
                        disabled={connecting === institution.id}
                        size="sm"
                        className="w-full h-7 text-[10px] px-2 bg-nua-primary hover:bg-nua-accent text-white"
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
            {institutions.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-[11px] text-yellow-700">
                  <strong>Nota:</strong> No se encontraron bancos españoles. Haz clic en "Sync Banks" para actualizar la
                  lista.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {institutions.length === 0 && !needsSetup && (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-[12px] text-gray-600">No banks available</p>
            <p className="text-[11px] text-gray-500 mt-1">Click "Sync Banks" to load available institutions</p>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
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
