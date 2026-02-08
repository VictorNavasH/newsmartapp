"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TremorCard } from "@/components/ui/TremorCard"
import { Button } from "@/components/ui/button"
import { Building2, Plus, Check, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"

interface BankConnection {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  status: "connected" | "pending" | "error"
  last_sync: string
}

const BRAND_COLORS = {
  primary: "#02b1c4",
  secondary: "#364f6b",
}

export default function BankConnectionsPage() {
  const [connections, setConnections] = useState<BankConnection[]>([
    {
      id: "1",
      bank_name: "CaixaBank",
      account_name: "Cuenta Principal",
      account_number: "ES12 **** **** **** 4567",
      status: "connected",
      last_sync: "Hace 2 horas",
    },
    {
      id: "2",
      bank_name: "BBVA",
      account_name: "Cuenta Proveedores",
      account_number: "ES98 **** **** **** 1234",
      status: "connected",
      last_sync: "Hace 1 hora",
    },
  ])
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    // Aqui iria la integracion con GoCardless
    setTimeout(() => setIsConnecting(false), 2000)
  }

  const getStatusBadge = (status: BankConnection["status"]) => {
    switch (status) {
      case "connected":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <Check className="h-3 w-3" />
            Conectado
          </span>
        )
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Sincronizando
          </span>
        )
      case "error":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        )
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader icon={Building2} title="Conexiones Bancarias" subtitle="Gestiona tus cuentas bancarias conectadas via Open Banking" />

      {/* Boton para conectar nuevo banco */}
      <TremorCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
              <Building2 className="h-6 w-6" style={{ color: BRAND_COLORS.primary }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Conectar nueva cuenta bancaria</h3>
              <p className="text-sm text-slate-500">
                Usa Open Banking para sincronizar tus movimientos automaticamente
              </p>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            style={{ backgroundColor: BRAND_COLORS.primary }}
            className="text-white hover:opacity-90"
          >
            {isConnecting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            {isConnecting ? "Conectando..." : "Conectar banco"}
          </Button>
        </div>
      </TremorCard>

      {/* Lista de conexiones */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Cuentas conectadas ({connections.length})</h3>

        {connections.map((conn) => (
          <TremorCard key={conn.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{conn.bank_name}</span>
                    {getStatusBadge(conn.status)}
                  </div>
                  <p className="text-sm text-slate-500">{conn.account_name}</p>
                  <p className="text-xs text-slate-400 font-mono">{conn.account_number}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Ultima sincronizacion</p>
                <p className="text-sm text-slate-600">{conn.last_sync}</p>
                <Button variant="ghost" size="sm" className="mt-1 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sincronizar
                </Button>
              </div>
            </div>
          </TremorCard>
        ))}
      </div>

      {/* Info sobre GoCardless */}
      <TremorCard className="p-4 bg-slate-50 border-dashed">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5" />
          <div className="text-sm text-slate-600">
            <p className="font-medium mb-1">Conexion segura via GoCardless</p>
            <p className="text-slate-500">
              Tus credenciales bancarias nunca se almacenan en nuestros servidores. Usamos Open Banking a traves de
              GoCardless para acceder a tus movimientos de forma segura.
            </p>
            <a
              href="https://gocardless.com/bank-account-data/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs hover:underline"
              style={{ color: BRAND_COLORS.primary }}
            >
              Mas informacion sobre Open Banking
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </TremorCard>
    </div>
  )
}
