'use client'

import { useState, useMemo } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { ChatWidget } from './ChatWidget'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { calcBalance, calcTotalByType, calcCategoryTotals } from '@/lib/utils/calculations'
import { cn } from '@/lib/utils'

export function FloatingChat() {
  const [open, setOpen] = useState(false)
  const { transactions } = useTransactions()
  const { categories } = useCategories()

  const context = useMemo(
    () => ({
      balance: calcBalance(transactions),
      totalIncome: calcTotalByType(transactions, 'income'),
      totalExpenses: calcTotalByType(transactions, 'expense'),
      topCategories: calcCategoryTotals(transactions, categories).slice(0, 5),
    }),
    [transactions, categories]
  )

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-[400px] shadow-2xl shadow-black/50',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Close button inside panel */}
        <button
          onClick={() => setOpen(false)}
          className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-l-xl bg-gray-800 border border-r-0 border-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Cerrar chat"
        >
          <X size={16} />
        </button>
        <ChatWidget context={context} />
      </div>

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl',
          'shadow-indigo-500/30 transition-all duration-200',
          'hover:scale-105 hover:shadow-indigo-500/40 active:scale-95',
          open && 'rotate-90'
        )}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente IA'}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  )
}
