"use client"

import {
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Plus,
} from "lucide-react"
import { TremorTitle } from "@/components/ui/TremorCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TremorCard } from "@/components/ui/TremorCard"
import { BRAND_COLORS } from "@/constants"
import { formatCurrency, formatDateFromString } from "@/lib/utils"
import type {
  CompraFacturaConciliacion,
  CompraAlbaranDisponible,
  CompraProveedor,
} from "@/types"
import { ESTADO_CONCILIACION_CONFIG } from "./constants"

interface ComprasConciliacionTabProps {
  facturas: CompraFacturaConciliacion[]
  albaranesDisponibles: CompraAlbaranDisponible[]
  proveedores: CompraProveedor[]
  estadoConciliacionFilter: string
  setEstadoConciliacionFilter: (v: string) => void
  proveedorConciliacionFilter: string
  setProveedorConciliacionFilter: (v: string) => void
  soloRevision: boolean
  setSoloRevision: (v: boolean) => void
  facturaSeleccionada: CompraFacturaConciliacion | null
  setFacturaSeleccionada: (f: CompraFacturaConciliacion | null) => void
  albaranesSeleccionados: string[]
  toggleAlbaranSeleccion: (id: string) => void
  actionLoading: string | null
  onRefreshFacturas: () => void
  onVincular: () => void
  onConfirmar: (factura: CompraFacturaConciliacion) => void
  onDescartar: (factura: CompraFacturaConciliacion) => void
}

export function ComprasConciliacionTab({
  facturas,
  albaranesDisponibles,
  proveedores,
  estadoConciliacionFilter,
  setEstadoConciliacionFilter,
  proveedorConciliacionFilter,
  setProveedorConciliacionFilter,
  soloRevision,
  setSoloRevision,
  facturaSeleccionada,
  setFacturaSeleccionada,
  albaranesSeleccionados,
  toggleAlbaranSeleccion,
  actionLoading,
  onRefreshFacturas,
  onVincular,
  onConfirmar,
  onDescartar,
}: ComprasConciliacionTabProps) {
  const formatDate = (dateStr: string) => formatDateFromString(dateStr)

  return (
    <>
      {/* Filtros Conciliación */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={estadoConciliacionFilter} onValueChange={setEstadoConciliacionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado Conciliación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="auto_conciliado">Auto-conciliado</SelectItem>
            <SelectItem value="conciliado">Conciliado manual</SelectItem>
            <SelectItem value="probable">Probable</SelectItem>
            <SelectItem value="revision">Requiere revisión</SelectItem>
            <SelectItem value="posible_duplicado">Posible duplicado</SelectItem>
            <SelectItem value="descartado">Descartado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={proveedorConciliacionFilter} onValueChange={setProveedorConciliacionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="todos" value="todos">Todos los proveedores</SelectItem>
            {proveedores.map((p, i) => (
              <SelectItem key={`prov-conc-${p.gstock_supplier_id}-${i}`} value={p.gstock_supplier_id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Checkbox id="soloRevision" checked={soloRevision} onCheckedChange={(c) => setSoloRevision(!!c)} />
          <label htmlFor="soloRevision" className="text-sm text-slate-600 cursor-pointer">
            Solo pendientes de revisión
          </label>
        </div>

        <Button variant="outline" size="icon" onClick={onRefreshFacturas}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Split Panel 70/30 */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4">
        {/* Panel Izquierdo - Facturas */}
        <div className="space-y-4">
          <TremorTitle>Facturas ({facturas.length})</TremorTitle>

          {facturas.length === 0 ? (
            <TremorCard>
              <p className="text-center text-slate-400 py-8">No hay facturas con los filtros seleccionados</p>
            </TremorCard>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {facturas.map((factura, i) => {
                const estadoConc = factura.estado_conciliacion
                  ? ESTADO_CONCILIACION_CONFIG[factura.estado_conciliacion]
                  : null
                const isSelected = facturaSeleccionada?.id === factura.id

                return (
                  <div
                    key={`factura-${factura.id}-${i}`}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${isSelected
                      ? "border-[#227c9d] ring-2 ring-[#227c9d]/20"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                    onClick={() => setFacturaSeleccionada(factura)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {estadoConc && (
                          <Badge
                            style={{ backgroundColor: `${estadoConc.color}15`, color: estadoConc.color }}
                            className="gap-1"
                          >
                            {estadoConc.icon}
                            {estadoConc.label}
                          </Badge>
                        )}
                        {!estadoConc && (
                          <Badge variant="outline" className="text-slate-500">
                            Pendiente
                          </Badge>
                        )}
                        <span className="font-semibold text-slate-800">Factura {factura.factura_numero}</span>
                      </div>
                      {factura.albaranes_candidatos != null && factura.albaranes_candidatos > 0 && (
                        <Badge style={{ backgroundColor: "#02b1c415", color: "#02b1c4" }}>
                          {factura.albaranes_candidatos} albarán{factura.albaranes_candidatos !== 1 ? "es" : ""}
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Proveedor:</span>{" "}
                        <span className="text-slate-800">{factura.proveedor || "Sin proveedor"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">NIF:</span>{" "}
                        <span className="text-slate-800">{factura.proveedor_nif || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fecha:</span>{" "}
                        <span className="text-slate-800">{formatDate(factura.factura_fecha)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Vencimiento:</span>{" "}
                        <span className="text-slate-800">
                          {factura.factura_vencimiento ? formatDate(factura.factura_vencimiento) : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Importes */}
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span>
                        Base: <strong>{formatCurrency(factura.factura_base)}</strong>
                      </span>
                      <span>
                        IVA: <strong>{formatCurrency(factura.factura_iva)}</strong>
                      </span>
                      <span>
                        Total: <strong className="text-lg">{formatCurrency(factura.factura_total)}</strong>
                      </span>
                    </div>

                    {/* Concepto */}
                    {factura.factura_concepto && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{factura.factura_concepto}</p>
                    )}

                    {/* IA Info */}
                    {factura.ia_confianza_pct !== null && (
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <span className="text-slate-500">IA: {factura.ia_confianza_pct}% confianza</span>
                        {factura.tipo_conciliacion && (
                          <span className="text-slate-400">| Tipo: {factura.tipo_conciliacion}</span>
                        )}
                      </div>
                    )}

                    {/* Motivo revisión */}
                    {factura.motivo_revision && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        {factura.motivo_revision}
                      </div>
                    )}

                    {/* Albaranes vinculados */}
                    {factura.albaranes_vinculados && factura.albaranes_vinculados.length > 0 && (
                      <div className="text-sm mb-3">
                        <span className="text-slate-500">Albaranes: </span>
                        {(factura.albaranes_vinculados || []).map((alb: string, idx: number) => (
                          <Badge key={`${factura.id}-alb-${idx}`} variant="outline" className="mr-1">
                            {alb}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {factura.estado_conciliacion === "auto_conciliado" && factura.conciliacion_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            onConfirmar(factura)
                          }}
                          disabled={actionLoading === factura.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}

                      {(!factura.estado_conciliacion ||
                        factura.estado_conciliacion === "revision" ||
                        factura.estado_conciliacion === "probable") ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFacturaSeleccionada(factura)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Vincular Albarán
                        </Button>
                      ) : null}

                      {factura.estado_conciliacion !== "descartado" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDescartar(factura)
                          }}
                          disabled={actionLoading === factura.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Descartar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel Derecho - Albaranes */}
        <div className="space-y-4">
          <TremorTitle>
            Albaranes Disponibles
            {facturaSeleccionada && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({facturaSeleccionada.proveedor || "Sin proveedor"})
              </span>
            )}
          </TremorTitle>

          {!facturaSeleccionada ? (
            <TremorCard>
              <p className="text-center text-slate-400 py-8">Selecciona una factura para ver albaranes</p>
            </TremorCard>
          ) : albaranesDisponibles.length === 0 ? (
            <TremorCard>
              <p className="text-center text-slate-400 py-8">
                No hay albaranes disponibles para este proveedor
              </p>
            </TremorCard>
          ) : (
            <>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {albaranesDisponibles.map((albaran) => {
                  const isAlbSelected = albaranesSeleccionados.includes(albaran.id)

                  return (
                    <div
                      key={albaran.id}
                      className={`bg-white rounded-lg border p-3 cursor-pointer transition-all ${isAlbSelected
                        ? "border-[#17c3b2] bg-[#17c3b2]/5"
                        : "border-slate-200 hover:border-slate-300"
                        }`}
                      onClick={() => toggleAlbaranSeleccion(albaran.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isAlbSelected} />
                          <span className="font-medium text-slate-800">{albaran.numero_albaran}</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(albaran.importe_total)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{formatDate(albaran.fecha)}</div>
                    </div>
                  )
                })}
              </div>

              {albaranesSeleccionados.length > 0 && (
                <Button
                  className="w-full"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                  onClick={onVincular}
                  disabled={actionLoading === "vincular"}
                >
                  {actionLoading === "vincular" ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Vincular {albaranesSeleccionados.length} albarán(es)
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
