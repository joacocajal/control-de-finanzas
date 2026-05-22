'use client'

import Link from 'next/link'
import { useGamification } from '@/hooks/useGamification'
import { useQuests } from '@/hooks/useQuests'
import { useFinance } from '@/contexts/FinanceContext'
import { MisionesWidget } from '@/components/features/gamification/MisionesWidget'
import { calcBalance, calcTotalByType, calcCategoryTotals } from '@/lib/utils/calculations'
import { formatCurrency } from '@/lib/utils/formatters'
import { ProgressRing } from '@/components/ui/ascend'
import {
  Sparkles, Flame, Wallet, Dumbbell, BookOpen,
  ChevronRight, Zap,
} from 'lucide-react'
import { DailyMissionsCard } from '@/components/dashboard/DailyMissionsCard'

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function QuestAuroraCard({ misiones, loading, completar }: {
  misiones: ReturnType<typeof useQuests>['misiones']
  loading: boolean
  completar: (id: string) => void
}) {
  const firstPending = misiones.find(m => m.estado === 'pendiente')
  const xpReward = firstPending?.xp_recompensa ?? 25

  return (
    <div className="relative overflow-hidden rounded-[20px] p-5 flex flex-col gap-4 min-h-[180px]"
      style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
      <div className="absolute inset-0 aurora opacity-70" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,9,15,0.25) 0%, rgba(7,9,15,0.82) 100%)' }} />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] num uppercase tracking-[0.2em] px-2 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-1)' }}>Daily Quest</span>
          <span className="text-[10px] num px-2 py-1 rounded-md"
            style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>Sage</span>
          <span className="text-[10px] num px-2 py-1 rounded-md"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>Finanzas</span>
        </div>
        <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
          style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <Sparkles size={12} style={{ color: '#fbbf24' }} />
          <span className="text-[13px] font-bold num" style={{ color: '#fbbf24' }}>+{xpReward}</span>
        </div>
      </div>

      <div className="relative z-10 flex-1">
        {loading ? (
          <div className="space-y-2">
            <div className="h-5 w-4/5 rounded-lg animate-shimmer" />
            <div className="h-3.5 w-3/5 rounded-lg animate-shimmer" />
          </div>
        ) : firstPending ? (
          <>
            <h2 className="text-[16px] font-bold display leading-snug mb-1.5" style={{ color: 'var(--text-0)' }}>
              &ldquo;{firstPending.descripcion}&rdquo;
            </h2>
            <p className="text-[12px]" style={{ color: 'var(--text-1)' }}>
              Completá esta misión para ganar XP y mantener tu racha.
            </p>
          </>
        ) : (
          <div>
            <h2 className="text-[16px] font-bold display" style={{ color: '#34d399' }}>¡Todas las misiones completadas! 🎉</h2>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-1)' }}>Aplastaste el día.</p>
          </div>
        )}
      </div>

      {firstPending && (
        <div className="relative z-10">
          <button onClick={() => completar(firstPending.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)' }}>
            <Sparkles size={14} />
            Accept Quest
          </button>
        </div>
      )}
    </div>
  )
}

function WeeklyActivityCard({ streak }: { streak: number }) {
  const today = new Date().getDay()
  const adjustedDay = today === 0 ? 6 : today - 1

  return (
    <div className="glass p-5 flex flex-col gap-4 h-full" style={{ borderRadius: 18 }}>
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>This week</h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <Flame size={11} className="flame" style={{ color: '#f97316' }} />
          <span className="text-[11px] num font-bold" style={{ color: '#fb923c' }}>{streak} day streak</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {DAYS.map((d, i) => {
          const isActive = i <= adjustedDay
          const isToday = i === adjustedDay
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold num"
                style={{
                  background: isActive ? 'linear-gradient(135deg, #fbbf24, #f97316)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#0a0d14' : 'var(--text-2)',
                  maxWidth: 32,
                  outline: isToday ? '1px solid #fbbf24' : 'none',
                  outlineOffset: 2,
                }}>
                {d}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-around flex-1">
        {[
          { label: 'Move', pct: 0.87, color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
          { label: 'Lift', pct: 0.46, color: '#8b5cf6', glow: 'rgba(139,92,246,0.5)' },
          { label: 'Learn', pct: 0.40, color: '#f97316', glow: 'rgba(249,115,22,0.5)' },
        ].map(({ label, pct, color, glow }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <ProgressRing size={52} stroke={5} value={pct} color={color} glow={glow}>
              <span className="text-[9px] num font-bold" style={{ color }}>{Math.round(pct * 100)}</span>
            </ProgressRing>
            <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceWidget() {
  const { transactions, categories, loading } = useFinance()
  const totalIncome = calcTotalByType(transactions, 'income')
  const totalExpenses = calcTotalByType(transactions, 'expense')
  const balance = calcBalance(transactions)
  const topCats = calcCategoryTotals(transactions, categories).slice(0, 3)

  return (
    <div className="glass p-5" style={{ borderRadius: 18 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
            <Wallet size={14} />
          </div>
          <div>
            <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Vault</div>
            <h3 className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>Finances</h3>
          </div>
        </div>
        <Link href="/finanzas" className="flex items-center gap-1 text-[11px] num hover:opacity-80 transition-opacity"
          style={{ color: '#34d399' }}>
          Ver todo <ChevronRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-shimmer" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Income', val: formatCurrency(totalIncome), color: '#34d399' },
              { label: 'Expenses', val: formatCurrency(totalExpenses), color: '#f87171' },
              { label: 'Balance', val: formatCurrency(balance), color: '#38bdf8' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
                <div className="text-[10px] num uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--text-2)' }}>{label}</div>
                <div className="text-[14px] font-bold num" style={{ color }}>{val}</div>
              </div>
            ))}
          </div>
          {topCats.length > 0 && (
            <div className="space-y-2">
              {topCats.map(cat => (
                <div key={cat.categoryId} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-[12px] flex-1 truncate" style={{ color: 'var(--text-1)' }}>{cat.name}</span>
                  <span className="text-[12px] num font-semibold" style={{ color: 'var(--text-0)' }}>{formatCurrency(cat.amount)}</span>
                  <span className="text-[10px] num w-7 text-right" style={{ color: 'var(--text-2)' }}>{cat.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { profile, reload } = useGamification()
  const { misiones, loading: loadingQ, completar, fallar, crear } = useQuests(reload)

  const streak = profile?.racha_dias ?? 0

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Dashboard</h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-2)' }}>Tu centro de comando personal</p>
      </div>

      {/* ── Misiones diarias ── */}
      <DailyMissionsCard />

      {/* ── Top: Quest + Weekly ── */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 mb-4">
        <div className="lg:col-span-5 animate-fade-up">
          <QuestAuroraCard misiones={misiones} loading={loadingQ} completar={completar} />
        </div>
        <div className="lg:col-span-3 animate-fade-up delay-75">
          <WeeklyActivityCard streak={streak} />
        </div>
      </div>

      {/* ── Finance widget ── */}
      <div className="mb-4 animate-fade-up delay-150">
        <FinanceWidget />
      </div>

      {/* ── Quest Board + Realm shortcuts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up delay-225">
        {/* Full MisionesWidget */}
        <div className="lg:col-span-1">
          <MisionesWidget
            misiones={misiones}
            loading={loadingQ}
            onCompletar={completar}
            onFallar={fallar}
            onCrear={crear}
          />
        </div>

        {/* Fitness shortcut */}
        <Link href="/fitness" className="glass p-5 flex flex-col gap-3 lift" style={{ borderRadius: 18 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                <Dumbbell size={15} />
              </div>
              <div>
                <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Forge</div>
                <h3 className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>Fitness &amp; Health</h3>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-2)' }} />
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {['Body Weight', 'Body Fat', 'Workouts', 'Sleep'].map(label => (
              <div key={label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
                <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{label}</div>
                <div className="text-[16px] font-bold num mt-0.5" style={{ color: '#8b5cf6' }}>—</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] num" style={{ color: '#8b5cf6' }}>
            <Zap size={11} />
            Abrir Fitness Forge
          </div>
        </Link>

        {/* Learning shortcut */}
        <Link href="/aprendizaje" className="glass p-5 flex flex-col gap-3 lift" style={{ borderRadius: 18 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
                <BookOpen size={15} />
              </div>
              <div>
                <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Codex</div>
                <h3 className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>Learning Hub</h3>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-2)' }} />
          </div>
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <div className="text-[11px] num mb-1" style={{ color: 'var(--text-2)' }}>Estado actual</div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>
              {misiones.filter(m => m.estado === 'completada').length} quests completadas hoy
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] num" style={{ color: '#f97316' }}>
            <BookOpen size={11} />
            Abrir Learning Hub
          </div>
        </Link>
      </div>
    </>
  )
}
