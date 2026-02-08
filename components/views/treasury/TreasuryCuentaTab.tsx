"use client"

import { Building2, Filter } from "lucide-react"
import { TremorCard } from "@/components/ui/TremorCard"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { TreasuryAccount } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TreasuryCuentaTabProps {
  accounts: TreasuryAccount[]
  loading: boolean
  onViewAccountMovements: (accountId: string) => void
}

export function TreasuryCuentaTab({
  accounts,
  loading,
  onViewAccountMovements,
}: TreasuryCuentaTabProps) {
  if (loading) {
    return <p className="text-slate-400 text-center py-8">Cargando cuentas...</p>
  }

  if ((accounts?.length || 0) === 0) {
    return <p className="text-slate-400 text-center py-8">No hay cuentas configuradas</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <TremorCard key={account.id}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {account.bank_logo ? (
                  <img
                    src={account.bank_logo || "/placeholder.svg"}
                    alt={account.bank_name}
                    className="h-12 w-12 object-contain rounded-lg"
                  />
                ) : (
                  <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">{account.bank_name}</p>
                  <p className="text-sm text-slate-500">{account.account_name}</p>
                  <p className="text-xs text-slate-400 font-mono">{account.iban}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(account.balance)}</p>
                {account.last_sync && (
                  <p className="text-xs text-slate-400 mt-1">
                    Ultima sync: {format(new Date(account.last_sync), "dd MMM HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => onViewAccountMovements(account.id)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Ver movimientos
              </Button>
            </div>
          </TremorCard>
        ))}
      </div>
    </div>
  )
}
