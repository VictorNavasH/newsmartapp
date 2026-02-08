"use client"

import type React from "react"
import {
  PieChartIcon,
  Filter,
  X,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency } from "@/lib/utils"
import type { ExpenseTag, Expense, ExpenseTagSummary } from "@/types"
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Tooltip as RechartsTooltip } from "recharts"
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_COLORS, type StatusFilter } from "./constants"

interface PieChartDataItem {
  name: string
  value: number
  color: string
  fill: string
}

interface ExpensesCategoriaTabProps {
  tags: ExpenseTag[]
  selectedTags: string[]
  toggleTag: (tagName: string) => void
  clearTags: () => void
  loading: boolean
  loadingExpenses: boolean
  statusFilter: StatusFilter
  setStatusFilter: (v: StatusFilter) => void
  pieChartData: PieChartDataItem[]
  summary: ExpenseTagSummary[]
  totals: { total: number; pagado: number; pendiente: number; vencido: number; facturas: number }
  leftCardRef: React.RefObject<HTMLDivElement | null>
  rightCardHeight: number | undefined
  // Detail table
  filteredExpenses: Expense[]
  filteredTotal: number
  hasActiveFilters: boolean
  detailStatusFilter: string
  setDetailStatusFilter: (v: string) => void
  detailCategoryFilter: string
  setDetailCategoryFilter: (v: string) => void
  detailTagFilter: string
  setDetailTagFilter: (v: string) => void
  uniqueCategories: string[]
  uniqueTags: string[]
  sortColumn: "fecha" | "total_amount" | "proveedor" | "due_date"
  sortDirection: "asc" | "desc"
  handleSort: (column: "fecha" | "total_amount" | "proveedor" | "due_date") => void
  expenses: Expense[]
}

export function ExpensesCategoriaTab({
  tags,
  selectedTags,
  toggleTag,
  clearTags,
  loading,
  loadingExpenses,
  statusFilter,
  setStatusFilter,
  pieChartData,
  summary,
  totals,
  leftCardRef,
  rightCardHeight,
  filteredExpenses,
  filteredTotal,
  hasActiveFilters,
  detailStatusFilter,
  setDetailStatusFilter,
  detailCategoryFilter,
  setDetailCategoryFilter,
  detailTagFilter,
  setDetailTagFilter,
  uniqueCategories,
  uniqueTags,
  sortColumn,
  sortDirection,
  handleSort,
  expenses,
}: ExpensesCategoriaTabProps) {
  return (
    <div className="space-y-6">
      {/* Selector de Tags */}
      <TremorCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#17c3b2]" />
            <TremorTitle>Filtrar por Categorías</TremorTitle>
          </div>
          {selectedTags.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearTags} className="text-slate-500 hover:text-slate-700">
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex gap-2 flex-wrap">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.tag_name)
              return (
                <button
                  key={tag.tag_name}
                  onClick={() => toggleTag(tag.tag_name)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    flex items-center gap-2
                    ${isSelected ? "bg-[#17c3b2] text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}
                  `}
                >
                  {tag.tag_name}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}
                  >
                    {tag.num_gastos}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </TremorCard>

      {/* Filtro de Estado */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">Estado:</span>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gráficos de Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={leftCardRef}>
          <TremorCard>
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="h-5 w-5 text-[#17c3b2]" />
              <TremorTitle>Distribución por Categoría</TremorTitle>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      const total = pieChartData.reduce((sum, d) => sum + d.value, 0)
                      const percent = ((data.value / total) * 100).toFixed(1)
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[180px]">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                            <span className="font-medium text-[#364f6b]">{data.name}</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Total gastado:</span>
                              <span className="font-medium text-[#364f6b]">
                                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                  data.value,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">% del total:</span>
                              <span className="font-medium text-[#364f6b]">{percent}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {pieChartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </TremorCard>
        </div>

        <div style={{ height: rightCardHeight ? `${rightCardHeight}px` : "auto" }} className="overflow-hidden">
          <TremorCard className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <Tag className="h-5 w-5 text-[#17c3b2]" />
              <TremorTitle>Resumen por Categoría</TremorTitle>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
              {summary.map((cat, index) => {
                const percentage = totals.total > 0 ? (cat.total / totals.total) * 100 : 0
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                return (
                  <div key={cat.tag_name} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-700">{cat.tag_name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{cat.num_facturas} facturas</span>
                      <span className="text-[#17c3b2]">Pagado: {formatCurrency(cat.pagado)}</span>
                      <span className="text-[#ffcb77]">Pendiente: {formatCurrency(cat.pendiente)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </TremorCard>
        </div>
      </div>

      {/* Tabla de Gastos */}
      <TremorCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#17c3b2]" />
            <TremorTitle>Detalle de Gastos</TremorTitle>
          </div>
          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <span className="text-sm font-medium text-[#02b1c4]">Total: {formatCurrency(filteredTotal)}</span>
            )}
            <span className="text-sm text-slate-500">{filteredExpenses.length} resultados</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Filtros:</span>
          </div>

          <Select value={detailStatusFilter} onValueChange={setDetailStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="partial">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={detailCategoryFilter} onValueChange={setDetailCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={detailTagFilter} onValueChange={setDetailTagFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tags</SelectItem>
              {uniqueTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(detailStatusFilter !== "all" || detailCategoryFilter !== "all" || detailTagFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDetailStatusFilter("all")
                setDetailCategoryFilter("all")
                setDetailTagFilter("all")
              }}
              className="text-slate-500 hover:text-slate-700 h-9"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {loadingExpenses ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        ) : filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th
                    className="text-left p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("fecha")}
                  >
                    <div className="flex items-center gap-1">
                      Fecha
                      {sortColumn === "fecha" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="text-left p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("proveedor")}
                  >
                    <div className="flex items-center gap-1">
                      Proveedor
                      {sortColumn === "proveedor" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-600">Documento</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Categoría</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Tags</th>
                  <th
                    className="text-right p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("total_amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Importe
                      {sortColumn === "total_amount" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="text-left p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("due_date")}
                  >
                    <div className="flex items-center gap-1">
                      Vencimiento
                      {sortColumn === "due_date" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="text-center p-3 font-semibold text-slate-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-700">
                      {new Date(expense.fecha).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{expense.proveedor}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{expense.document_number || "-"}</td>
                    <td className="p-3 text-slate-600">{expense.categoria_nombre}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {expense.tags?.map((tag, index) => {
                          let tagObj: { name: string; normalized_name: string } | null = null
                          if (typeof tag === "string") {
                            try {
                              tagObj = JSON.parse(tag)
                            } catch {
                              tagObj = null
                            }
                          } else if (typeof tag === "object" && tag !== null) {
                            tagObj = tag as { name: string; normalized_name: string }
                          }
                          const tagName = tagObj?.name || String(tag)
                          return (
                            <Badge
                              key={tagObj?.normalized_name || index}
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `${BRAND_COLORS.primary}20`,
                                color: BRAND_COLORS.primary,
                              }}
                            >
                              {tagName}
                            </Badge>
                          )
                        })}
                      </div>
                    </td>
                    <td className="p-3 text-right font-semibold text-[#364f6b]">
                      {formatCurrency(expense.total_amount)}
                    </td>
                    <td className="p-3 text-slate-600">
                      {expense.due_date ? (
                        <span
                          className={
                            new Date(expense.due_date) < new Date() && expense.status !== "partial"
                              ? "text-red-500 font-medium"
                              : ""
                          }
                        >
                          {new Date(expense.due_date).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        style={{
                          backgroundColor: `${STATUS_COLORS[expense.status]}20`,
                          color: STATUS_COLORS[expense.status],
                        }}
                      >
                        {STATUS_LABELS[expense.status] || expense.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay gastos que coincidan con los filtros seleccionados</p>
          </div>
        )}
      </TremorCard>
    </div>
  )
}
