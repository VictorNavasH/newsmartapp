"use client"

import { useState, useMemo } from "react"
import {
  Building2,
  Search,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Link2,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BRAND_COLORS } from "@/constants"
import type { BankConnectState, BankInstitution, BankConnectedAccount } from "@/types"

interface BankConnectSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: BankConnectState
  onSelectInstitution: (institution: BankInstitution) => void
  onManualComplete: () => void
  onRetry: () => void
  onClose: () => void
}

export function BankConnectSheet({
  open,
  onOpenChange,
  state,
  onSelectInstitution,
  onManualComplete,
  onRetry,
  onClose,
}: BankConnectSheetProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredInstitutions = useMemo(() => {
    if (!searchQuery.trim()) return state.institutions
    const q = searchQuery.toLowerCase()
    return state.institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(q) ||
        inst.bic.toLowerCase().includes(q)
    )
  }, [state.institutions, searchQuery])

  const handleClose = () => {
    setSearchQuery("")
    onClose()
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    }
    onOpenChange(isOpen)
  }

  const getStepTitle = (): string => {
    switch (state.step) {
      case "selecting":
        return "Conectar banco"
      case "creating":
        return "Preparando conexion"
      case "redirecting":
        return "Autorizar acceso"
      case "processing":
        return "Procesando autorizacion"
      case "fetching":
        return "Obteniendo cuentas"
      case "syncing":
        return "Sincronizando datos"
      case "success":
        return "Conexion completada"
      case "error":
        return "Error de conexion"
      default:
        return "Conectar banco"
    }
  }

  const getStepDescription = (): string => {
    switch (state.step) {
      case "selecting":
        return "Selecciona tu entidad bancaria"
      case "creating":
        return "Creando solicitud de acceso..."
      case "redirecting":
        return "Completa la autorizacion en la web de tu banco"
      case "processing":
        return "Verificando el estado de la autorizacion..."
      case "fetching":
        return "Recuperando informacion de las cuentas..."
      case "syncing":
        return "Sincronizando transacciones..."
      case "success":
        return "Tus cuentas se han conectado correctamente"
      case "error":
        return state.error || "Ha ocurrido un error"
      default:
        return ""
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
            {getStepTitle()}
          </SheetTitle>
          <SheetDescription>{getStepDescription()}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 flex-1">
          {/* STEP: Selecting institution */}
          {state.step === "selecting" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar banco..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {state.institutions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Cargando instituciones...</p>
                </div>
              ) : filteredInstitutions.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No se encontraron bancos</p>
                  <p className="text-xs text-slate-400 mt-1">Intenta con otro termino de busqueda</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredInstitutions.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => onSelectInstitution(inst)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-[#02b1c4] hover:bg-[#02b1c4]/5 transition-all cursor-pointer text-center group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden group-hover:bg-white transition-colors">
                        {inst.logo_url ? (
                          <img
                            src={inst.logo_url}
                            alt={inst.name}
                            className="w-9 h-9 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `<span class="text-sm font-bold text-slate-400">${inst.name.substring(0, 2).toUpperCase()}</span>`
                              }
                            }}
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-700 leading-tight line-clamp-2">
                        {inst.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: Creating requisition */}
          {state.step === "creating" && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_COLORS.primary }} />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Preparando conexion con{" "}
                <span className="font-medium text-slate-700">
                  {state.selectedInstitution?.name || "el banco"}
                </span>
                ...
              </p>
            </div>
          )}

          {/* STEP: Redirecting to bank auth */}
          {state.step === "redirecting" && (
            <div className="space-y-6 py-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#02b1c4]/10 flex items-center justify-center mb-4">
                  <ExternalLink className="h-8 w-8" style={{ color: BRAND_COLORS.primary }} />
                </div>
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Se ha abierto una nueva ventana para que autorices el acceso a tu cuenta en{" "}
                  <span className="font-semibold">{state.selectedInstitution?.name}</span>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-slate-700">Instrucciones:</p>
                <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
                  <li>Inicia sesion en tu banco</li>
                  <li>Autoriza el acceso a tus cuentas</li>
                  <li>Seras redirigido de vuelta automaticamente</li>
                </ol>
              </div>

              {state.authLink && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 text-center">
                    Si la ventana no se abrio, haz clic aqui:
                  </p>
                  <a
                    href={state.authLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Abrir pagina de autorizacion
                    </Button>
                  </a>
                </div>
              )}

              <Button
                onClick={onManualComplete}
                className="w-full text-white"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Ya he completado la autorizacion
              </Button>
            </div>
          )}

          {/* STEPS: Processing / Fetching / Syncing */}
          {(state.step === "processing" ||
            state.step === "fetching" ||
            state.step === "syncing") && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center mb-4">
                <RefreshCw className="h-8 w-8 animate-spin" style={{ color: BRAND_COLORS.primary }} />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {state.step === "processing" && "Verificando autorizacion..."}
                {state.step === "fetching" && "Obteniendo cuentas..."}
                {state.step === "syncing" && "Sincronizando transacciones..."}
              </p>
              <p className="text-xs text-slate-400">Esto puede tardar unos segundos</p>

              {/* Progress indicator */}
              <div className="flex items-center gap-2 mt-6">
                {["processing", "fetching", "syncing"].map((s, i) => {
                  const steps = ["processing", "fetching", "syncing"]
                  const currentIdx = steps.indexOf(state.step)
                  const isActive = i === currentIdx
                  const isDone = i < currentIdx

                  return (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${
                        isDone
                          ? "w-8 bg-[#02b1c4]"
                          : isActive
                          ? "w-8 bg-[#02b1c4]/50"
                          : "w-4 bg-slate-200"
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP: Success */}
          {state.step === "success" && (
            <div className="space-y-6 py-6">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-base font-semibold text-slate-800 mb-1">
                  Conexion exitosa
                </p>
                <p className="text-sm text-slate-500">
                  {state.connectedAccounts.length} cuenta
                  {state.connectedAccounts.length !== 1 ? "s" : ""} conectada
                  {state.connectedAccounts.length !== 1 ? "s" : ""}
                </p>
              </div>

              {state.connectedAccounts.length > 0 && (
                <div className="space-y-2">
                  {state.connectedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{acc.name}</p>
                        {acc.iban && (
                          <p className="text-xs text-slate-400 font-mono">
                            {acc.iban.replace(/(.{4})/g, "$1 ").trim()}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: acc.currency || "EUR",
                        }).format(acc.balance)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full text-white"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                Cerrar
              </Button>
            </div>
          )}

          {/* STEP: Error */}
          {state.step === "error" && (
            <div className="space-y-6 py-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-base font-semibold text-slate-800 mb-1">
                  Error de conexion
                </p>
                <p className="text-sm text-slate-500 text-center">
                  {state.error || "No se pudo completar la conexion con el banco"}
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={onRetry}
                  className="w-full text-white"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
