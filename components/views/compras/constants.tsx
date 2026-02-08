import type React from "react"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export const ESTADO_PEDIDO_CONFIG: Record<string, { label: string }> = {
  pendiente: { label: "Pendiente" },
  enviado: { label: "Enviado" },
  autorizado: { label: "Autorizado" },
  recepcionado: { label: "Recepcionado" },
}

export const ESTADO_CONCILIACION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  auto_conciliado: { label: "Auto", color: "#17c3b2", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  conciliado: { label: "Manual", color: "#17c3b2", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  probable: { label: "Probable", color: "#ffcb77", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  revision: { label: "Revisar", color: "#fe6d73", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  posible_duplicado: { label: "Duplicado?", color: "#fe6d73", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  descartado: { label: "Descartado", color: "#94a3b8", icon: <XCircle className="h-3.5 w-3.5" /> },
}

export const ESTADO_PAGO_CONFIG: Record<string, { label: string; color: string }> = {
  pagada: { label: "Pagada", color: "#17c3b2" },
  parcial: { label: "Parcial", color: "#ffcb77" },
  pendiente: { label: "Pendiente", color: "#fe6d73" },
  abono: { label: "Abono", color: "#02b1c4" },
}

export const CHART_COLORS = ["#02b1c4", "#17c3b2", "#ffcb77", "#fe6d73", "#364f6b", "#94a3b8"]
