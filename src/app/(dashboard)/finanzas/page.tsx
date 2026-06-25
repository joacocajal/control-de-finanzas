'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import { formatMonth, formatCurrency, formatUSD, formatDate } from '@/lib/utils/formatters'
import { calcCategoryTotals, calcTotalByType } from '@/lib/utils/calculations'
import { useFinance } from '@/contexts/FinanceContext'
import { useWalletContext } from '@/contexts/WalletContext'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { getTransactions, createTransaction, deleteTransaction } from '@/services/transaction.service'
import { ProgressRing } from '@/components/ui/ascend'
import { TransactionForm, AddTransactionButton } from '@/components/features/transactions/TransactionForm'
import { FinancialGoals } from '@/components/features/goals/FinancialGoals'
import { BudgetSection } from '@/components/features/goals/BudgetSection'
import { WalletSelector } from '@/components/features/wallets/WalletSelector'
import { WalletOnboarding } from '@/components/features/wallets/WalletOnboarding'
import { BudgetAlerts } from '@/components/features/categories/BudgetAlerts'
import { ExchangeRateIndicator } from '@/components/features/finance/ExchangeRateIndicator'
import Link from 'next/link'
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Trash2, Receipt, LayoutGrid, FileText } from 'lucide-react'
import type { TransactionWithCategory, CreateTransactionInput } from '@/types/database.types'

const ExpensePieChart = dynamic(
  () => import('@/components/features/charts/ExpensePieChart').then((m) => ({ default: m.ExpensePieChart })),
  { ssr: false, loading: () => <div className="rounded-[18px] h-full min-h-[300px] animate-shimmer" style={{ border: '1px solid var(--line)' }} /> }
)

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="glass p-4 flex flex-col gap-3 lift" style={{ borderRadius: 16 }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-[22px] font-bold num leading-none" style={{ color: 'var(--text-0)' }}>{value}</div>
        {sub && <div className="text-[11px] num mt-1" style={{ color: 'var(--text-2)' }}>{sub}</div>}
      </div>
    </div>
  )
}

function WalletBreakdown() {
  const { wallets } = useWalletContext()
  const { transactions: allTxns } = useFinance()

  if (wallets.length <= 1) return null

  return (
    <div className="glass p-5 mb-5" style={{ borderRadius: 18 }}>
      <div className="mb-4">
        <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>Consolidado</div>
        <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Por wallet</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {wallets.map(w => {
          const wTxns = allTxns.filter(t => t.wallet_id === w.id)
          const income = calcTotalByType(wTxns, 'income')
          const expense = calcTotalByType(wTxns, 'expense')
          const balance = income - expense
          return (
            <div key={w.id} className="rounded-xl p-3" style={{ background: `${w.color}08`, border: `1px solid ${w.color}25` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                  style={{ background: `${w.color}20`, color: w.color }}>
                  {w.name[0]}
                </div>
                <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>{w.name}</span>
              </div>
              <div className="text-[15px] font-bold num" style={{ color: balance >= 0 ? '#34d399' : '#f87171' }}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </div>
              <div className="text-[10px] num mt-0.5" style={{ color: 'var(--text-2)' }}>
                {formatCurrency(income)} in · {formatCurrency(expense)} out
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type DisplayCurrency = 'ARS' | 'USD'

export default function FinanzasPage() {
  const { categories, loading: catLoading, error: catError, addCategory } = useFinance()
  const { wallets, loading: walletLoading, activeWalletId, activeWallet, defaultWallet } = useWalletContext()
  const { arsToUsd, isToday, loading: rateLoading, save: saveRate } = useExchangeRate()

  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [txError, setTxError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'Month' | 'Quarter' | 'Year'>('Month')
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('ARS')

  const loadTxns = useCallback(async () => {
    setTxLoading(true)
    setTxError(null)
    try {
      const data = await getTransactions(activeWalletId)
      setTransactions(data)
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setTxLoading(false)
    }
  }, [activeWalletId])

  useEffect(() => { void loadTxns() }, [loadTxns])

  const handleAddTransaction = useCallback(async (input: CreateTransactionInput) => {
    const walletId = input.wallet_id ?? activeWalletId ?? defaultWallet?.id ?? null
    await createTransaction({ ...input, wallet_id: walletId })
    await loadTxns()
  }, [activeWalletId, defaultWallet, loadTxns])

  const handleRemoveTransaction = useCallback(async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    await deleteTransaction(id)
  }, [])

  const loading = txLoading || catLoading || walletLoading
  const error = txError || catError

  // Amount helper — respects displayCurrency and falls back to ARS
  function txAmt(t: TransactionWithCategory): number {
    if (displayCurrency === 'USD') {
      if (t.amount_usd != null) return t.amount_usd
      const ars = t.amount_ars ?? t.amount
      return arsToUsd && arsToUsd > 0 ? ars / arsToUsd : 0
    }
    return t.amount_ars ?? t.amount
  }

  const fmt = (n: number) => displayCurrency === 'USD' ? formatUSD(n) : formatCurrency(n)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + txAmt(t), 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + txAmt(t), 0)
  const balance = totalIncome - totalExpenses
  const categoryTotals = calcCategoryTotals(transactions, categories)

  const savingsGoalAmount = totalIncome > 0 ? totalIncome * 0.3 : 1
  const savedAmount = Math.max(0, balance)
  const savingsGoalPct = Math.min(1.05, savedAmount / savingsGoalAmount)
  const netWorth = totalIncome * 8.2

  const isConsolidated = activeWalletId === null

  // Show onboarding if wallets loaded and none exist
  const showOnboarding = !walletLoading && wallets.length === 0

  return (
    <>
      {showOnboarding && <WalletOnboarding />}

      {/* ── Section header ── */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
            <Wallet size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Vault</div>
            <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Finances</h1>
          </div>
          <span className="text-[11px] num px-2 py-1 rounded-md capitalize"
            style={{ color: 'var(--text-2)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}>
            {formatMonth()}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Wallet selector */}
          <WalletSelector />

          {/* ARS / USD toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--line)' }}>
            {(['ARS', 'USD'] as const).map(c => (
              <button key={c} onClick={() => setDisplayCurrency(c)}
                className="px-3 py-1.5 text-[11px] num font-semibold transition-colors"
                style={{
                  background: displayCurrency === c ? (c === 'USD' ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)') : 'transparent',
                  color: displayCurrency === c ? (c === 'USD' ? '#fbbf24' : 'var(--text-0)') : 'var(--text-2)',
                }}>
                {c}
              </button>
            ))}
          </div>

          {/* Exchange rate indicator */}
          <ExchangeRateIndicator
            arsToUsd={arsToUsd}
            isToday={isToday}
            loading={rateLoading}
            onSave={saveRate}
          />

          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--line)' }}>
            {(['Month', 'Quarter', 'Year'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1.5 text-[11px] num transition-colors"
                style={{
                  background: tab === t ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: tab === t ? 'var(--text-0)' : 'var(--text-2)',
                }}>
                {t}
              </button>
            ))}
          </div>
          <Link href="/finanzas/reportes"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] num font-medium transition-colors hover:bg-white/[0.06]"
            style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}>
            <FileText size={12} />
            Reportes
          </Link>
          <AddTransactionButton onClick={() => setShowForm(true)} />
        </div>
      </div>

      {/* Active wallet pill */}
      {activeWallet && (
        <div className="mb-5 flex items-center gap-2">
          <span
            className="text-[11px] num px-3 py-1 rounded-full font-medium"
            style={{ background: `${activeWallet.color}15`, color: activeWallet.color, border: `1px solid ${activeWallet.color}30` }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: activeWallet.color }} />
            {activeWallet.name}
          </span>
        </div>
      )}
      {isConsolidated && wallets.length > 0 && (
        <div className="mb-5 flex items-center gap-2">
          <span
            className="text-[11px] num px-3 py-1 rounded-full font-medium flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--line)' }}
          >
            <LayoutGrid size={10} />
            Vista consolidada — todas las wallets
          </span>
        </div>
      )}

      {/* ── Budget alerts ── */}
      <BudgetAlerts />

      {error && (
        <div className="mb-5 rounded-xl px-4 py-3" style={{ border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.1)' }}>
          <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Income" value={fmt(totalIncome)} icon={<ArrowUpRight size={14} />} color="#34d399" />
        <StatCard label="Expenses" value={fmt(totalExpenses)} icon={<ArrowDownRight size={14} />} color="#f87171" />
        <StatCard label="Saved" value={fmt(savedAmount)} icon={<TrendingUp size={14} />} color="#38bdf8" />
        <StatCard label="Net Worth" value={`$${(netWorth / 1000).toFixed(1)}k`} icon={<Wallet size={14} />} color="#fbbf24" />
      </div>

      {/* Consolidated wallet breakdown */}
      {isConsolidated && <WalletBreakdown />}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        <div className="lg:col-span-3 min-h-[340px]">
          <ExpensePieChart transactions={transactions} categories={categories} loading={loading} />
        </div>

        <div className="lg:col-span-2 glass p-5 flex flex-col items-center justify-center gap-4" style={{ borderRadius: 18 }}>
          <div className="text-[10px] num uppercase tracking-[0.18em] self-start" style={{ color: 'var(--text-2)' }}>
            Savings Goal · Pay yourself first
          </div>
          <ProgressRing size={150} stroke={12} value={savingsGoalPct} color="#34d399" glow="rgba(52,211,153,0.5)">
            <div className="flex flex-col items-center">
              <span className="text-[26px] font-bold num" style={{ color: 'var(--text-0)' }}>
                {Math.round(savingsGoalPct * 100)}%
              </span>
              <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>COMPLETE</span>
            </div>
          </ProgressRing>
          <div className="text-center">
            <div className="text-[13px] font-semibold num" style={{ color: 'var(--text-0)' }}>
              {fmt(savedAmount)} <span style={{ color: 'var(--text-2)' }}>saved</span>
            </div>
            <div className="text-[11px] num mt-1" style={{ color: 'var(--text-2)' }}>
              Goal: {fmt(savingsGoalAmount)}
            </div>
          </div>
          <button
            className="w-full py-2 rounded-xl text-[12px] font-semibold transition-colors"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            Adjust goal
          </button>
        </div>
      </div>

      {/* ── Budget categories + Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass p-5" style={{ borderRadius: 18 }}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>Budget breakdown</div>
              <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Budget categories</h2>
            </div>
            <Link href="/finanzas/categorias"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium shrink-0 transition-colors hover:bg-white/[0.06]"
              style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
              <LayoutGrid size={13} />
              Gestionar
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl animate-shimmer" />)}
            </div>
          ) : categoryTotals.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-2)' }}>No hay datos de categorías</p>
          ) : (
            <div className="space-y-3">
              {categoryTotals.slice(0, 5).map(cat => (
                <div key={cat.categoryId} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>{cat.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[12px] num font-semibold" style={{ color: 'var(--text-0)' }}>{formatCurrency(cat.amount)}</span>
                        <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{cat.percentage}%</span>
                      </div>
                    </div>
                    <div className="xp-track" style={{ height: 4 }}>
                      <div style={{ width: `${cat.percentage}%`, height: '100%', background: cat.color, borderRadius: 999, transition: 'width 700ms ease' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="glass p-5" style={{ borderRadius: 18 }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>Ledger</div>
              <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Recent transactions</h2>
            </div>
            {!loading && transactions.length > 0 && (
              <span className="num text-[11px] px-2 py-1 rounded-md"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
                {transactions.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 rounded-xl animate-shimmer" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Receipt size={20} style={{ color: 'var(--text-2)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                {activeWallet ? `Sin transacciones en ${activeWallet.name}` : 'Sin transacciones este mes'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {transactions.slice(0, 8).map((t) => {
                const walletColor = wallets.find(w => w.id === t.wallet_id)?.color
                return (
                  <li key={t.id} className="group flex items-center gap-3 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: t.categories?.color ?? walletColor ?? '#374151' }}>
                      {t.type === 'income'
                        ? <ArrowUpRight size={14} className="text-white/90" />
                        : <ArrowDownRight size={14} className="text-white/90" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>
                        {t.description ?? t.categories?.name ?? 'Sin descripción'}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-2)' }}>
                        {t.categories?.name}{t.categories?.name && ' · '}
                        {formatDate(t.transaction_date)}
                        {isConsolidated && walletColor && (
                          <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full align-middle" style={{ background: walletColor }} />
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[13px] font-bold num block"
                          style={{ color: t.type === 'income' ? '#34d399' : '#f87171' }}>
                          {t.type === 'income' ? '+' : '-'}{fmt(txAmt(t))}
                        </span>
                        {displayCurrency === 'USD' && t.currency === 'ARS' && t.amount_usd == null && (
                          <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>~conv</span>
                        )}
                        {displayCurrency === 'ARS' && t.currency === 'USD' && (
                          <span className="text-[10px] num" style={{ color: '#fbbf24' }}>
                            {formatUSD(t.amount_usd ?? t.amount)}
                          </span>
                        )}
                      </div>
                      <button onClick={() => void handleRemoveTransaction(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-rose-500/10"
                        style={{ color: 'var(--text-2)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Goals + Budgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <FinancialGoals />
        <BudgetSection categories={categories} />
      </div>

      {showForm && (
        <TransactionForm
          categories={categories}
          wallets={wallets}
          defaultWalletId={activeWalletId ?? defaultWallet?.id}
          exchangeRate={arsToUsd}
          onSubmit={handleAddTransaction}
          onClose={() => setShowForm(false)}
          onCreateCategory={addCategory}
        />
      )}
    </>
  )
}
