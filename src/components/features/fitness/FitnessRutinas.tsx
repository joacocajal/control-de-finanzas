'use client'

import { useState, useCallback, useEffect } from 'react'
import { Dumbbell, Play, Plus, X, Check, Trash2, Timer, Moon, Zap, Flame, History, LayoutTemplate } from 'lucide-react'
import { useWorkoutRoutines } from '@/hooks/useWorkoutRoutines'
import { useWorkoutSession, useSessionHistory } from '@/hooks/useWorkoutSession'
import { FitnessTemplates } from './FitnessTemplates'
import type {
  WorkoutRoutineWithExercises,
  WorkoutCategory,
  WorkoutPreFeelingInput,
  WorkoutPostFeelingInput,
  SessionFeeling,
  WorkoutSessionWithSets,
  PersonalRecord,
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
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showPostFeeling, setShowPostFeeling] = useState(false)

  const exercises = routine?.routine_exercises ?? []
  const setsForEx = (name: string) => sets.filter(s => s.exercise_name === name)
  const nextSetNum = (name: string) => setsForEx(name).length + 1
  const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000)

  const addSet = async () => {
    if (!activeEx || !reps) return
    setSaving(true)
    try {
      await onAddSet(activeEx, nextSetNum(activeEx), {
        reps: parseInt(reps, 10),
        weight_kg: weight ? parseFloat(weight) : undefined,
      })
      setReps('')
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
        {exercises.length === 0 && (
          <div className="text-[12px] px-3 py-2" style={{ color: 'var(--text-2)' }}>
            Sin ejercicios — ingresá el nombre manualmente
          </div>
        )}
      </div>

      {/* Set logger */}
      {activeEx && (
        <div className="glass p-4 space-y-4" style={{ borderRadius: 16 }}>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>
            {activeEx} — Set {nextSetNum(activeEx)}
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

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] num" style={{ color: 'var(--text-2)' }}>Peso (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0"
                className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[14px] num mt-1"
                style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
            </div>
            <div className="flex-1">
              <label className="text-[11px] num" style={{ color: 'var(--text-2)' }}>Reps</label>
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="0"
                className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[14px] num mt-1"
                style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
            </div>
            <div className="self-end">
              <button onClick={() => void addSet()} disabled={saving || !reps}
                className="h-[46px] w-[46px] rounded-xl flex items-center justify-center"
                style={{ background: '#8b5cf6', color: '#fff', opacity: !reps ? 0.5 : 1 }}>
                <Check size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
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

// ─── Routine list card ────────────────────────────────────────

function RoutineCard({ routine, onStart, onDelete }: {
  routine: WorkoutRoutineWithExercises
  onStart: (r: WorkoutRoutineWithExercises) => void
  onDelete: (id: string) => Promise<void>
}) {
  const color = CATEGORY_COLORS[routine.category]

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

      {routine.routine_exercises.length > 0 && (
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
  const { routines, loading, create, remove, reload: reloadRoutines } = useWorkoutRoutines()
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

          {loading ? (
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
                <RoutineCard key={r.id} routine={r} onStart={handleInitiate} onDelete={remove} />
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
