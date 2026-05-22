'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Flame, Target, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useMissions } from '@/hooks/useMissions'
import { useProgression } from '@/hooks/useProgression'
import { CATEGORY_ICONS, ACHIEVEMENTS, XP_REWARDS } from '@/lib/missions/progression'
import type { MissionCategory, MissionDifficulty } from '@/types/database.types'

// ─── XP flotante ─────────────────────────────────────────────

function XpPop({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <span
      className="absolute -top-6 right-0 text-[13px] font-bold num pointer-events-none animate-fade-up"
      style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.6)' }}>
      +{xp} XP ✨
    </span>
  )
}

// ─── Toast de logro ───────────────────────────────────────────

function AchievementToast({ keys, onDone }: { keys: string[]; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {keys.map(k => {
        const ach = ACHIEVEMENTS[k as keyof typeof ACHIEVEMENTS]
        if (!ach) return null
        return (
          <div key={k}
            className="px-4 py-3 rounded-2xl text-[13px] font-semibold text-center animate-fade-up"
            style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.4)',
              color: '#fbbf24',
              backdropFilter: 'blur(12px)',
            }}>
            🏆 Logro desbloqueado: {ach.title}
          </div>
        )
      })}
    </div>
  )
}

// ─── Formulario nueva misión custom ──────────────────────────

const CATEGORIES: { value: MissionCategory; label: string }[] = [
  { value: 'fisico',  label: '💪 Físico'  },
  { value: 'mental',  label: '🧠 Mental'  },
  { value: 'hogar',   label: '🏠 Hogar'   },
  { value: 'negocio', label: '💼 Negocio' },
  { value: 'custom',  label: '✨ Custom'  },
]

const DIFFICULTIES: { value: MissionDifficulty; label: string }[] = [
  { value: 'facil',  label: 'Fácil'   },
  { value: 'medio',  label: 'Medio'   },
  { value: 'dificil', label: 'Difícil' },
]

function NewMissionForm({ onAdd, onClose }: {
  onAdd: (data: { title: string; category: MissionCategory; difficulty: MissionDifficulty }) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle]           = useState('')
  const [category, setCategory]     = useState<MissionCategory>('custom')
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('medio')
  const [saving, setSaving]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onAdd({ title: title.trim(), category, difficulty })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={e => void handleSubmit(e)}
      className="mt-3 p-4 rounded-2xl space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="¿Qué vas a hacer hoy?"
        className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px]"
        style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }}
      />

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
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
        {DIFFICULTIES.map(d => (
          <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: difficulty === d.value ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${difficulty === d.value ? 'rgba(251,191,36,0.35)' : 'var(--line)'}`,
              color: difficulty === d.value ? '#fbbf24' : 'var(--text-2)',
            }}>
            {d.label} · +{XP_REWARDS[d.value]}XP
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving || !title.trim()}
          className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
          style={{ background: '#8b5cf6', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Agregando...' : 'Agregar misión'}
        </button>
        <button type="button" onClick={onClose}
          className="py-2 px-3 rounded-xl text-[12px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Card principal ───────────────────────────────────────────

export function DailyMissionsCard() {
  const { missions, loading, complete, uncomplete, create, pct, completed, total, newAchievements, clearAchievements } = useMissions()
  const { progression } = useProgression()
  const [showForm, setShowForm]       = useState(false)
  const [collapsed, setCollapsed]     = useState(false)
  const [xpPops, setXpPops]           = useState<{ id: string; xp: number }[]>([])
  const popIdRef                      = useRef(0)

  const streak = progression?.current_streak ?? 0

  const handleComplete = async (id: string, xpReward: number, alreadyDone: boolean) => {
    if (alreadyDone) {
      await uncomplete(id)
    } else {
      popIdRef.current++
      const popId = String(popIdRef.current)
      setXpPops(prev => [...prev, { id: popId, xp: xpReward }])
      await complete(id)
    }
  }

  return (
    <>
      {newAchievements.length > 0 && (
        <AchievementToast keys={newAchievements} onDone={clearAchievements} />
      )}

      <div className="glass mb-4 overflow-hidden" style={{ borderRadius: 20, border: '1px solid rgba(251,191,36,0.15)' }}>
        {/* Header */}
        <button
          className="w-full flex items-center justify-between p-4 pb-3"
          onClick={() => setCollapsed(v => !v)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
              <Target size={15} />
            </div>
            <div className="text-left">
              <div className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>
                Misiones de hoy
              </div>
              {!collapsed && total > 0 && (
                <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                  {completed}/{total} completadas · {pct}%
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <Flame size={11} style={{ color: '#f97316' }} />
                <span className="text-[11px] num font-bold" style={{ color: '#fb923c' }}>{streak}</span>
              </div>
            )}
            {collapsed
              ? <ChevronDown size={14} style={{ color: 'var(--text-2)' }} />
              : <ChevronUp size={14} style={{ color: 'var(--text-2)' }} />
            }
          </div>
        </button>

        {!collapsed && (
          <div className="px-4 pb-4 space-y-2">
            {/* Barra de progreso */}
            {total > 0 && (
              <div className="w-full rounded-full h-1.5 mb-3"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100
                      ? 'linear-gradient(90deg, #34d399, #10b981)'
                      : 'linear-gradient(90deg, #fbbf24, #f97316)',
                  }} />
              </div>
            )}

            {/* Lista de misiones */}
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-2)' }} />
              </div>
            ) : total === 0 ? (
              <div className="text-center py-4 text-[13px]" style={{ color: 'var(--text-2)' }}>
                No hay misiones para hoy.{' '}
                <button onClick={() => setShowForm(true)} className="underline" style={{ color: '#fbbf24' }}>
                  Creá una
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {missions.map(m => (
                  <div key={m.id} className="relative flex items-center gap-3 py-2 px-1 rounded-xl transition-all"
                    style={{ opacity: m.completed ? 0.55 : 1 }}>
                    {/* Checkbox */}
                    <button
                      onClick={() => void handleComplete(m.id, m.xp_reward, m.completed)}
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: m.completed ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${m.completed ? '#34d399' : 'rgba(255,255,255,0.15)'}`,
                      }}>
                      {m.completed && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    {/* Icono + título */}
                    <span className="text-[14px]">{CATEGORY_ICONS[m.category]}</span>
                    <span className="flex-1 text-[13px]"
                      style={{
                        color: 'var(--text-0)',
                        textDecoration: m.completed ? 'line-through' : 'none',
                      }}>
                      {m.title}
                    </span>

                    {/* XP badge */}
                    <span className="text-[11px] num font-semibold shrink-0"
                      style={{ color: 'rgba(251,191,36,0.7)' }}>
                      +{m.xp_reward} XP
                    </span>

                    {/* XP pop */}
                    {xpPops.map(p => (
                      <XpPop key={p.id} xp={p.xp} onDone={() =>
                        setXpPops(prev => prev.filter(x => x.id !== p.id))
                      } />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Formulario */}
            {showForm ? (
              <NewMissionForm
                onAdd={data => create({ ...data, source: 'user' })}
                onClose={() => setShowForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full mt-1 py-2 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  color: 'var(--text-2)',
                }}>
                <Plus size={12} />
                Agregar misión custom
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
