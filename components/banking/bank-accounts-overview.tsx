import StarBorder from "@/components/ui/star-border"
import { ArrowUp, ArrowDown, CreditCard } from "lucide-react"
import type { BankAccount } from "@/app/actions/gocardless-actions"

interface BankMetrics {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  transactionCount: number
  balanceChange: number
  incomeChange: number
  expensesChange: number
}

interface BankAccountsOverviewProps {
  accounts: BankAccount[]
  metrics: BankMetrics
  loading: boolean
}

export function BankAccountsOverview({ accounts, metrics, loading }: BankAccountsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-nua-neutral rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#ffcb77",
  }

  const getKPIStatus = (value: number, type: "balance" | "income" | "expenses" | "transactions") => {
    switch (type) {
      case "balance":
        return value >= 10000 ? "positive" : value >= 5000 ? "neutral" : "negative"
      case "income":
        return value >= 5000 ? "positive" : value >= 2000 ? "neutral" : "negative"
      case "expenses":
        return value <= 3000 ? "positive" : value <= 5000 ? "neutral" : "negative"
      case "transactions":
        return value >= 50 ? "positive" : value >= 20 ? "neutral" : "negative"
      default:
        return "neutral"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StarBorder status={getKPIStatus(metrics.totalBalance, "balance")}>
          <h3 className="text-[14px] font-medium text-nua-title">Balance Total</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors[getKPIStatus(metrics.totalBalance, "balance")] }}>
              {formatCurrency(metrics.totalBalance)}
            </p>
            <span
              className="ml-2 text-[10px] flex items-center"
              style={{ color: colors[metrics.balanceChange >= 0 ? "positive" : "negative"] }}
            >
              {metrics.balanceChange >= 0 ? (
                <ArrowUp size={14} className="mr-0.5" />
              ) : (
                <ArrowDown size={14} className="mr-0.5" />
              )}
              {Math.abs(metrics.balanceChange)}% vs mes anterior
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">
            {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} conectada{accounts.length !== 1 ? "s" : ""}
          </p>
        </StarBorder>

        <StarBorder status={getKPIStatus(metrics.monthlyIncome, "income")}>
          <h3 className="text-[14px] font-medium text-nua-title">Ingresos del Mes</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors[getKPIStatus(metrics.monthlyIncome, "income")] }}>
              {formatCurrency(metrics.monthlyIncome)}
            </p>
            <span
              className="ml-2 text-[10px] flex items-center"
              style={{ color: colors[metrics.incomeChange >= 0 ? "positive" : "negative"] }}
            >
              {metrics.incomeChange >= 0 ? (
                <ArrowUp size={14} className="mr-0.5" />
              ) : (
                <ArrowDown size={14} className="mr-0.5" />
              )}
              {Math.abs(metrics.incomeChange)}% vs mes anterior
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Ingresos acumulados</p>
        </StarBorder>

        <StarBorder status={getKPIStatus(metrics.monthlyExpenses, "expenses")}>
          <h3 className="text-[14px] font-medium text-nua-title">Gastos del Mes</h3>
          <div className="mt-2 flex items-baseline">
            <p
              className="text-xl font-bold"
              style={{ color: colors[getKPIStatus(metrics.monthlyExpenses, "expenses")] }}
            >
              {formatCurrency(metrics.monthlyExpenses)}
            </p>
            <span
              className="ml-2 text-[10px] flex items-center"
              style={{ color: colors[metrics.expensesChange <= 0 ? "positive" : "negative"] }}
            >
              {metrics.expensesChange <= 0 ? (
                <ArrowDown size={14} className="mr-0.5" />
              ) : (
                <ArrowUp size={14} className="mr-0.5" />
              )}
              {Math.abs(metrics.expensesChange)}% vs mes anterior
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Gastos acumulados</p>
        </StarBorder>

        <StarBorder status={getKPIStatus(metrics.transactionCount, "transactions")}>
          <h3 className="text-[14px] font-medium text-nua-title">Transacciones</h3>
          <div className="mt-2 flex items-baseline">
            <p
              className="text-xl font-bold"
              style={{ color: colors[getKPIStatus(metrics.transactionCount, "transactions")] }}
            >
              {metrics.transactionCount}
            </p>
            <span className="ml-2 text-[10px] flex items-center text-nua-subtitle">
              <CreditCard size={14} className="mr-0.5" />
              Este mes
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Movimientos registrados</p>
        </StarBorder>
      </div>

      {/* Cuentas */}
      {accounts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[14px] font-medium text-nua-title mb-4">Cuentas Conectadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[12px] font-medium text-nua-title">{account.account_name}</h4>
                  <span
                    className={`text-[9px] px-2 py-1 rounded-full ${
                      account.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {account.status === "active" ? "Activa" : "Pendiente"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">****{account.iban.slice(-4)}</p>
                <p className="text-lg font-bold text-nua-title">{formatCurrency(account.balance)}</p>
                <p className="text-[9px] text-gray-400 mt-1">
                  Última sync: {new Date(account.last_sync).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
