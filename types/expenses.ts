// --- EXPENSE TYPES ---

export interface ExpenseStats {
  total: number
  paid: number
  overdue: number
  pending: number
  by_category: Record<string, number> // Key: Category Name, Value: Amount
}

export interface Invoice {
  id: string
  provider: string
  amount: number
  dueDate: string // ISO Date string
  category: string
}

// NEW: Issued Invoice for Facturacion Page
export interface IssuedInvoice {
  id: string
  ticketNumber: string
  date: string // ISO string including time
  amount: number
  table: string
  paymentMethod: "Tarjeta" | "Efectivo" | "Otros"
  status: "paid" | "refunded"
  verifactuStatus: "success" | "error" | "pending"
  verifactuHash?: string // Mock hash
}

export interface ExpenseTag {
  tag_name: string
  num_gastos: number
}

export interface ExpenseTagInfo {
  name: string
  normalized_name: string
}

export interface Expense {
  id: string
  cuentica_id: number
  fecha: string
  mes: string
  document_number: string
  status: "partial" | "pending" | "overdue"
  total_amount: number
  base_amount: number
  tax_amount: number
  due_date: string | null
  categoria_codigo: string
  categoria_nombre: string
  grupo_categoria: string
  proveedor: string
  tags: ExpenseTagInfo[]
}

export interface ExpenseTagSummary {
  tag_name: string
  num_facturas: number
  total: number
  pagado: number
  pendiente: number
}

export interface ExpenseProviderSummary {
  proveedor: string
  num_facturas: number
  total: number
  pagado: number
  pendiente: number
  vencido: number
}
