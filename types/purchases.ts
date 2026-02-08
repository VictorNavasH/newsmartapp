// ============================================
// COMPRAS
// ============================================

export interface CompraPedidoItem {
  name: string
  quantityOrdered: number
  quantityReceived: number
  formatOrderedId: number | null
}

export interface CompraPedido {
  id: string
  gstock_supplier_id: string
  proveedor: string
  numero_pedido: string
  fecha_pedido: string
  pedido_subtotal: number
  pedido_iva: number
  pedido_total: number
  pedido_observaciones: string | null
  pedido_items: CompraPedidoItem[] | null
  estado: "pendiente" | "enviado" | "autorizado" | "recepcionado"
  estado_label: string
  estado_color: string
  // Datos del albaran (solo si recepcionado)
  albaran_id: string | null
  albaran_ref: string | null
  albaran_fecha: string | null
  albaran_total: number | null
  importe_coincide: boolean | null
  diferencia_importe: number | null
  albaran_incidencias: string | null
}

export interface CompraFacturaConciliacion {
  id: string
  factura_id: string
  conciliacion_id: string | null
  gstock_supplier_id: string | null
  factura_numero: string
  proveedor: string | null
  proveedor_nif: string | null
  factura_fecha: string
  factura_vencimiento: string | null
  factura_base: number
  factura_iva: number
  factura_total: number
  factura_concepto: string | null
  ia_confianza_pct: number | null
  tipo_conciliacion: string | null
  motivo_revision: string | null
  requiere_revision: boolean
  estado_conciliacion: string | null
  estado_pago: "pagada" | "pendiente" | "parcial" | "abono"
  albaranes_vinculados: string[] | null
  albaranes_candidatos?: number // Cantidad de albaranes candidatos para vincular
}

export interface CompraKPIs {
  // Desde vw_compras_resumen (datos mensuales)
  total_mes_albaranes: number
  total_mes_pedidos: number
  num_albaranes_mes: number
  num_pedidos_mes: number
  total_albaranes: number
  total_pedidos: number
  // Computados desde otras vistas
  pedidos_pendientes: number
  importe_pedidos_pendientes: number
  albaranes_sin_facturar: number
  importe_sin_facturar: number
  facturas_pendientes: number
  importe_facturas_pendientes: number
}

export interface CompraAlbaranDisponible {
  id: string
  numero_albaran: string // Numero del albaran
  proveedor: string // Nombre del proveedor
  fecha: string // Fecha
  importe_total: number // Importe en euros
  gstock_supplier_id: string | null
}

export interface CompraProveedor {
  gstock_supplier_id: string
  nombre: string
  nif: string | null
  num_pedidos: number
  num_albaranes: number
}

// NEW: Tipo ProductFormat para formatos de productos
export interface ProductFormat {
  id: number
  name: string
}

export interface CompraAnalisisKPI {
  total_compras: number
  num_albaranes: number
  ticket_medio: number
  variacion_vs_anterior: number
}

export interface CompraEvolucionMensual {
  mes: string
  mes_label: string
  total: number
  num_albaranes: number
}

export interface CompraDistribucionCategoria {
  categoria: string
  familia: string | null
  tipo: string | null
  total: number
  porcentaje: number
  num_albaranes: number
}

export interface CompraTopProducto {
  producto: string
  formato: string | null
  categoria: string
  familia: string | null
  total: number
  cantidad: number
  num_albaranes: number
}

export interface CompraTablaJerarquica {
  categoria: string
  familia: string | null
  tipo: string | null
  subtipo: string | null
  total_con_iva: number
  total_sin_iva: number
  num_lineas: number
}
