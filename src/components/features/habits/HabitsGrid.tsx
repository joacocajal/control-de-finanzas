'use client'

import { useMemo, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Check, Trash2, CalendarCheck } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import type { HabitWithLogs } from '@/types/database.types'

// ─── Helpers ──────────────────────────────────────────────────

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function pad(n: number) { return String(n).padStart(2, '0') }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}` }

function todayStr() {
  const t = new Date()
  return dateStr(t.getFullYear(), t.getMonth() + 1, t.getDate())
}

const PALETTE = ['#ef4444', '#38bdf8', '#34d399', '#ec4899', '#f97316', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee']
const EMOJIS = ['✅', '🏋️', '📚', '🧘', '💧', '🥗', '🛏️', '💰', '🚭', '🏃', '🧠', '☀️', '✍️', '🙏', '📵']

// ─── New habit form ───────────────────────────────────────────

function NewHabitForm({ onCreate, onCancel }: {
  onCreate: (name: string, emoji: string, color: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [color, setColor] = useState(PALETTE[0])
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onCreate(name.trim(), emoji, color)
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="glass p-4 space-y-3" style={{ borderRadius: 16 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del hábito" required
        className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px]"
        style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />

      <div>
        <div className="text-[11px] num mb-1.5" style={{ color: 'var(--text-2)' }}>Emoji</div>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map(em => (
            <button key={em} type="button" onClick={() => setEmoji(em)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px] transition-all"
              style={{
                background: emoji === em ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${emoji === em ? 'rgba(255,255,255,0.3)' : 'var(--line)'}`,
              }}>{em}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] num mb-1.5" style={{ color: 'var(--text-2)' }}>Color</div>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-7 h-7 rounded-lg transition-transform"
              style={{ background: c, transform: color === c ? 'scale(1.15)' : 'scale(1)', boxShadow: color === c ? `0 0 0 2px #000, 0 0 0 4px ${c}` : 'none' }} />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: color, color: '#0a0a0a', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Creando...' : 'Crear hábito'}
        </button>
        <button type="button" onClick={onCancel}
          className="py-2.5 px-4 rounded-xl text-[13px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Progress sparkline ───────────────────────────────────────

function ProgressSparkline({ habits, days, year, month }: {
  habits: HabitWithLogs[]
  days: number[]
  year: number
  month: number
}) {
  const today = todayStr()
  const { points, pct } = useMemo(() => {
    if (habits.length === 0) return { points: '', pct: 0 }
    const W = 100, H = 100
    let doneTotal = 0, possibleTotal = 0
    const coords: string[] = []
    days.forEach((d, i) => {
      const ds = dateStr(year, month, d)
      if (ds > today) return
      const doneToday = habits.filter(h => h.done_dates.has(ds)).length
      const ratio = doneToday / habits.length
      const x = days.length > 1 ? (i / (days.length - 1)) * W : 0
      const y = H - ratio * H
      coords.push(`${x.toFixed(1)},${y.toFixed(1)}`)
      doneTotal += doneToday
      possibleTotal += habits.length
    })
    return {
      points: coords.join(' '),
      pct: possibleTotal ? Math.round((doneTotal / possibleTotal) * 100) : 0,
    }
  }, [habits, days, year, month, today])

  return (
    <div className="glass p-4" style={{ borderRadius: 16 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
          Progreso de {MONTHS[month - 1]} {year}
        </div>
        <div className="text-right">
          <span className="text-[18px] font-bold num" style={{ color: '#ef4444' }}>{pct}%</span>
        </div>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-20">
        <defs>
          <linearGradient id="habFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(239,68,68,0.25)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </linearGradient>
        </defs>
        {points && (
          <>
            <polyline points={`0,100 ${points} 100,100`} fill="url(#habFill)" stroke="none" />
            <polyline points={points} fill="none" stroke="#ef4444" strokeWidth="1.5"
              strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
    </div>
  )
}

// ─── Main grid ────────────────────────────────────────────────

export function HabitsGrid() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-based
  const [showForm, setShowForm] = useState(false)

  const daysInMonth = new Date(year, month, 0).getDate()
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth])
  const from = dateStr(year, month, 1)
  const to = dateStr(year, month, daysInMonth)
  const today = todayStr()

  const { habits, loading, create, remove, toggle } = useHabits(from, to)

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const NAME_W = 150
  const CELL = 26

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-1 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
          <CalendarCheck size={18} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Daily Grid</div>
          <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Hábitos</h1>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium"
          style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
          <Plus size={14} />
          Nuevo
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)' }}>
          <ChevronLeft size={16} />
        </button>
        <div className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>
          {MONTHS[month - 1]} {year}
        </div>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Progress chart */}
      {habits.length > 0 && <ProgressSparkline habits={habits} days={days} year={year} month={month} />}

      {showForm && (
        <NewHabitForm onCreate={(name, emoji, color) => create({ name, emoji, color })} onCancel={() => setShowForm(false)} />
      )}

      {/* Grid */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-9 rounded-xl animate-shimmer" />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-12 text-[13px]" style={{ color: 'var(--text-2)' }}>
          Creá tu primer hábito y empezá a convertir tu vida en un juego. 🎮
        </div>
      ) : (
        <div className="glass p-3 overflow-x-auto" style={{ borderRadius: 16 }}>
          <div style={{ minWidth: NAME_W + daysInMonth * CELL }}>
            {/* Day numbers header */}
            <div className="flex" style={{ paddingLeft: NAME_W }}>
              {days.map(d => {
                const ds = dateStr(year, month, d)
                const isToday = ds === today
                return (
                  <div key={d} className="text-[9px] num text-center"
                    style={{ width: CELL, color: isToday ? '#34d399' : 'var(--text-2)', fontWeight: isToday ? 700 : 400 }}>
                    {d}
                  </div>
                )
              })}
            </div>

            {/* Habit rows */}
            <div className="space-y-1 mt-1.5">
              {habits.map(h => (
                <div key={h.id} className="flex items-center group">
                  {/* Label */}
                  <div className="flex items-center gap-2 pr-2 shrink-0" style={{ width: NAME_W }}>
                    <span className="text-[14px] leading-none">{h.emoji}</span>
                    <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-1)' }}>{h.name}</span>
                    <button onClick={() => void remove(h.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: 'var(--text-2)' }} title="Eliminar hábito">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {/* Day cells */}
                  <div className="flex">
                    {days.map(d => {
                      const ds = dateStr(year, month, d)
                      const done = h.done_dates.has(ds)
                      const isFuture = ds > today
                      const isToday = ds === today
                      return (
                        <div key={d} style={{ width: CELL }} className="flex items-center justify-center py-0.5">
                          <button
                            onClick={() => !isFuture && void toggle(h.id, ds)}
                            disabled={isFuture}
                            className="rounded-md transition-all"
                            style={{
                              width: 20, height: 20,
                              background: done ? h.color : 'transparent',
                              border: `1.5px solid ${done ? h.color : isToday ? 'rgba(255,255,255,0.35)' : 'var(--line-2)'}`,
                              boxShadow: done ? `0 0 8px ${h.color}66` : 'none',
                              opacity: isFuture ? 0.25 : 1,
                              cursor: isFuture ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            title={ds}
                          >
                            {done && <Check size={13} strokeWidth={3} color="#0a0a0a" />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per-habit streak summary */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {habits.map(h => {
            const count = days.filter(d => h.done_dates.has(dateStr(year, month, d))).length
            return (
              <div key={h.id} className="glass flex items-center gap-2.5 px-3 py-2.5" style={{ borderRadius: 12 }}>
                <span className="text-[16px] leading-none">{h.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium truncate" style={{ color: 'var(--text-0)' }}>{h.name}</div>
                  <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{count} / {daysInMonth} días</div>
                </div>
                <div className="text-[13px] font-bold num shrink-0" style={{ color: h.color }}>
                  {Math.round((count / daysInMonth) * 100)}%
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
