'use client'

import { useMemo } from 'react'
import { ChatWidget } from '@/components/features/ai-chat/ChatWidget'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { calcBalance, calcTotalByType, calcCategoryTotals } from '@/lib/utils/calculations'

export default function ChatPage() {
  const { transactions } = useTransactions()
  const { categories } = useCategories()

  const context = useMemo(() => {
    const balance = calcBalance(transactions)
    const totalIncome = calcTotalByType(transactions, 'income')
    const totalExpenses = calcTotalByType(transactions, 'expense')
    const topCategories = calcCategoryTotals(transactions, categories).slice(0, 5)
    return { balance, totalIncome, totalExpenses, topCategories }
  }, [transactions, categories])

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Asistente Financiero</h1>
        <p className="text-gray-500 text-sm mt-0.5">Consejos personalizados basados en tus datos</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatWidget context={context} />
      </div>
    </div>
  )
}
