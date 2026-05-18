'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/formatters'
import { useFinance } from '@/contexts/FinanceContext'

export function BudgetAlerts() {
  const { budgetAlerts } = useFinance()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = budgetAlerts.filter(a => !dismissed.has(a.categoryId))
  if (visible.length === 0) return null

  return (
    <div className="mb-5 space-y-2">
      {visible.map(alert => {
        const isDanger = alert.level === 'danger'
        const accent = isDanger ? '#f87171' : '#fbbf24'
        return (
          <div
            key={alert.categoryId}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: isDanger ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
              border: `1px solid ${accent}30`,
            }}
          >
            <AlertTriangle size={14} className="shrink-0" style={{ color: accent }} />
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium" style={{ color: accent }}>
                {isDanger ? 'Presupuesto superado' : 'Presupuesto casi agotado'}
              </span>
              <span className="text-[12px] ml-1.5" style={{ color: 'var(--text-1)' }}>
                —{' '}
                <span className="font-semibold">{alert.name}</span>
                {' '}gastaste {formatCurrency(alert.spent)} de {formatCurrency(alert.budget)} ({alert.percentage}%)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Mini bar */}
              <div className="hidden sm:block w-20 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, alert.percentage)}%`, background: accent }}
                />
              </div>
              <button
                onClick={() => setDismissed(prev => new Set([...prev, alert.categoryId]))}
                className="p-1 rounded-lg transition-colors hover:bg-white/[0.06]"
                style={{ color: 'var(--text-2)' }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
