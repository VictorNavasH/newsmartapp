"use client"

import {
  Search,
  Building2,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Sparkles,
  User,
  Download,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency } from "@/lib/utils"
import type {
  TreasuryTransaction,
  TreasuryTransactionsSummary,
  TreasuryAccount,
  TreasuryCategory,
} from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PAGE_SIZE, TIPO_LABELS, type TipoFilter, formatIBAN, getTransactionDescription } from "./constants"

interface TreasuryMovimientosTabProps {
  transactions: TreasuryTransaction[]
  transactionsSummary: TreasuryTransactionsSummary | null
  accounts: TreasuryAccount[]
  flattenedCategories: { id: string; name: string; parentId?: string }[]
  loading: boolean
  loadingTransactions: boolean
  searchTerm: string
  setSearchTerm: (v: string) => void
  accountFilter: string
  setAccountFilter: (v: string) => void
  categoryFilter: string
  setCategoryFilter: (v: string) => void
  tipoFilter: TipoFilter
  setTipoFilter: (v: TipoFilter) => void
  hasActiveFilters: boolean
  clearFilters: () => void
  page: number
  setPage: (fn: (p: number) => number) => void
  totalPages: number
  totalCount: number
  onCategoryUpdate: (transactionId: string, categoryId: string, subcategoryId?: string) => void
}

export function TreasuryMovimientosTab({
  transactions,
  transactionsSummary,
  accounts,
  flattenedCategories,
  loading,
  loadingTransactions,
  searchTerm,
  setSearchTerm,
  accountFilter,
  setAccountFilter,
  categoryFilter,
  setCategoryFilter,
  tipoFilter,
  setTipoFilter,
  hasActiveFilters,
  clearFilters,
  page,
  setPage,
  totalPages,
  totalCount,
  onCategoryUpdate,
}: TreasuryMovimientosTabProps) {
  return (
    <div className="space-y-6">
      <TremorCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TremorTitle>Movimientos</TremorTitle>

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
              <SelectTrigger className="h-9 w-[150px]">
                <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.bank_name} {formatIBAN(account.iban)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Categoria */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {flattenedCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
              <SelectTrigger className="h-9 w-[150px]">
                <ChevronDown className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([key, label]) => (
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

        {/* Resumen filtrado */}
        {transactionsSummary && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Transacciones:</span>
              <span className="font-medium">{transactionsSummary.num_transacciones}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Ingresos:</span>
              <span className="font-medium" style={{ color: BRAND_COLORS.success }}>
                {formatCurrency(transactionsSummary.total_ingresos)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Gastos:</span>
              <span className="font-medium" style={{ color: BRAND_COLORS.error }}>
                {formatCurrency(transactionsSummary.total_gastos)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Balance:</span>
              <span
                className="font-medium"
                style={{
                  color:
                    transactionsSummary.total_ingresos - transactionsSummary.total_gastos >= 0
                      ? BRAND_COLORS.success
                      : BRAND_COLORS.error,
                }}
              >
                {formatCurrency(transactionsSummary.total_ingresos - transactionsSummary.total_gastos)}
              </span>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div id="transactions-table" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-500">Fecha</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Cuenta</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Descripcion</th>
                <th className="text-left py-3 px-2 font-medium text-slate-500">Categoria</th>
                <th className="text-right py-3 px-2 font-medium text-slate-500">Importe</th>
              </tr>
            </thead>
            <tbody>
              {loadingTransactions ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : (transactions?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No hay movimientos en el periodo seleccionado
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <span className="text-slate-600">
                        {format(new Date(tx.booking_date), "dd MMM yyyy", { locale: es })}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {tx.bank_logo ? (
                          <img
                            src={tx.bank_logo || "/placeholder.svg"}
                            alt={tx.bank_name}
                            className="h-6 w-6 object-contain rounded"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-slate-400" />
                        )}
                        <span className="text-sm">{tx.account_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 max-w-[300px]">
                      {(() => {
                        const desc = getTransactionDescription(tx)
                        return (
                          <div>
                            <p className="truncate text-[#364f6b]">{desc.main}</p>
                            {desc.secondary && <p className="text-xs text-slate-400 truncate">{desc.secondary}</p>}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={tx.subcategory_id || tx.category_id || undefined}
                          onValueChange={(value) => {
                            const cat = flattenedCategories.find((c) => c.id === value)
                            if (cat) {
                              onCategoryUpdate(tx.id, cat.parentId || cat.id, cat.parentId ? cat.id : undefined)
                            }
                          }}
                        >
                          <SelectTrigger
                            className="h-7 w-[150px] text-xs"
                            style={
                              !tx.category_name
                                ? { borderColor: BRAND_COLORS.warning, color: BRAND_COLORS.warning }
                                : tx.categorization_method === "rule"
                                  ? { borderColor: BRAND_COLORS.primary }
                                  : tx.categorization_method === "ai"
                                    ? { borderColor: BRAND_COLORS.warning }
                                    : { borderColor: "#e2e8f0" }
                            }
                          >
                            <SelectValue placeholder="Categorizar">
                              {tx.category_name ? (
                                <span className="truncate">
                                  {tx.category_name}
                                  {tx.subcategory_name && ` / ${tx.subcategory_name}`}
                                </span>
                              ) : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {flattenedCategories.length > 0 ? (
                              flattenedCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                  {cat.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled className="text-xs text-slate-400">
                                No hay categorias
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {tx.category_name && tx.categorization_method && (
                          <span title={`Categorizada: ${tx.categorization_method}`}>
                            {tx.categorization_method === "rule" && (
                              <Wand2 className="h-3.5 w-3.5 text-[#02b1c4]" />
                            )}
                            {tx.categorization_method === "ai" && (
                              <Sparkles className="h-3.5 w-3.5 text-[#ffcb77]" />
                            )}
                            {tx.categorization_method === "manual" && (
                              <User className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            {tx.categorization_method === "imported" && (
                              <Download className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span style={{ color: tx.amount >= 0 ? BRAND_COLORS.success : BRAND_COLORS.error }}>
                        {tx.amount >= 0 ? "+" : ""}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
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
