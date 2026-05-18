'use client'

import { Trash2, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import type { TransactionWithCategory } from '@/types/database.types'

interface TransactionListProps {
  transactions: TransactionWithCategory[]
  loading: boolean
  onDelete: (id: string) => Promise<void>
}

function SkeletonRow({ delay }: { delay: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-3 border-b border-white/[0.04]', delay)}>
      <div className="h-9 w-9 shrink-0 rounded-xl animate-shimmer" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 w-2/5 rounded-md animate-shimmer" />
        <div className="h-2.5 w-1/4 rounded-md animate-shimmer" />
      </div>
      <div className="h-4 w-16 rounded-md animate-shimmer" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <Receipt size={22} style={{ color: 'var(--text-2)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Sin transacciones este mes</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
        Hacé clic en{' '}
        <span style={{ color: 'var(--finance)' }} className="font-medium">+ Nueva Transacción</span>{' '}
        para empezar
      </p>
    </div>
  )
}

export function TransactionList({ transactions, loading, onDelete }: TransactionListProps) {
  return (
    <div className="glass p-5 h-full flex flex-col" style={{ borderRadius: 18 }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>Ledger</div>
          <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Transacciones Recientes</h2>
        </div>
        {!loading && transactions.length > 0 && (
          <span
            className="num text-[11px] px-2 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--line)' }}
          >
            {transactions.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
        {loading ? (
          <div>
            {['delay-75', 'delay-150', 'delay-225', 'delay-300', ''].map((d, i) => (
              <SkeletonRow key={i} delay={d} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {transactions.map((t, i) => (
              <li
                key={t.id}
                className={cn(
                  'group flex items-center gap-3 py-3 animate-fade-up',
                  i === 0 ? '' : i === 1 ? 'delay-75' : i === 2 ? 'delay-150' : 'delay-225'
                )}
              >
                {/* Category avatar */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: t.categories?.color ?? '#374151' }}
                >
                  {t.type === 'income' ? (
                    <ArrowUpRight size={15} className="text-white/90" />
                  ) : (
                    <ArrowDownRight size={15} className="text-white/90" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {t.description ?? t.categories?.name ?? 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {t.categories && (
                      <>
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.categories.color }}
                        />
                        <span className="text-[11px] text-gray-500 truncate">
                          {t.categories.name}
                        </span>
                        <span className="text-gray-700">·</span>
                      </>
                    )}
                    <span className="text-[11px] text-gray-600">
                      {formatDate(t.transaction_date)}
                    </span>
                  </div>
                </div>

                {/* Amount + delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    )}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                  <button
                    onClick={() => void onDelete(t.id)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 rounded-lg p-2 sm:p-1.5 text-gray-600 sm:text-gray-700 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                    aria-label="Eliminar transacción"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
