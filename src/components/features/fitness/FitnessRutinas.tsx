'use client'

import { useState, useCallback, useEffect } from 'react'
import { Dumbbell, Play, Plus, Minus, X, Check, Trash2, Timer, Moon, Zap, Flame, History, LayoutTemplate, Pencil } from 'lucide-react'
import { useWorkoutRoutines } from '@/hooks/useWorkoutRoutines'
import { useWorkoutSession, useSessionHistory } from '@/hooks/useWorkoutSession'
import { FitnessTemplates } from './FitnessTemplates'
import { ALL_EXERCISES } from '@/constants/EXERCISES'
import type {
  WorkoutRoutineWithExercises,
  WorkoutCategory,
  WorkoutPreFeelingInput,
  WorkoutPostFeelingInput,
  SessionFeeling,
  WorkoutSessionWithSets,
  PersonalRecord,
  CreateRoutineExerciseInput,
  RoutineExercise,
  SetTarget,
} from '@/types/database.types'

const CATEGORY_COLORS: Record<WorkoutCategory, string> = {
  gym: '#8b5cf6',
  running: '#34d399',
  bici: '#38bdf8',
  otro: '#f97316',
}

const FEELING_OPTIONS: Array<{ value: SessionFeeling; emoji: string; label: string; color: string }> = [
  { value: 'mal',       emoji: '😞', label: 'Mal',       color: '#ef4444' },
  { value: 'regular',   emoji: '😐', label: 'Regular',   color: '#f97316' },
  { value: 'bien',      emoji: '😊', label: 'Bien',      color: '#34d399' },
  { value: 'excelente', emoji: '🤩', label: 'Excelente', color: '#fbbf24' },
]

const ENERGY_LABELS   = ['Sin energía', 'Poca', 'Normal', 'Buena', 'Máxima']
const SORENESS_LABELS = ['Sin dolor', 'Mínimo', 'Leve', 'Moderado', 'Intenso', 'Muy intenso']

// ─── Stepper (sin teclado: −/+ ) ──────────────────────────────

function Stepper({ value, onChange, step = 1, min = 0, max, suffix = '', label, color = '#8b5cf6' }: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  label?: string
  color?: string
}) {
  const round = (n: number) => Math.round(n * 100) / 100
  const dec = () => onChange(round(Math.max(min, value - step)))
  const inc = () => onChange(round(max !== undefined ? Math.min(max, value + step) : value + step))
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] num uppercase tracking-[0.12em] text-center" style={{ color: 'var(--text-2)' }}>{label}</span>}
      <div className="flex items-center rounded-xl overflow-hidden select-none"
        style={{ border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
        <button type="button" onClick={dec} aria-label="menos"
          className="w-10 h-11 flex items-center justify-center shrink-0 transition-colors active:bg-white/[0.07]"
          style={{ color: 'var(--text-1)' }}>
          <Minus size={15} />
        </button>
        <span className="flex-1 text-center text-[16px] font-semibold num tabular-nums" style={{ color: 'var(--text-0)', minWidth: 40 }}>
          {value}{suffix}
        </span>
        <button type="button" onClick={inc} aria-label="más"
          className="w-10 h-11 flex items-center justify-center shrink-0 transition-colors active:bg-white/[0.07]"
          style={{ color }}>
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── New routine form ─────────────────────────────────────────

function NewRoutineForm({ onCreate, onCancel }: {
  onCreate: (name: string, category: WorkoutCategory) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<WorkoutCategory>('gym')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onCreate(name.trim(), category)
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="glass p-4 space-y-3" style={{ borderRadius: 16, border: '1px solid rgba(139,92,246,0.25)' }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la rutina" required
        className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px]"
        style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
      <div className="flex gap-2">
        {(['gym', 'running', 'bici', 'otro'] as WorkoutCategory[]).map(c => (
          <button key={c} type="button" onClick={() => setCategory(c)}
            className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors capitalize"
            style={{
              background: category === c ? `${CATEGORY_COLORS[c]}22` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${category === c ? CATEGORY_COLORS[c] : 'var(--line)'}`,
              color: category === c ? CATEGORY_COLORS[c] : 'var(--text-2)',
            }}>{c}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: '#8b5cf6', color: '#fff' }}>
          {saving ? 'Creando...' : 'Crear rutina'}
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

// ─── Scale selector ───────────────────────────────────────────

function ScaleSelector({ value, onChange, color, min = 1, max = 5 }: {
  value: number | null
  onChange: (v: number) => void
  color: string
  min?: number
  max?: number
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min)
  return (
    <div className="flex gap-1.5">
      {steps.map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all"
          style={{
            background: value === n ? `${color}22` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${value === n ? color : 'var(--line)'}`,
            color: value === n ? color : 'var(--text-2)',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

// ─── Pre-session form ─────────────────────────────────────────

function PreSessionForm({ routineName, onStart, onSkip }: {
  routineName: string
  onStart: (data: WorkoutPreFeelingInput) => Promise<void>
  onSkip: () => Promise<void>
}) {
  const [energy, setEnergy] = useState<number | null>(null)
  const [sleep, setSleep] = useState('')
  const [soreness, setSoreness] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onStart({
        energy_level: energy,
        sleep_hours: sleep ? parseFloat(sleep) : null,
        muscle_soreness: soreness,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)}
      className="glass space-y-5 p-5"
      style={{ borderRadius: 20, border: '1px solid rgba(139,92,246,0.25)' }}>

      <div>
        <div className="text-[10px] num uppercase tracking-[0.18em] mb-1" style={{ color: '#8b5cf6' }}>
          {routineName}
        </div>
        <h3 className="text-[17px] font-bold display" style={{ color: 'var(--text-0)' }}>
          ¿Cómo te sentís hoy?
        </h3>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-2)' }}>
          Antes de arrancar — todos los campos son opcionales
        </p>
      </div>

      {/* Energy */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap size={13} style={{ color: '#fbbf24' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-1)' }}>
            Energía{energy ? ` — ${ENERGY_LABELS[energy - 1]}` : ''}
          </span>
        </div>
        <ScaleSelector value={energy} onChange={setEnergy} color="#fbbf24" min={1} max={5} />
      </div>

      {/* Muscle soreness */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Flame size={13} style={{ color: '#f97316' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-1)' }}>
            Dolor muscular pre-sesión{soreness !== null ? ` — ${SORENESS_LABELS[soreness]}` : ''}
          </span>
        </div>
        <ScaleSelector value={soreness} onChange={setSoreness} color="#f97316" min={0} max={5} />
      </div>

      {/* Sleep */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Moon size={13} style={{ color: '#38bdf8' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-1)' }}>
            ¿Cuántas horas dormiste anoche?
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={sleep}
            onChange={e => setSleep(e.target.value)}
            placeholder="ej. 7.5"
            min="0" max="24" step="0.5"
            className="w-28 bg-transparent border rounded-xl px-3 py-2.5 text-[14px] num"
            style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }}
          />
          <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>horas</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: '#8b5cf6', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Iniciando...' : 'Empezar sesión'}
        </button>
        <button type="button" onClick={() => void onSkip()} disabled={saving}
          className="py-2.5 px-4 rounded-xl text-[13px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          Omitir
        </button>
      </div>
    </form>
  )
}

// ─── Post-session form ────────────────────────────────────────

function PostSessionForm({ onSubmit, onSkip, saving }: {
  onSubmit: (data: WorkoutPostFeelingInput) => Promise<void>
  onSkip: () => Promise<void>
  saving: boolean
}) {
  const [feeling, setFeeling] = useState<SessionFeeling | null>(null)
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      session_feeling: feeling,
      post_session_notes: notes.trim() || null,
    })
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}
      className="glass space-y-5 p-5"
      style={{ borderRadius: 20, border: '1px solid rgba(52,211,153,0.25)' }}>

      <div>
        <div className="text-[10px] num uppercase tracking-[0.18em] mb-1" style={{ color: '#34d399' }}>
          Sesión completada ✓
        </div>
        <h3 className="text-[17px] font-bold display" style={{ color: 'var(--text-0)' }}>
          ¿Cómo te fue?
        </h3>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-2)' }}>
          Reflexión post-sesión — opcional
        </p>
      </div>

      {/* Session feeling */}
      <div className="space-y-2">
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-1)' }}>
          Sensación general
        </span>
        <div className="grid grid-cols-4 gap-2">
          {FEELING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFeeling(opt.value)}
              className="py-3 rounded-xl flex flex-col items-center gap-1 transition-all"
              style={{
                background: feeling === opt.value ? `${opt.color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${feeling === opt.value ? opt.color : 'var(--line)'}`,
              }}
            >
              <span className="text-[20px] leading-none">{opt.emoji}</span>
              <span className="text-[10px] font-medium" style={{ color: feeling === opt.value ? opt.color : 'var(--text-2)' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-1)' }}>
          Notas libres (opcional)
        </span>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="¿Qué salió bien? ¿Qué mejorar? ¿Cómo estuvo la energía?"
          rows={3}
          className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px] resize-none"
          style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: '#34d399', color: '#0a0a0a', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : 'Completar sesión'}
        </button>
        <button type="button" onClick={() => void onSkip()} disabled={saving}
          className="py-2.5 px-4 rounded-xl text-[13px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          Omitir
        </button>
      </div>
    </form>
  )
}

// ─── Active session view ──────────────────────────────────────

function ActiveSession({ routine, session, sets, onAddSet, onRemoveSet, onFinish, onDiscard }: {
  routine: WorkoutRoutineWithExercises | null
  session: { id: string; routine_name_snapshot: string; started_at: string }
  sets: Array<{ id: string; exercise_name: string; set_number: number; reps?: number | null; weight_kg?: number | null }>
  onAddSet: (exerciseName: string, setNumber: number, data: { reps?: number; weight_kg?: number }) => Promise<unknown>
  onRemoveSet: (id: string) => void
  onFinish: (postFeeling?: WorkoutPostFeelingInput) => Promise<void>
  onDiscard: () => void
}) {
  const [activeEx, setActiveEx] = useState<string | null>(routine?.routine_exercises[0]?.exercise_name ?? null)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState(0)
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showPostFeeling, setShowPostFeeling] = useState(false)
  const [extraExercises, setExtraExercises] = useState<string[]>([])
  const [newExName, setNewExName] = useState('')

  // Routine exercises + ad-hoc ones added during the session
  const exercises = [
    ...(routine?.routine_exercises.map(e => ({ id: e.id, exercise_name: e.exercise_name })) ?? []),
    ...extraExercises.map(name => ({ id: `extra-${name}`, exercise_name: name })),
  ]

  const addExtraExercise = () => {
    const name = newExName.trim()
    if (!name || exercises.some(e => e.exercise_name === name)) { setNewExName(''); return }
    setExtraExercises(prev => [...prev, name])
    setActiveEx(name)
    setNewExName('')
  }
  const setsForEx = (name: string) => sets.filter(s => s.exercise_name === name)
  const nextSetNum = (name: string) => setsForEx(name).length + 1
  const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000)

  // Al elegir un ejercicio, prefijar reps/peso con su objetivo de la 1ª serie
  useEffect(() => {
    if (!activeEx) return
    const rex = routine?.routine_exercises.find(e => e.exercise_name === activeEx)
    const t = (rex ? exerciseSummary(rex) : [])[0]
    if (t?.reps) setReps(t.reps)
    if (t?.weight) setWeight(t.weight)
  }, [activeEx, routine])

  const addSet = async () => {
    if (!activeEx || reps <= 0) return
    setSaving(true)
    try {
      await onAddSet(activeEx, nextSetNum(activeEx), {
        reps,
        weight_kg: weight > 0 ? weight : undefined,
      })
      // mantenemos reps/peso para la siguiente serie (suele repetirse)
    } finally {
      setSaving(false)
    }
  }

  const submitPost = async (postFeeling: WorkoutPostFeelingInput) => {
    setFinishing(true)
    try {
      await onFinish(postFeeling)
    } finally {
      setFinishing(false)
    }
  }

  if (showPostFeeling) {
    return (
      <PostSessionForm
        saving={finishing}
        onSubmit={submitPost}
        onSkip={() => submitPost({})}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="glass p-4 flex items-center justify-between" style={{ borderRadius: 16, border: '1px solid rgba(139,92,246,0.3)' }}>
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: '#8b5cf6' }}>Sesión activa</div>
          <div className="text-[15px] font-semibold" style={{ color: 'var(--text-0)' }}>{session.routine_name_snapshot}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Timer size={12} style={{ color: 'var(--text-2)' }} />
            <span className="text-[12px] num" style={{ color: 'var(--text-2)' }}>{elapsed} min</span>
            <span className="text-[12px] num ml-2" style={{ color: 'var(--text-2)' }}>{sets.length} sets</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onDiscard}
            className="px-3 py-2 rounded-xl text-[12px]"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
            Descartar
          </button>
          <button onClick={() => setShowPostFeeling(true)}
            className="px-3 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background: '#34d399', color: '#0a0a0a' }}>
            Finalizar
          </button>
        </div>
      </div>

      {/* Exercise selector */}
      <div className="space-y-2">
        {exercises.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {exercises.map(ex => (
              <button key={ex.id} onClick={() => setActiveEx(ex.exercise_name)}
                className="shrink-0 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors"
                style={{
                  background: activeEx === ex.exercise_name ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeEx === ex.exercise_name ? 'rgba(139,92,246,0.4)' : 'var(--line)'}`,
                  color: activeEx === ex.exercise_name ? '#8b5cf6' : 'var(--text-2)',
                }}>
                {ex.exercise_name}
                {setsForEx(ex.exercise_name).length > 0 && (
                  <span className="ml-1.5 text-[10px]" style={{ color: '#34d399' }}>
                    {setsForEx(ex.exercise_name).length}✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        {/* Add an exercise on the fly */}
        <div className="flex gap-1.5">
          <input value={newExName} onChange={e => setNewExName(e.target.value)} list="exercise-library"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExtraExercise() } }}
            placeholder={exercises.length === 0 ? 'Agregá un ejercicio para empezar' : 'Agregar otro ejercicio'}
            className="flex-1 min-w-0 bg-transparent border rounded-xl px-3 py-2 text-[12.5px]"
            style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
          <button onClick={addExtraExercise} disabled={!newExName.trim()}
            className="w-10 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: '#8b5cf6', color: '#fff', opacity: !newExName.trim() ? 0.5 : 1 }}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Set logger */}
      {activeEx && (() => {
        const routineEx = routine?.routine_exercises.find(e => e.exercise_name === activeEx)
        const plan = routineEx ? exerciseSummary(routineEx) : []
        const targetSet = plan[nextSetNum(activeEx) - 1] ?? null
        return (
        <div className="glass p-4 space-y-4" style={{ borderRadius: 16 }}>
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>
              {activeEx} — Set {nextSetNum(activeEx)}
            </div>
            {targetSet && (targetSet.reps || targetSet.weight) && (
              <span className="text-[11px] num px-2 py-0.5 rounded-md tabular-nums"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                objetivo {targetSet.reps ?? '—'}{targetSet.weight ? ` × ${targetSet.weight}kg` : ''}
              </span>
            )}
          </div>

          {setsForEx(activeEx).length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Sets completados</div>
              {setsForEx(activeEx).map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                  style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                  <span className="text-[12px] num" style={{ color: 'var(--text-2)' }}>Set {s.set_number}</span>
                  <span className="text-[13px] font-semibold num" style={{ color: '#34d399' }}>
                    {s.weight_kg ? `${s.weight_kg}kg × ` : ''}{s.reps} reps
                  </span>
                  <button onClick={() => onRemoveSet(s.id)}
                    className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Stepper label="Reps" value={reps} onChange={setReps} step={1} color="#8b5cf6" />
            </div>
            <div className="flex-1">
              <Stepper label="Peso (kg)" value={weight} onChange={setWeight} step={2.5} color="#8b5cf6" />
            </div>
            <button onClick={() => void addSet()} disabled={saving || reps <= 0}
              className="h-11 w-12 shrink-0 rounded-xl flex items-center justify-center transition-opacity"
              style={{ background: '#8b5cf6', color: '#fff', opacity: reps <= 0 ? 0.5 : 1 }}>
              <Check size={18} />
            </button>
          </div>
        </div>
        )
      })()}
    </div>
  )
}

// ─── Session history card ─────────────────────────────────────

function SessionHistoryItem({ session }: { session: WorkoutSessionWithSets }) {
  const date = new Date(session.started_at)
  const dayLabel = date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  const feelingOpt = FEELING_OPTIONS.find(o => o.value === session.session_feeling)

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>
          {session.routine_name_snapshot}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
            {dayLabel}
          </span>
          {session.duration_minutes && (
            <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
              · {session.duration_minutes} min
            </span>
          )}
          {session.workout_sets.length > 0 && (
            <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
              · {session.workout_sets.length} sets
            </span>
          )}
        </div>
      </div>

      {/* Feeling indicators */}
      <div className="flex items-center gap-2 shrink-0">
        {session.energy_level && (
          <div className="flex items-center gap-0.5" title={`Energía: ${session.energy_level}/5`}>
            <Zap size={11} style={{ color: '#fbbf24' }} />
            <span className="text-[11px] num" style={{ color: '#fbbf24' }}>{session.energy_level}</span>
          </div>
        )}
        {session.muscle_soreness !== null && session.muscle_soreness > 0 && (
          <div className="flex items-center gap-0.5" title={`Dolor: ${session.muscle_soreness}/5`}>
            <Flame size={11} style={{ color: '#f97316' }} />
            <span className="text-[11px] num" style={{ color: '#f97316' }}>{session.muscle_soreness}</span>
          </div>
        )}
        {feelingOpt && (
          <span className="text-[16px]" title={feelingOpt.label}>{feelingOpt.emoji}</span>
        )}
      </div>
    </div>
  )
}

// ─── Helpers: resumen de series de un ejercicio ───────────────

function exerciseSummary(ex: RoutineExercise): SetTarget[] {
  if (ex.sets_detail && ex.sets_detail.length > 0) return ex.sets_detail
  const n = ex.target_sets ?? 0
  if (n > 0) {
    const reps = ex.target_reps ? parseInt(ex.target_reps, 10) : null
    return Array.from({ length: n }, () => ({ reps: isNaN(reps as number) ? null : reps, weight: ex.target_weight }))
  }
  return []
}

function SetChip({ s }: { s: SetTarget }) {
  return (
    <span className="num text-[10.5px] px-1.5 py-0.5 rounded-md tabular-nums"
      style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)', border: '1px solid var(--line)' }}>
      {s.reps ?? '—'}{s.weight ? ` · ${s.weight}kg` : ''}
    </span>
  )
}

// ─── Exercise editor (inside a routine card) ──────────────────

function ExerciseEditor({ routine, color, onAdd, onRemove }: {
  routine: WorkoutRoutineWithExercises
  color: string
  onAdd: (input: CreateRoutineExerciseInput) => Promise<unknown>
  onRemove: (id: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [rows, setRows] = useState<{ reps: number; weight: number }[]>([{ reps: 10, weight: 0 }])
  const [saving, setSaving] = useState(false)

  const setRow = (i: number, field: 'reps' | 'weight', val: number) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  const addRow = () => setRows(rs => [...rs, { ...(rs[rs.length - 1] ?? { reps: 10, weight: 0 }) }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)

  const reset = () => { setName(''); setRows([{ reps: 10, weight: 0 }]) }

  const add = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const detail: SetTarget[] = rows.map(r => ({
        reps: r.reps > 0 ? r.reps : null,
        weight: r.weight > 0 ? r.weight : null,
      }))
      const weights = detail.map(s => s.weight).filter((w): w is number => w !== null)
      await onAdd({
        routine_id: routine.id,
        exercise_name: name.trim(),
        order_index: routine.routine_exercises.length,
        target_sets: detail.length,
        target_reps: detail[0]?.reps ? String(detail[0].reps) : null,
        target_weight: weights.length ? Math.max(...weights) : null,
        sets_detail: detail,
      })
      reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--line)' }}>
      {/* Existing exercises */}
      {routine.routine_exercises.length === 0 ? (
        <div className="text-[12px] py-1" style={{ color: 'var(--text-2)' }}>
          Todavía no hay ejercicios. Agregá el primero 👇
        </div>
      ) : (
        <div className="space-y-2">
          {routine.routine_exercises.map(ex => {
            const summary = exerciseSummary(ex)
            return (
              <div key={ex.id} className="py-2 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>{ex.exercise_name}</span>
                  <button onClick={() => void onRemove(ex.id)}
                    className="w-7 h-7 -mr-1 flex items-center justify-center shrink-0 rounded-lg transition-colors hover:bg-white/[0.06]"
                    style={{ color: 'var(--text-2)' }}>
                    <X size={13} />
                  </button>
                </div>
                {summary.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {summary.map((s, i) => <SetChip key={i} s={s} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add form */}
      <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }}>
        <input value={name} onChange={e => setName(e.target.value)} list="exercise-library"
          placeholder="Escribí o elegí un ejercicio"
          className="w-full bg-transparent border rounded-lg px-3 py-2.5 text-[13px]"
          style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />

        {/* Per-set rows con steppers (sin teclado) */}
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] num uppercase tracking-[0.14em]" style={{ color: 'var(--text-2)' }}>Serie {i + 1}</span>
                <button onClick={() => removeRow(i)} disabled={rows.length <= 1}
                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] disabled:opacity-20"
                  style={{ color: 'var(--text-2)' }}>
                  <X size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stepper label="Reps" value={r.reps} onChange={v => setRow(i, 'reps', v)} step={1} color={color} />
                <Stepper label="Peso (kg)" value={r.weight} onChange={v => setRow(i, 'weight', v)} step={2.5} color={color} />
              </div>
            </div>
          ))}
          <button onClick={addRow}
            className="w-full flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-xl transition-colors"
            style={{ color, background: `${color}12`, border: `1px solid ${color}28` }}>
            <Plus size={13} /> Agregar serie
          </button>
        </div>

        <button onClick={() => void add()} disabled={saving || !name.trim()}
          className="w-full py-3 rounded-xl text-[13px] font-semibold transition-opacity"
          style={{ background: color, color: '#fff', opacity: !name.trim() ? 0.4 : 1 }}>
          {saving ? 'Agregando...' : 'Agregar ejercicio'}
        </button>
      </div>
    </div>
  )
}

// ─── Routine list card ────────────────────────────────────────

function RoutineCard({ routine, onStart, onDelete, onAddExercise, onRemoveExercise }: {
  routine: WorkoutRoutineWithExercises
  onStart: (r: WorkoutRoutineWithExercises) => void
  onDelete: (id: string) => Promise<void>
  onAddExercise: (input: CreateRoutineExerciseInput) => Promise<unknown>
  onRemoveExercise: (id: string) => Promise<void>
}) {
  const color = CATEGORY_COLORS[routine.category]
  const [editing, setEditing] = useState(routine.routine_exercises.length === 0)

  return (
    <div className="glass p-4" style={{ borderRadius: 16 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, color }}>
            <Dumbbell size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-0)' }}>{routine.name}</div>
            <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
              {routine.routine_exercises.length} ejercicios · {routine.category}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button onClick={() => setEditing(v => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: editing ? `${color}18` : 'transparent', color: editing ? color : 'var(--text-2)' }}
            title="Editar ejercicios">
            <Pencil size={13} />
          </button>
          <button onClick={() => onStart(routine)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors"
            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
            <Play size={12} />
            Iniciar
          </button>
          <button onClick={() => void onDelete(routine.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ color: 'var(--text-2)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {!editing && routine.routine_exercises.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {routine.routine_exercises.slice(0, 5).map(ex => (
            <span key={ex.id} className="px-2 py-0.5 rounded-md text-[11px]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}>
              {ex.exercise_name}
            </span>
          ))}
          {routine.routine_exercises.length > 5 && (
            <span className="px-2 py-0.5 rounded-md text-[11px]" style={{ color: 'var(--text-2)' }}>
              +{routine.routine_exercises.length - 5} más
            </span>
          )}
        </div>
      )}

      {editing && (
        <ExerciseEditor routine={routine} color={color} onAdd={onAddExercise} onRemove={onRemoveExercise} />
      )}
    </div>
  )
}

// ─── PR toast ─────────────────────────────────────────────────

function PRToast({ prs, onDismiss }: { prs: PersonalRecord[]; onDismiss: () => void }) {
  if (prs.length === 0) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="rounded-2xl p-4 shadow-xl" style={{ background: 'rgba(251,191,36,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-black/70 mb-1">🏆 ¡Nuevo PR!</div>
            {prs.map(pr => (
              <div key={pr.id} className="text-[15px] font-bold text-black">
                {pr.exercise_name}: {pr.value} {pr.unit}
              </div>
            ))}
          </div>
          <button onClick={onDismiss} className="ml-3"><X size={16} className="text-black/60" /></button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

export function FitnessRutinas() {
  const { routines, loading, create, remove, addEx, removeEx, reload: reloadRoutines } = useWorkoutRoutines()
  const { activeSession, sets, newPRs, start, addSet, removeSet, finish, discard } = useWorkoutSession()
  const { sessions: history, load: loadHistory } = useSessionHistory()
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutineWithExercises | null>(null)
  const [pendingRoutine, setPendingRoutine] = useState<WorkoutRoutineWithExercises | null>(null)
  const [showPRs, setShowPRs] = useState(true)
  const [adoptedMsg, setAdoptedMsg] = useState<string | null>(null)

  useEffect(() => {
    void loadHistory(6)
  }, [loadHistory])

  // Clicking "Iniciar" → show pre-session form
  const handleInitiate = useCallback((routine: WorkoutRoutineWithExercises) => {
    setPendingRoutine(routine)
  }, [])

  const handlePreSessionStart = useCallback(async (preFeeling: WorkoutPreFeelingInput) => {
    if (!pendingRoutine) return
    setSelectedRoutine(pendingRoutine)
    setPendingRoutine(null)
    await start(pendingRoutine.id, pendingRoutine.name, preFeeling)
  }, [pendingRoutine, start])

  const handlePreSessionSkip = useCallback(async () => {
    if (!pendingRoutine) return
    setSelectedRoutine(pendingRoutine)
    setPendingRoutine(null)
    await start(pendingRoutine.id, pendingRoutine.name)
  }, [pendingRoutine, start])

  const handleFinish = useCallback(async (postFeeling?: WorkoutPostFeelingInput) => {
    await finish(postFeeling)
    setSelectedRoutine(null)
    setShowPRs(true)
    void loadHistory(6)
  }, [finish, loadHistory])

  const handleDiscard = useCallback(() => {
    discard()
    setSelectedRoutine(null)
    setPendingRoutine(null)
  }, [discard])

  const handleAdopted = useCallback((count: number) => {
    setShowTemplates(false)
    void reloadRoutines()
    setAdoptedMsg(`¡${count} ${count === 1 ? 'rutina creada' : 'rutinas creadas'}!`)
    setTimeout(() => setAdoptedMsg(null), 3000)
  }, [reloadRoutines])

  return (
    <>
      {/* Lista compartida de ejercicios para autocompletar */}
      <datalist id="exercise-library">
        {ALL_EXERCISES.map(ex => <option key={ex} value={ex} />)}
      </datalist>

      {newPRs.length > 0 && showPRs && (
        <PRToast prs={newPRs} onDismiss={() => setShowPRs(false)} />
      )}

      {/* Template browser */}
      {showTemplates && !activeSession && !pendingRoutine && (
        <FitnessTemplates
          onBack={() => setShowTemplates(false)}
          onAdopted={handleAdopted}
        />
      )}

      {/* Pre-session feeling form */}
      {pendingRoutine && !activeSession && (
        <PreSessionForm
          routineName={pendingRoutine.name}
          onStart={handlePreSessionStart}
          onSkip={handlePreSessionSkip}
        />
      )}

      {/* Active session */}
      {activeSession && !pendingRoutine && (
        <ActiveSession
          routine={selectedRoutine}
          session={activeSession}
          sets={sets}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onFinish={handleFinish}
          onDiscard={handleDiscard}
        />
      )}

      {/* Routine list + history */}
      {!activeSession && !pendingRoutine && !showTemplates && (
        <div className="space-y-5">
          {/* Adopted toast */}
          {adoptedMsg && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Check size={14} style={{ color: '#8b5cf6' }} />
              <span className="text-[13px] font-medium" style={{ color: '#8b5cf6' }}>{adoptedMsg}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                <Dumbbell size={14} />
              </div>
              <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Mis rutinas</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTemplates(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-1)', border: '1px solid var(--line)' }}>
                <LayoutTemplate size={13} />
                Plantillas
              </button>
              <button onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Plus size={13} />
                Nueva
              </button>
            </div>
          </div>

          {showForm && (
            <NewRoutineForm
              onCreate={(name, cat) => create({ name, category: cat })}
              onCancel={() => setShowForm(false)}
            />
          )}

          {loading && routines.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-shimmer" />)}
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-12 text-[13px]" style={{ color: 'var(--text-2)' }}>
              Creá tu primera rutina para empezar.
            </div>
          ) : (
            <div className="space-y-3">
              {routines.map(r => (
                <RoutineCard key={r.id} routine={r} onStart={handleInitiate} onDelete={remove}
                  onAddExercise={addEx} onRemoveExercise={removeEx} />
              ))}
            </div>
          )}

          {/* Session history */}
          {history.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <History size={13} style={{ color: 'var(--text-2)' }} />
                <h3 className="text-[12px] font-medium num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>
                  Últimas sesiones
                </h3>
              </div>
              <div className="space-y-2">
                {history.map(s => (
                  <SessionHistoryItem key={s.id} session={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
