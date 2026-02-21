"use client"

import {
  Search,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency } from "@/lib/utils"
import type { BankTransaction, BankAccount, BankTransactionsResult } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PAGE_SIZE, TYPE_LABELS, type TransactionTypeFilter, getBankColor, formatIBAN } from "./constants"

interface BankMovimientosTabProps {
  transactions: BankTransaction[]
  accounts: BankAccount[]
  periodStats: BankTransactionsResult["periodStats"] | null
  loading: boolean
  searchTerm: string
  setSearchTerm: (v: string) => void
  accountFilter: string
  setAccountFilter: (v: string) => void
  typeFilter: TransactionTypeFilter
  setTypeFilter: (v: TransactionTypeFilter) => void
  hasActiveFilters: boolean
  clearFilters: () => void
  page: number
  setPage: (fn: (p: number) => number) => void
  totalPages: number
  totalCount: number
}

export function BankMovimientosTab({
  transactions,
  accounts,
  periodStats,
  loading,
  searchTerm,
  setSearchTerm,
  accountFilter,
  setAccountFilter,
  typeFilter,
  setTypeFilter,
  hasActiveFilters,
  clearFilters,
  page,
  setPage,
  totalPages,
  totalCount,
}: BankMovimientosTabProps) {
  return (
    <div className="space-y-6">
      <TremorCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TremorTitle>Movimientos Bancarios</TremorTitle>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Busqueda */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-[180px]"
              />
            </div>

            {/* Cuenta */}
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="h-9 w-[170px]">
                <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                {accounts.map((account, idx) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getBankColor(account.institution.name, idx) }}
                      />
                      <span className="truncate">
                        {account.institution.name}
                        {account.iban ? ` ${formatIBAN(account.iban)}` : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionTypeFilter)}>
              <SelectTrigger className="h-9 w-[140px]">
                <ChevronDown className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Resumen del periodo */}
        {periodStats && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Transacciones:</span>
              <span className="font-medium">{periodStats.transactionCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Ingresos:</span>
              <span className="font-medium text-[#17c3b2]">
                {formatCurrency(periodStats.totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Gastos:</span>
              <span className="font-medium text-[#fe6d73]">
                {formatCurrency(periodStats.totalExpenses)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Balance:</span>
              <span
                className="font-medium"
                style={{ color: periodStats.netBalance >= 0 ? "#17c3b2" : "#fe6d73" }}
              >
                {formatCurrency(periodStats.netBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-500">Fecha</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Cuenta</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Descripcion</th>
                <th className="text-right py-3 px-2 font-medium text-slate-500">Importe</th>
                <th className="text-right py-3 px-2 font-medium text-slate-500">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No hay movimientos
                    {hasActiveFilters ? " con los filtros seleccionados" : ""}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <span className="text-slate-600">
                        {format(new Date(tx.date), "dd MMM yyyy", { locale: es })}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {tx.institution_logo ? (
                          <img
                            src={tx.institution_logo}
                            alt={tx.institution_name}
                            className="h-5 w-5 object-contain rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-slate-400" />
                        )}
                        <span className="text-sm text-slate-600 truncate max-w-[120px]">
                          {tx.account_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 max-w-[300px]">
                      <div className="flex items-center gap-2">
                        {tx.type === "credit" ? (
                          <ArrowDownLeft className="h-4 w-4 text-[#17c3b2] flex-shrink-0" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-[#fe6d73] flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[#364f6b]">{tx.description}</p>
                          {(tx.creditor_name || tx.debtor_name) && (
                            <p className="text-xs text-slate-400 truncate">
                              {tx.type === "credit" ? tx.debtor_name : tx.creditor_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className="font-medium"
                        style={{ color: tx.amount >= 0 ? "#17c3b2" : "#fe6d73" }}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-slate-500">
                        {tx.balance_after !== 0 ? formatCurrency(tx.balance_after) : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacion */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} de{" "}
              {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-slate-600 px-2">
                Pagina {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </TremorCard>
    </div>
  )
}
