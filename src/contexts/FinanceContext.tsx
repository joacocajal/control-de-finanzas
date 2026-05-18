'use client'

import { createContext, useContext, useMemo } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { calcBalance, calcTotalByType, calcCategoryTotals, calcBudgetAlerts } from '@/lib/utils/calculations'
import type {
  TransactionWithCategory,
  Category,
  AIChatContext,
  BudgetAlert,
  CreateTransactionInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/database.types'

interface FinanceContextValue {
  transactions: TransactionWithCategory[]
  categories: Category[]
  loading: boolean
  error: string | null
  aiContext: AIChatContext
  budgetAlerts: BudgetAlert[]
  addTransaction: (input: CreateTransactionInput) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
  addCategory: (input: CreateCategoryInput) => Promise<Category>
  editCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>
  removeCategory: (id: string) => Promise<void>
  reloadCategories: () => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { transactions, loading, error, addTransaction, removeTransaction } = useTransactions()
  const { categories, addCategory, editCategory, removeCategory, reload: reloadCategories } = useCategories()

  const aiContext = useMemo(
    () => ({
      balance: calcBalance(transactions),
      totalIncome: calcTotalByType(transactions, 'income'),
      totalExpenses: calcTotalByType(transactions, 'expense'),
      topCategories: calcCategoryTotals(transactions, categories).slice(0, 5),
    }),
    [transactions, categories]
  )

  const budgetAlerts = useMemo(
    () => calcBudgetAlerts(transactions, categories),
    [transactions, categories]
  )

  const value = useMemo(
    () => ({
      transactions, categories, loading, error, aiContext, budgetAlerts,
      addTransaction, removeTransaction, addCategory, editCategory, removeCategory, reloadCategories,
    }),
    [transactions, categories, loading, error, aiContext, budgetAlerts,
      addTransaction, removeTransaction, addCategory, editCategory, removeCategory, reloadCategories]
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance debe usarse dentro de FinanceProvider')
  return ctx
}
