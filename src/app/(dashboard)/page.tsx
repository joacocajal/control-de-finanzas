'use client'

import { useState } from 'react'
import { formatMonth } from '@/lib/utils/formatters'
import { calcBalance, calcTotalByType } from '@/lib/utils/calculations'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { BalanceCard } from '@/components/features/transactions/BalanceCard'
import { ExpensePieChart } from '@/components/features/charts/ExpensePieChart'
import { TransactionList } from '@/components/features/transactions/TransactionList'
import { TransactionForm, AddTransactionButton } from '@/components/features/transactions/TransactionForm'

export default function DashboardPage() {
  const { transactions, loading, error, addTransaction, removeTransaction } = useTransactions()
  const { categories, addCategory } = useCategories()
  const [showForm, setShowForm] = useState(false)

  const balance = calcBalance(transactions)
  const totalIncome = calcTotalByType(transactions, 'income')
  const totalExpenses = calcTotalByType(transactions, 'expense')

  return (
    <>
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{formatMonth()}</p>
        </div>
        <AddTransactionButton onClick={() => setShowForm(true)} />
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="animate-fade-up">
          <BalanceCard type="balance" amount={balance} />
        </div>
        <div className="animate-fade-up delay-75">
          <BalanceCard type="income" amount={totalIncome} />
        </div>
        <div className="animate-fade-up delay-150">
          <BalanceCard type="expense" amount={totalExpenses} />
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 min-h-[460px]">
          <ExpensePieChart transactions={transactions} categories={categories} loading={loading} />
        </div>
        <div className="lg:col-span-3 min-h-[460px]">
          <TransactionList
            transactions={transactions}
            loading={loading}
            onDelete={removeTransaction}
          />
        </div>
      </div>

      {showForm && (
        <TransactionForm
          categories={categories}
          onSubmit={addTransaction}
          onClose={() => setShowForm(false)}
          onCreateCategory={addCategory}
        />
      )}
    </>
  )
}
