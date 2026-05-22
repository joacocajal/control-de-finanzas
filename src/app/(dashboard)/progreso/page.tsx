'use client'

import { useState, useEffect, useCallback } from 'react'
import { Lock, Trophy, RotateCcw, Plus, Trash2, X, Loader2 } from 'lucide-react'
import { useProgression } from '@/hooks/useProgression'
import {
  getRecurringMissions,
  createRecurringMission,
  updateRecurringMission,
  deleteRecurringMission,
  toggleStrictMode,
  cancelStrictModeDisable,
} from '@/services/missions.service'
import { calculateLevel, levelProgress, xpToNextLevel, ACHIEVEMENTS, CATEGORY_ICONS, XP_REWARDS } from '@/lib/missions/progression'
import type { RecurringMission, MissionCategory, MissionDifficulty, CreateRecurringMissionInput } from '@/types/database.types'

// ─── Helpers ──────────────────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function msToCountdown(ms: number): string {
  if (ms <= 0) return '0h 0min'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}min`
}

// ─── Stats strip ──────────────────────────────────────────────

function StatsStrip({ totalXp, streak, longestStreak, totalMissions }: {
  totalXp: number; streak: number; longestStreak: number; totalMissions: number
}) {
  const level = calculateLevel(totalXp)
  const prog  = levelProgress(totalXp)
  const toNext = xpToNextLevel(totalXp)

  return (
    <div className="glass p-5 space-y-4" style={{ borderRadius: 20 }}>
      {/* Nivel gigante + barra */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] num uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--text-2)' }}>
            Nivel actual
          </div>
          <div className="text-[48px] font-black display leading-none" style={{ color: '#fbbf24' }}>
            {level}
          </div>
          <div className="text-[12px] num mt-1" style={{ color: 'var(--text-2)' }}>
            {toNext.toLocaleString()} XP para el nivel {level + 1}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] num uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--text-2)' }}>
            XP total
          </div>
          <div className="text-[24px] font-bold num" style={{ color: 'var(--text-0)' }}>
            {totalXp.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Barra de progreso de nivel */}
      <div>
        <div className="flex justify-between text-[10px] num mb-1.5" style={{ color: 'var(--text-2)' }}>
          <span>Nivel {level}</span>
          <span>{Math.round(prog)}%</span>
          <span>Nivel {level + 1}</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-2 rounded-full transition-all duration-700"
            style={{
              width: `${prog}%`,
              background: 'linear-gradient(90deg, #fbbf24, #f97316)',
              boxShadow: '0 0 8px rgba(251,191,36,0.4)',
            }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        {[
          { label: 'Racha actual', value: streak, icon: '🔥', color: '#f97316' },
          { label: 'Mejor racha', value: longestStreak, icon: '⚡', color: '#fbbf24' },
          { label: 'Completadas', value: totalMissions, icon: '✅', color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="text-center rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
            <div className="text-[18px] mb-0.5">{s.icon}</div>
            <div className="text-[20px] font-bold num" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Grid de logros ───────────────────────────────────────────

function AchievementsGrid({ unlocked }: { unlocked: { achievement_key: string; unlocked_at: string }[] }) {
  const unlockedMap = Object.fromEntries(unlocked.map(a => [a.achievement_key, a.unlocked_at]))

  return (
    <div className="glass p-5 space-y-4" style={{ borderRadius: 20 }}>
      <div className="flex items-center gap-2">
        <Trophy size={16} style={{ color: '#fbbf24' }} />
        <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Logros</h2>
        <span className="text-[11px] num px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
          {unlocked.length}/{Object.keys(ACHIEVEMENTS).length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(Object.entries(ACHIEVEMENTS) as [string, { title: string; desc: string }][]).map(([key, ach]) => {
          const date = unlockedMap[key]
          const done = !!date

          return (
            <div key={key}
              className="relative rounded-xl p-3 transition-all"
              style={{
                background: done ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${done ? 'rgba(251,191,36,0.25)' : 'var(--line)'}`,
                opacity: done ? 1 : 0.45,
              }}>
              {!done && (
                <div className="absolute top-2 right-2">
                  <Lock size={10} style={{ color: 'var(--text-2)' }} />
                </div>
              )}
              <div className="text-[18px] mb-1.5">{ach.title.split(' ')[0]}</div>
              <div className="text-[12px] font-semibold leading-tight" style={{ color: done ? '#fbbf24' : 'var(--text-1)' }}>
                {ach.title.split(' ').slice(1).join(' ')}
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-2)' }}>{ach.desc}</div>
              {done && (
                <div className="text-[9px] num mt-2" style={{ color: 'rgba(251,191,36,0.6)' }}>
                  {new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Misiones recurrentes ─────────────────────────────────────

const CAT_OPTIONS: { value: MissionCategory; label: string }[] = [
  { value: 'fisico',  label: '💪 Físico'  },
  { value: 'mental',  label: '🧠 Mental'  },
  { value: 'hogar',   label: '🏠 Hogar'   },
  { value: 'negocio', label: '💼 Negocio' },
  { value: 'custom',  label: '✨ Custom'  },
]
const DIFF_OPTIONS: { value: MissionDifficulty; label: string }[] = [
  { value: 'facil',  label: 'Fácil'   },
  { value: 'medio',  label: 'Medio'   },
  { value: 'dificil', label: 'Difícil' },
]

function NewRecurringForm({ onAdd, onClose }: {
  onAdd: (input: CreateRecurringMissionInput) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle]           = useState('')
  const [category, setCategory]     = useState<MissionCategory>('custom')
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('medio')
  const [days, setDays]             = useState<number[]>([1, 2, 3, 4, 5, 6, 7])
  const [saving, setSaving]         = useState(false)

  const toggleDay = (d: number) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || days.length === 0) return
    setSaving(true)
    try {
      await onAdd({ title: title.trim(), category, difficulty, days_of_week: days })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={e => void handleSubmit(e)}
      className="p-4 rounded-2xl space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold" style={{ color: '#c4b5fd' }}>Nueva misión recurrente</span>
        <button type="button" onClick={onClose} style={{ color: 'var(--text-2)' }}><X size={14} /></button>
      </div>

      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Ej: Tender la cama"
        className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px]"
        style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />

      <div className="flex gap-1.5 flex-wrap">
        {CAT_OPTIONS.map(c => (
          <button key={c.value} type="button" onClick={() => setCategory(c.value)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: category === c.value ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${category === c.value ? 'rgba(139,92,246,0.4)' : 'var(--line)'}`,
              color: category === c.value ? '#c4b5fd' : 'var(--text-2)',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {DIFF_OPTIONS.map(d => (
          <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
            className="flex-1 py-1.5 rounded-lg text-[11px] transition-all"
            style={{
              background: difficulty === d.value ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${difficulty === d.value ? 'rgba(251,191,36,0.35)' : 'var(--line)'}`,
              color: difficulty === d.value ? '#fbbf24' : 'var(--text-2)',
            }}>
            {d.label} · +{XP_REWARDS[d.value]}XP
          </button>
        ))}
      </div>

      {/* Días de la semana */}
      <div>
        <div className="text-[11px] num mb-2" style={{ color: 'var(--text-2)' }}>Días activos</div>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, i) => {
            const d = i + 1
            const active = days.includes(d)
            return (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: active ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(139,92,246,0.4)' : 'var(--line)'}`,
                  color: active ? '#c4b5fd' : 'var(--text-2)',
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving || !title.trim() || days.length === 0}
          className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
          style={{ background: '#8b5cf6', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : 'Crear recurrente'}
        </button>
      </div>
    </form>
  )
}

function RecurringSection() {
  const [missions, setMissions] = useState<RecurringMission[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setMissions(await getRecurringMissions()) } catch { /* esperando migration */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleAdd = async (input: CreateRecurringMissionInput) => {
    await createRecurringMission(input)
    await load()
  }

  const handleToggle = async (m: RecurringMission) => {
    await updateRecurringMission(m.id, { is_active: !m.is_active })
    await load()
  }

  const handleDelete = async (id: string) => {
    await deleteRecurringMission(id)
    await load()
  }

  return (
    <div className="glass p-5 space-y-4" style={{ borderRadius: 20 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw size={15} style={{ color: '#8b5cf6' }} />
          <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Recurrentes</h2>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium"
          style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
          <Plus size={12} />
          Nueva
        </button>
      </div>

      {showForm && (
        <NewRecurringForm onAdd={handleAdd} onClose={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-2)' }} />
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-4 text-[13px]" style={{ color: 'var(--text-2)' }}>
          No tenés misiones recurrentes. Creá una arriba.
        </div>
      ) : (
        <div className="space-y-2">
          {missions.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--line)',
                opacity: m.is_active ? 1 : 0.45,
              }}>
              <span className="text-[15px]">{CATEGORY_ICONS[m.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>{m.title}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {DAY_LABELS.map((label, i) => {
                    const active = m.days_of_week.includes(i + 1)
                    return (
                      <span key={i}
                        className="text-[9px] num px-1.5 py-0.5 rounded"
                        style={{
                          background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                          color: active ? '#c4b5fd' : 'var(--text-2)',
                        }}>
                        {label}
                      </span>
                    )
                  })}
                  <span className="text-[9px] num ml-1" style={{ color: 'rgba(251,191,36,0.6)' }}>
                    +{m.xp_reward}XP
                  </span>
                </div>
              </div>

              {/* Toggle */}
              <button onClick={() => void handleToggle(m)}
                className="w-9 h-5 rounded-full relative transition-colors shrink-0"
                style={{
                  background: m.is_active ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                }}>
                <span className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all"
                  style={{ left: m.is_active ? '20px' : '2px' }} />
              </button>

              <button onClick={() => void handleDelete(m.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ color: 'var(--text-2)' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modo estricto ────────────────────────────────────────────

function StrictModeSection() {
  const { progression, reload } = useProgression()
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [countdown, setCountdown]     = useState('')

  const enabled  = progression?.strict_mode_enabled ?? false
  const pendingAt = progression?.strict_mode_pending_disable_at ?? null

  useEffect(() => {
    if (!pendingAt) { setCountdown(''); return }
    const update = () => {
      const ms = new Date(pendingAt).getTime() - Date.now()
      setCountdown(ms > 0 ? msToCountdown(ms) : '0h 0min')
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [pendingAt])

  const handleToggle = async () => {
    if (!enabled) {
      setSaving(true)
      try { await toggleStrictMode(); await reload() } finally { setSaving(false) }
    } else {
      setShowConfirm(true)
    }
  }

  const handleConfirmDisable = async () => {
    setSaving(true)
    try {
      await toggleStrictMode()
      await reload()
      setShowConfirm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelDisable = async () => {
    setSaving(true)
    try { await cancelStrictModeDisable(); await reload() } finally { setSaving(false) }
  }

  return (
    <div className="glass p-5 space-y-4" style={{
      borderRadius: 20,
      border: enabled ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--line)',
      background: enabled ? 'rgba(239,68,68,0.04)' : undefined,
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock size={15} style={{ color: enabled ? '#ef4444' : 'var(--text-2)' }} />
          <h2 className="text-[15px] font-semibold display" style={{ color: enabled ? '#ef4444' : 'var(--text-0)' }}>
            Modo estricto
          </h2>
          {enabled && (
            <span className="text-[10px] num px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              ACTIVO
            </span>
          )}
        </div>

        {/* Toggle switch */}
        <button onClick={() => void handleToggle()} disabled={saving}
          className="w-11 h-6 rounded-full relative transition-colors"
          style={{ background: enabled ? '#ef4444' : 'rgba(255,255,255,0.1)' }}>
          <span className="absolute top-0.5 rounded-full w-5 h-5 bg-white transition-all"
            style={{ left: enabled ? '24px' : '2px' }} />
        </button>
      </div>

      <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
        Cuando está activo, no podés usar el resto de la app hasta completar el 100% de las misiones del día.
      </p>

      {/* Countdown de desactivación pendiente */}
      {enabled && pendingAt && (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <span className="text-[12px]" style={{ color: '#fbbf24' }}>
            ⏳ Se desactiva en {countdown}
          </span>
          <button onClick={() => void handleCancelDisable()} disabled={saving}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            Cancelar
          </button>
        </div>
      )}

      {/* Modal de confirmación desactivación */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="text-[16px] font-bold display" style={{ color: 'var(--text-0)' }}>
              🔓 Desactivar modo estricto
            </div>
            <p className="text-[13px]" style={{ color: 'var(--text-1)' }}>
              El modo estricto se desactivará en <strong style={{ color: '#fbbf24' }}>24 horas</strong>.
              Esto es para que no lo apagues por impulso. Tu yo del futuro te va a agradecer.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => void handleConfirmDisable()} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {saving ? 'Procesando...' : 'Iniciar desactivación'}
              </button>
              <button onClick={() => setShowConfirm(false)} disabled={saving}
                className="py-2.5 px-4 rounded-xl text-[13px]"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function ProgresoPage() {
  const { progression, achievements, loading } = useProgression()

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>
          Progreso
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-2)' }}>
          Tu nivel, logros y configuración de misiones
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-2)' }} />
        </div>
      ) : (
        <>
          {progression && (
            <StatsStrip
              totalXp={progression.total_xp}
              streak={progression.current_streak}
              longestStreak={progression.longest_streak}
              totalMissions={progression.total_missions_completed}
            />
          )}

          <AchievementsGrid unlocked={achievements} />

          <RecurringSection />

          <StrictModeSection />
        </>
      )}
    </div>
  )
}
