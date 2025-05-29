"use client"

import { useState, useEffect } from "react"
import { getAccounts, getTransactions } from "@/app/actions/banking"

interface BankAccount {
  id: string
  institution_id: string
  name: string
  iban: string
  currency: string
  balance: number
  account_type: string
  status: string
}

interface BankTransaction {
  id: string
  account_id: string
  amount: number
  currency: string
  description: string
  date: string
  creditor_name?: string
  debtor_name?: string
  type: "credit" | "debit"
}

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

        if (bankName === "Pool") {
          // Para Pool Bancario, obtener todas las cuentas
          const accountsResult = await getAccounts()
          if (accountsResult.success && accountsResult.data) {
            setAccounts(accountsResult.data)
          }

          const transactionsResult = await getTransactions(undefined, 100)
          if (transactionsResult.success && transactionsResult.data) {
            setTransactions(transactionsResult.data)
          }
        } else {
          // Para bancos específicos, filtrar por institución
          // Mapear nombres de bancos a IDs de institución
          const bankIdMap: Record<string, string> = {
            CaixaBank: "CAIXESBBXXX",
            BBVA: "BBVAESMM",
            "Banc Sabadell": "BSABESBB",
          }

          const institutionId = bankIdMap[bankName]
          if (!institutionId) {
            setAccounts([])
            setTransactions([])
            setMetrics({
              totalBalance: 0,
              monthlyIncome: 0,
              monthlyExpenses: 0,
              transactionCount: 0,
              balanceChange: 0,
              incomeChange: 0,
              expensesChange: 0,
            })
            setLoading(false)
            return
          }

          const accountsResult = await getAccounts(institutionId)
          if (accountsResult.success && accountsResult.data) {
            setAccounts(accountsResult.data)
          }

          // Obtener transacciones para todas las cuentas de este banco
          const allTransactions: BankTransaction[] = []
          for (const account of accountsResult.data || []) {
            const transactionsResult = await getTransactions(account.id, 50)
            if (transactionsResult.success && transactionsResult.data) {
              allTransactions.push(...transactionsResult.data)
            }
          }
          setTransactions(allTransactions)
        }

        // Calcular métricas
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        const currentMonthTransactions = transactions.filter((t) => {
          const transactionDate = new Date(t.date)
          return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
        })

        const monthlyIncome = currentMonthTransactions
          .filter((t) => t.type === "credit")
          .reduce((sum, t) => sum + t.amount, 0)

        const monthlyExpenses = currentMonthTransactions
          .filter((t) => t.type === "debit")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

        setMetrics({
          totalBalance,
          monthlyIncome,
          monthlyExpenses,
          transactionCount: currentMonthTransactions.length,
          balanceChange: 5.2, // Mock - calcular real después
          incomeChange: 12.3, // Mock - calcular real después
          expensesChange: -8.1, // Mock - calcular real después
        })
      } catch (err: any) {
        setError(err.message)
        console.error(`Error fetching bank data for ${bankName}:`, err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [bankName, accounts.length, transactions.length])

  return { accounts, transactions, metrics, loading, error }
}
