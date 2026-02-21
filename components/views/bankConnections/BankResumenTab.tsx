"use client"

import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Building2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Wallet,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Button } from "@/components/ui/button"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency } from "@/lib/utils"
import type { BankAccount, BankConsolidatedBalance, BankConsentInfo, BankTransactionsResult } from "@/types"
import { getBankColor, formatIBAN, formatRelativeTime } from "./constants"

interface BankResumenTabProps {
  consolidated: BankConsolidatedBalance | null
  consentInfo: BankConsentInfo | null
  periodStats: BankTransactionsResult["periodStats"] | null
  loading: boolean
  syncingAccountId: string | null
  onSyncAccount: (accountId: string) => void
  goCardlessAppUrl: string | null
}

export function BankResumenTab({
  consolidated,
  consentInfo,
  periodStats,
  loading,
  syncingAccountId,
  onSyncAccount,
  goCardlessAppUrl,
}: BankResumenTabProps) {
  const totalBalance = consolidated?.totalBalance ?? 0
  const accountCount = consolidated?.accountCount ?? 0
  const monthIncome = periodStats?.totalIncome ?? 0
  const monthExpenses = periodStats?.totalExpenses ?? 0
  const netBalance = periodStats?.netBalance ?? 0
  const daysUntilRenewal = consentInfo?.daysUntilRenewal ?? 90

  const getBalanceColor = (balance: number) => (balance >= 0 ? "#17c3b2" : "#fe6d73")

  return (
    <div className="space-y-6">
      {/* Alerta de renovacion de consentimiento */}
      {daysUntilRenewal <= 15 && (
        <div
          className={`p-4 rounded-xl border-2 flex items-center justify-between ${
            daysUntilRenewal <= 7
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-5 w-5 flex-shrink-0 ${
                daysUntilRenewal <= 7 ? "text-red-500" : "text-amber-500"
              }`}
            />
            <div>
              <p
                className={`font-semibold text-sm ${
                  daysUntilRenewal <= 7 ? "text-red-800" : "text-amber-800"
                }`}
              >
                Consentimiento bancario expira en {daysUntilRenewal} dias
              </p>
              {consentInfo?.nextRenewalBank && (
                <p
                  className={`text-xs mt-0.5 ${
                    daysUntilRenewal <= 7 ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  Proxima renovacion: {consentInfo.nextRenewalBank}
                </p>
              )}
            </div>
          </div>
          {goCardlessAppUrl && (
            <a
              href={`${goCardlessAppUrl}/connect${
                consentInfo?.institutionId ? `?institution=${consentInfo.institutionId}` : ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className={`text-white ${
                  daysUntilRenewal <= 7
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Renovar ahora
              </Button>
            </a>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Saldo Total</p>
              <p className="text-2xl font-bold" style={{ color: getBalanceColor(totalBalance) }}>
                {loading ? "..." : formatCurrency(totalBalance)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {accountCount} cuenta{accountCount !== 1 ? "s" : ""} ·{" "}
                {consolidated?.bankCount || 0} banco{(consolidated?.bankCount || 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
              <Landmark className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
            </div>
          </div>
        </TremorCard>

        {/* Ingresos del Mes */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-[#17c3b2]">
                {loading ? "..." : formatCurrency(monthIncome)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {periodStats?.transactionCount || 0} movimientos
              </p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-[#17c3b2]" />
            </div>
          </div>
        </TremorCard>

        {/* Gastos del Mes */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Gastos del Mes</p>
              <p className="text-2xl font-bold text-[#fe6d73]">
                {loading ? "..." : formatCurrency(monthExpenses)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-red-50">
              <TrendingDown className="h-5 w-5 text-[#fe6d73]" />
            </div>
          </div>
        </TremorCard>

        {/* Balance Neto */}
        <TremorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Balance Neto</p>
              <p className="text-2xl font-bold" style={{ color: getBalanceColor(netBalance) }}>
                {loading ? "..." : formatCurrency(netBalance)}
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${getBalanceColor(netBalance)}15` }}>
              <Wallet className="h-5 w-5" style={{ color: getBalanceColor(netBalance) }} />
            </div>
          </div>
        </TremorCard>
      </div>

      {/* Lista de Cuentas */}
      <TremorCard>
        <div className="flex items-center justify-between mb-4">
          <TremorTitle>Cuentas Conectadas</TremorTitle>
          <span className="text-xs text-slate-400">{accountCount} cuenta{accountCount !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : consolidated?.accounts && consolidated.accounts.length > 0 ? (
          <div className="space-y-3">
            {consolidated.accounts.map((account, idx) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: `${getBankColor(account.institution.name, idx)}15` }}
                  >
                    {account.institution.logo ? (
                      <img
                        src={account.institution.logo}
                        alt={account.institution.name}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<span style="color: ${getBankColor(account.institution.name, idx)}" class="text-xs font-bold">${account.institution.name.substring(0, 2).toUpperCase()}</span>`
                          }
                        }}
                      />
                    ) : (
                      <Building2
                        className="h-5 w-5"
                        style={{ color: getBankColor(account.institution.name, idx) }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{account.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500">{account.institution.name}</p>
                      {account.iban && (
                        <span className="text-xs text-slate-400 font-mono">{formatIBAN(account.iban)}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Sync: {formatRelativeTime(account.last_sync)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: getBalanceColor(account.balance) }}
                  >
                    {formatCurrency(account.balance)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={syncingAccountId === account.id || !goCardlessAppUrl}
                    onClick={() => onSyncAccount(account.id)}
                    title={goCardlessAppUrl ? "Sincronizar cuenta" : "URL de GoCardless no configurada"}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 text-slate-400 ${
                        syncingAccountId === account.id ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="mt-2 pt-3 border-t border-slate-200 flex items-center justify-between px-3">
              <p className="text-sm font-medium text-slate-600">Total</p>
              <p className="text-base font-bold" style={{ color: getBalanceColor(totalBalance) }}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No hay cuentas conectadas</p>
            {goCardlessAppUrl && (
              <a href={goCardlessAppUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="mt-3 text-white" style={{ backgroundColor: BRAND_COLORS.primary }}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Conectar banco
                </Button>
              </a>
            )}
          </div>
        )}
      </TremorCard>

      {/* Info sobre GoCardless */}
      <TremorCard className="bg-slate-50 border-dashed">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-600">
            <p className="font-medium mb-1">Conexion segura via GoCardless Open Banking</p>
            <p className="text-slate-500">
              Los datos bancarios se sincronizan automaticamente. El consentimiento bancario se renueva cada 90 dias.
            </p>
          </div>
        </div>
      </TremorCard>
    </div>
  )
}
