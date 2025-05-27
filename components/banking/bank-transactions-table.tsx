import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import type { BankTransaction } from "@/app/actions/gocardless-actions"

interface BankTransactionsTableProps {
  transactions: BankTransaction[]
  loading: boolean
}

export function BankTransactionsTable({ transactions, loading }: BankTransactionsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="h-4 bg-gray-200 rounded mb-4 w-48"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 text-center">
        <h3 className="text-[14px] font-medium text-nua-title mb-2">Transacciones Recientes</h3>
        <p className="text-[12px] text-gray-500">No hay transacciones disponibles</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <h3 className="text-[14px] font-medium text-nua-title mb-4">Transacciones Recientes</h3>
      <div className="space-y-2">
        {transactions.slice(0, 10).map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.type === "credit" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {transaction.type === "credit" ? (
                  <ArrowDownLeft className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-[12px] font-medium text-nua-title truncate max-w-48">
                  {transaction.description || transaction.merchant || "Transacción"}
                </p>
                <p className="text-[10px] text-gray-500">{formatDate(transaction.date)}</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-[12px] font-medium ${
                  transaction.type === "credit" ? "text-green-600" : "text-red-600"
                }`}
              >
                {transaction.type === "credit" ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount))}
              </p>
              {transaction.category && <p className="text-[9px] text-gray-400">{transaction.category}</p>}
            </div>
          </div>
        ))}
      </div>
      {transactions.length > 10 && (
        <div className="mt-4 text-center">
          <button className="text-[12px] text-nua-primary hover:underline">
            Ver todas las transacciones ({transactions.length})
          </button>
        </div>
      )}
    </div>
  )
}
