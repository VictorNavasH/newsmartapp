"use client"

import {
  ArrowUpCircle,
  ArrowDownCircle,
  LayoutGrid,
  AlertCircle,
  Filter,
} from "lucide-react"
import { TremorCard } from "@/components/ui/TremorCard"
import { Button } from "@/components/ui/button"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency } from "@/lib/utils"
import type { TreasuryCategoryBreakdown } from "@/types"
import { getCategoryIcon } from "./constants"

interface TreasuryCategoriaTabProps {
  categoryBreakdown: TreasuryCategoryBreakdown[]
  loading: boolean
  onNavigateToMovimientos: (categoryId: string) => void
  onViewUncategorized: () => void
}

export function TreasuryCategoriaTab({
  categoryBreakdown,
  loading,
  onNavigateToMovimientos,
  onViewUncategorized,
}: TreasuryCategoriaTabProps) {
  if (loading) {
    return <p className="text-slate-400 text-center py-8">Cargando categorias...</p>
  }

  if (categoryBreakdown.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay datos por categoria</p>
  }

  return (
    <div className="space-y-6">
      {/* Resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TremorCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpCircle className="h-5 w-5 text-[#17c3b2]" />
            <span className="text-sm text-slate-500">Total Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-[#17c3b2]">
            {formatCurrency(categoryBreakdown.reduce((sum, cat) => sum + (cat.total_ingresos || 0), 0))}
          </p>
        </TremorCard>
        <TremorCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownCircle className="h-5 w-5 text-[#fe6d73]" />
            <span className="text-sm text-slate-500">Total Gastos</span>
          </div>
          <p className="text-2xl font-bold text-[#fe6d73]">
            {formatCurrency(categoryBreakdown.reduce((sum, cat) => sum + (cat.total_gastos || 0), 0))}
          </p>
        </TremorCard>
        <TremorCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <LayoutGrid className="h-5 w-5 text-[#02b1c4]" />
            <span className="text-sm text-slate-500">Categorias</span>
          </div>
          <p className="text-2xl font-bold text-[#364f6b]">
            {categoryBreakdown.filter((cat) => cat.category_id !== null).length}
          </p>
        </TremorCard>
      </div>

      {/* Grid de categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categoryBreakdown
          .filter((cat) => cat.category_id !== null)
          .sort((a, b) => b.total_gastos + b.total_ingresos - (a.total_gastos + a.total_ingresos))
          .map((cat) => {
            const IconComponent = getCategoryIcon(cat.category_icon)

            return (
              <TremorCard
                key={cat.category_id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigateToMovimientos(cat.category_id || "all")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.category_color || "#94a3b8"}20` }}
                    >
                      <IconComponent className="h-5 w-5" style={{ color: cat.category_color || "#94a3b8" }} />
                    </div>
                    <div>
                      <p className="font-medium text-[#364f6b]">{cat.category_name || "Sin nombre"}</p>
                      <p className="text-xs text-slate-400">{cat.num_transacciones} transacciones</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {cat.total_ingresos > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Ingresos</span>
                      <span className="text-sm font-medium text-[#17c3b2]">
                        +{formatCurrency(cat.total_ingresos)}
                      </span>
                    </div>
                  )}
                  {cat.total_gastos > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Gastos</span>
                      <span className="text-sm font-medium text-[#fe6d73]">
                        -{formatCurrency(cat.total_gastos)}
                      </span>
                    </div>
                  )}
                  {cat.porcentaje_gastos > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">% del gasto total</span>
                        <span className="font-medium text-slate-600">{cat.porcentaje_gastos.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(cat.porcentaje_gastos, 100)}%`,
                            backgroundColor: cat.category_color || "#94a3b8",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TremorCard>
            )
          })}
      </div>

      {/* Sin categorizar */}
      {categoryBreakdown.find((cat) => cat.category_id === null) && (
        <TremorCard className="p-4 border-l-4" style={{ borderLeftColor: BRAND_COLORS.warning }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" style={{ color: BRAND_COLORS.warning }} />
              <div>
                <p className="font-medium text-[#364f6b]">Sin Categorizar</p>
                <p className="text-sm text-slate-500">
                  {categoryBreakdown.find((cat) => cat.category_id === null)?.num_transacciones || 0}{" "}
                  transacciones pendientes
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">
                Gastos:{" "}
                <span className="font-medium text-[#fe6d73]">
                  {formatCurrency(categoryBreakdown.find((cat) => cat.category_id === null)?.total_gastos || 0)}
                </span>
              </p>
              <p className="text-sm text-slate-500">
                Ingresos:{" "}
                <span className="font-medium text-[#17c3b2]">
                  {formatCurrency(
                    categoryBreakdown.find((cat) => cat.category_id === null)?.total_ingresos || 0,
                  )}
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewUncategorized}
              style={{ borderColor: BRAND_COLORS.warning, color: BRAND_COLORS.warning }}
            >
              Ver pendientes
            </Button>
          </div>
        </TremorCard>
      )}
    </div>
  )
}
