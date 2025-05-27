import { useBankData } from "@/hooks/use-bank-data"
import { BankAccountsOverview } from "./bank-accounts-overview"
import { BankTransactionsTable } from "./bank-transactions-table"

interface BankContentProps {
  bankName: string
}

export function BankContent({ bankName }: BankContentProps) {
  const { accounts, transactions, metrics, loading, error } = useBankData(bankName)

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 text-center">
        <h3 className="text-[14px] font-medium text-nua-title mb-2">Error al cargar datos</h3>
        <p className="text-[12px] text-red-600">{error}</p>
      </div>
    )
  }

  if (bankName === "Pool") {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 text-center">
        <h3 className="text-[14px] font-medium text-nua-title mb-2">Pool Bancario</h3>
        <p className="text-[12px] text-nua-dark">Vista consolidada de todos los bancos aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BankAccountsOverview accounts={accounts} metrics={metrics} loading={loading} />
      <BankTransactionsTable transactions={transactions} loading={loading} />
    </div>
  )
}
