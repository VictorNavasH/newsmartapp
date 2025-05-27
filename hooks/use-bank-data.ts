"use client"

import { useState, useEffect } from "react"
import { getBankAccountsByBank, getBankTransactionsByBank } from "@/app/actions/gocardless-actions"
import type { BankAccount, BankTransaction } from "@/app/actions/gocardless-actions"

interface BankMetrics {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  transactionCount: number
  balanceChange: number
  incomeChange: number
  expensesChange: number
}

export function useBankData(bankName: string) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [metrics, setMetrics] = useState<BankMetrics>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    transactionCount: 0,
    balanceChange: 0,
    incomeChange: 0,
    expensesChange: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Obtener cuentas del banco
        const accountsResult = await getBankAccountsByBank(bankName)
        if (accountsResult.success && accountsResult.data) {
          setAccounts(accountsResult.data)
        }

        // Obtener transacciones del banco
        const transactionsResult = await getBankTransactionsByBank(bankName, 100)
        if (transactionsResult.success && transactionsResult.data) {
          setTransactions(transactionsResult.data)

          // Calcular métricas
          const currentMonth = new Date().getMonth()
          const currentYear = new Date().getFullYear()

          const currentMonthTransactions = transactionsResult.data.filter((t) => {
            const transactionDate = new Date(t.date)
            return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
          })

          const monthlyIncome = currentMonthTransactions
            .filter((t) => t.type === "credit")
            .reduce((sum, t) => sum + t.amount, 0)

          const monthlyExpenses = currentMonthTransactions
            .filter((t) => t.type === "debit")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)

          const totalBalance = accountsResult.data?.reduce((sum, acc) => sum + acc.balance, 0) || 0

          setMetrics({
            totalBalance,
            monthlyIncome,
            monthlyExpenses,
            transactionCount: currentMonthTransactions.length,
            balanceChange: 5.2, // Mock - calcular real después
            incomeChange: 12.3, // Mock - calcular real después
            expensesChange: -8.1, // Mock - calcular real después
          })
        }
      } catch (err: any) {
        setError(err.message)
        console.error(`Error fetching bank data for ${bankName}:`, err)
      } finally {
        setLoading(false)
      }
    }

    if (bankName && bankName !== "Pool") {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [bankName])

  return { accounts, transactions, metrics, loading, error }
}
