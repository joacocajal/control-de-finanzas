'use client'

import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'

interface BalanceCardProps {
  type: 'balance' | 'income' | 'expense'
  amount: number
}

const CONFIG = {
  balance: {
    label: 'Balance Total',
    sublabel: 'Este mes',
    Icon: Wallet,
    color: '#e7ecf3',
    amountColor: (n: number) => (n < 0 ? '#f87171' : '#e7ecf3'),
  },
  income: {
    label: 'Ingresos',
    sublabel: 'Este mes',
    Icon: TrendingUp,
    color: '#34d399',
    amountColor: () => '#34d399',
  },
  expense: {
    label: 'Gastos',
    sublabel: 'Este mes',
    Icon: TrendingDown,
    color: '#f87171',
    amountColor: () => '#f87171',
  },
}

export function BalanceCard({ type, amount }: BalanceCardProps) {
  const { label, sublabel, Icon, color, amountColor } = CONFIG[type]

  return (
    <div
      className="glass lift relative overflow-hidden p-5"
      style={{ borderRadius: 18 }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
        style={{ background: `${color}0d` }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="inline-flex rounded-xl p-2.5"
          style={{ background: `${color}14`, color }}
        >
          <Icon size={17} strokeWidth={2} />
        </div>
        <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
          {sublabel}
        </div>
      </div>

      <div className="text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>
        {label}
      </div>
      <div
        className="text-[26px] font-bold tracking-tight num leading-none"
        style={{ color: amountColor(amount) }}
      >
        {formatCurrency(amount)}
      </div>
    </div>
  )
}
