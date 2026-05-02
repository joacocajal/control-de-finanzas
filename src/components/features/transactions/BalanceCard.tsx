'use client'

import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  type: 'balance' | 'income' | 'expense'
  amount: number
}

const CONFIG = {
  balance: {
    label: 'Balance Total',
    sublabel: 'Este mes',
    Icon: Wallet,
    cardClass: 'border-indigo-500/10',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-400',
    amountColor: (n: number) => (n < 0 ? 'text-rose-300' : 'text-white'),
    orb: 'bg-indigo-600/10',
    glow: 'shadow-indigo-500/5',
  },
  income: {
    label: 'Ingresos',
    sublabel: 'Este mes',
    Icon: TrendingUp,
    cardClass: 'border-emerald-500/10',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    amountColor: () => 'text-emerald-300',
    orb: 'bg-emerald-600/10',
    glow: 'shadow-emerald-500/5',
  },
  expense: {
    label: 'Gastos',
    sublabel: 'Este mes',
    Icon: TrendingDown,
    cardClass: 'border-rose-500/10',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    amountColor: () => 'text-rose-300',
    orb: 'bg-rose-600/10',
    glow: 'shadow-rose-500/5',
  },
}

export function BalanceCard({ type, amount }: BalanceCardProps) {
  const { label, sublabel, Icon, cardClass, iconBg, iconColor, amountColor, orb, glow } =
    CONFIG[type]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gray-900 p-6',
        'shadow-xl transition-all duration-200 hover:border-opacity-30 hover:shadow-2xl',
        cardClass,
        glow
      )}
    >
      {/* Decorative orb */}
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl opacity-60',
          orb
        )}
      />

      {/* Icon */}
      <div className={cn('mb-4 inline-flex rounded-xl p-2.5', iconBg)}>
        <Icon size={18} className={iconColor} strokeWidth={2} />
      </div>

      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</p>

      {/* Amount */}
      <p
        className={cn(
          'mt-1.5 text-3xl font-bold tracking-tight tabular-nums leading-none',
          amountColor(amount)
        )}
      >
        {formatCurrency(amount)}
      </p>

      {/* Sublabel */}
      <p className="mt-3 text-xs text-gray-600">{sublabel}</p>
    </div>
  )
}
