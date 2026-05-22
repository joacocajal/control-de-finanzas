'use client'

import { useState } from 'react'
import { X, Play, Pause, Square, Clock, Loader2, ChevronRight } from 'lucide-react'
import type { PlannedMinutes, AprendizajeSkill, SkillResource } from '@/types/database.types'
import { useLearningSession } from '@/hooks/useLearningSession'

const PLAN_OPTIONS: { label: string; value: PlannedMinutes; desc: string }[] = [
  { label: '25 min', value: 25, desc: 'Pomodoro' },
  { label: '45 min', value: 45, desc: 'Foco profundo' },
  { label: '60 min', value: 60, desc: '1 hora' },
  { label: '90 min', value: 90, desc: 'Bloque largo' },
  { label: 'Libre', value: null, desc: 'Sin límite' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

function formatCountdown(planned: number, elapsed: number) {
  const remaining = Math.max(0, planned * 60 - elapsed)
  return formatElapsed(remaining)
}

function getProgress(planned: number | null, elapsed: number) {
  if (!planned) return 0
  return Math.min(1, elapsed / (planned * 60))
}

const ACCENT = '#f97316'
const SIZE = 200

interface PlanSelectorProps {
  skill: AprendizajeSkill
  onStart: (planned: PlannedMinutes) => Promise<void>
  onClose: () => void
}

function PlanSelector({ skill, onStart, onClose }: PlanSelectorProps) {
  const [selected, setSelected] = useState<PlannedMinutes>(25)
  const [starting, setStarting] = useState(false)

  async function handleStart() {
    setStarting(true)
    try {
      await onStart(selected)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
            Sesión de estudio
          </div>
          <div className="text-[16px] font-bold display" style={{ color: 'var(--text-0)' }}>
            {skill.nombre_habilidad}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-2)' }}>
          <X size={16} />
        </button>
      </div>

      <div>
        <div className="text-[11px] num uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-2)' }}>
          ¿Cuánto tiempo?
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PLAN_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setSelected(opt.value)}
              className="flex flex-col items-center gap-0.5 py-3 rounded-xl transition-all"
              style={{
                background: selected === opt.value ? `${ACCENT}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selected === opt.value ? `${ACCENT}50` : 'var(--line)'}`,
              }}
            >
              <span className="text-[14px] font-bold num" style={{ color: selected === opt.value ? ACCENT : 'var(--text-1)' }}>
                {opt.label}
              </span>
              <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => void handleStart()}
        disabled={starting}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] transition-all"
        style={{
          background: `linear-gradient(135deg, ${ACCENT}, #ea580c)`,
          color: '#fff',
          opacity: starting ? 0.7 : 1,
        }}
      >
        {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {starting ? 'Iniciando...' : 'Iniciar sesión'}
      </button>
    </div>
  )
}

interface ActiveTimerProps {
  elapsed: number
  planned: PlannedMinutes
  isRunning: boolean
  whatStudied: string
  resources: SkillResource[]
  selectedResourceId: string | null
  onPause: () => void
  onResume: () => void
  onFinish: () => void
  onWhatStudied: (v: string) => void
  onSelectResource: (id: string | null) => void
}

function ActiveTimer({
  elapsed, planned, isRunning, whatStudied, resources,
  selectedResourceId, onPause, onResume, onFinish, onWhatStudied, onSelectResource,
}: ActiveTimerProps) {
  const progress = getProgress(planned, elapsed)
  const radius = (SIZE / 2) - 16
  const circumference = 2 * Math.PI * radius

  return (
    <div className="p-6 space-y-5">
      {/* Circular timer */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="rotate-[-90deg]">
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={radius}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10}
            />
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={radius}
              fill="none" stroke={ACCENT} strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - (planned ? progress : (elapsed % 60) / 60))}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[36px] font-bold num tracking-tight" style={{ color: 'var(--text-0)' }}>
              {planned ? formatCountdown(planned, elapsed) : formatElapsed(elapsed)}
            </div>
            <div className="text-[11px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
              {planned ? 'restante' : 'transcurrido'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={isRunning ? onPause : onResume}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-[13px] transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--line)',
              color: 'var(--text-0)',
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pausar' : 'Reanudar'}
          </button>
          <button
            onClick={onFinish}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-[13px] transition-all"
            style={{
              background: `${ACCENT}18`,
              border: `1px solid ${ACCENT}40`,
              color: ACCENT,
            }}
          >
            <Square size={14} />
            Terminar
          </button>
        </div>
      </div>

      {/* What studied */}
      <div>
        <div className="text-[11px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
          ¿Qué estás estudiando?
        </div>
        <textarea
          value={whatStudied}
          onChange={(e) => onWhatStudied(e.target.value)}
          placeholder="Tema, capítulo, ejercicio..."
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 bg-transparent text-[13px] resize-none outline-none"
          style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
        />
      </div>

      {/* Resource selector */}
      {resources.length > 0 && (
        <div>
          <div className="text-[11px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
            ¿Recurso que estás consumiendo? (opcional)
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectResource(null)}
              className="w-full text-left px-3 py-2 rounded-lg text-[12px] transition-all"
              style={{
                background: !selectedResourceId ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: `1px solid ${!selectedResourceId ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                color: 'var(--text-2)',
              }}
            >
              Ninguno
            </button>
            {resources.filter((r) => r.status !== 'consumido' && r.status !== 'descartado').map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectResource(r.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] transition-all flex items-center justify-between"
                style={{
                  background: selectedResourceId === r.id ? `${ACCENT}12` : 'transparent',
                  border: `1px solid ${selectedResourceId === r.id ? `${ACCENT}40` : 'transparent'}`,
                  color: selectedResourceId === r.id ? ACCENT : 'var(--text-1)',
                }}
              >
                <span>{r.title}</span>
                {selectedResourceId === r.id && <ChevronRight size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PostSessionFormProps {
  durationMinutes: number
  skillName: string
  onSave: (wasCompleted: boolean, notes: string) => Promise<void>
}

function PostSessionForm({ durationMinutes, skillName, onSave }: PostSessionFormProps) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(wasCompleted: boolean) {
    setSaving(true)
    try {
      await onSave(wasCompleted, notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="text-center">
        <div className="text-[32px] mb-1">🔥</div>
        <div className="text-[16px] font-bold display" style={{ color: 'var(--text-0)' }}>
          Sesión finalizada
        </div>
        <div className="text-[13px] num mt-1" style={{ color: 'var(--text-2)' }}>
          {durationMinutes} min en {skillName}
        </div>
      </div>

      <div>
        <div className="text-[11px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
          ¿Completaste el objetivo? (opcional: notas finales)
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Qué aprendiste? ¿Qué quedó pendiente?..."
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 bg-transparent text-[13px] resize-none outline-none mb-3"
          style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => void submit(false)}
            disabled={saving}
            className="py-2.5 rounded-xl font-medium text-[13px] transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-2)' }}
          >
            {saving ? <Loader2 size={13} className="animate-spin mx-auto" /> : 'Corté antes'}
          </button>
          <button
            onClick={() => void submit(true)}
            disabled={saving}
            className="py-2.5 rounded-xl font-semibold text-[13px] transition-all"
            style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40`, color: ACCENT }}
          >
            {saving ? <Loader2 size={13} className="animate-spin mx-auto" /> : '✓ Completé'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface LearningSessionTimerProps {
  skill: AprendizajeSkill
  resources: SkillResource[]
  preselectedResourceId?: string | null
  onClose: () => void
  onFinished: (durationMinutes: number, wasCompleted: boolean) => void
}

export function LearningSessionTimer({ skill, resources, preselectedResourceId, onClose, onFinished }: LearningSessionTimerProps) {
  const { activeSession, elapsed, isRunning, start, pause, resume, finish, updateWhatStudied } = useLearningSession()
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(preselectedResourceId ?? null)
  const [postSession, setPostSession] = useState<{ duration: number; sessionId: string } | null>(null)

  async function handleFinish() {
    pause()
    const durationMinutes = Math.max(1, Math.round(elapsed / 60))
    const sessionId = (activeSession as { id: string } | null)?.id ?? ''
    setPostSession({ duration: durationMinutes, sessionId })
  }

  async function handlePostSave(wasCompleted: boolean, notes: string) {
    if (postSession?.sessionId) {
      await finish({ was_completed: wasCompleted, notes: notes || null })
    }
    onFinished(postSession?.duration ?? 0, wasCompleted)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)' }}
      >
        {!activeSession && !postSession && (
          <PlanSelector
            skill={skill}
            onStart={(planned) => start(skill.id, planned)}
            onClose={onClose}
          />
        )}
        {activeSession && !postSession && (
          <ActiveTimer
            elapsed={elapsed}
            planned={activeSession.planned_minutes as PlannedMinutes}
            isRunning={isRunning}
            whatStudied={activeSession.what_studied ?? ''}
            resources={resources}
            selectedResourceId={selectedResourceId}
            onPause={pause}
            onResume={resume}
            onFinish={() => void handleFinish()}
            onWhatStudied={updateWhatStudied}
            onSelectResource={setSelectedResourceId}
          />
        )}
        {postSession && (
          <PostSessionForm
            durationMinutes={postSession.duration}
            skillName={skill.nombre_habilidad}
            onSave={handlePostSave}
          />
        )}

        {/* Always show clock icon in header for context */}
        <div className="px-6 pb-4 flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
          <Clock size={11} />
          <span className="text-[10px] num uppercase tracking-[0.12em]">
            {activeSession ? 'Sesión activa' : postSession ? 'Sesión completada' : 'Iniciar sesión'}
          </span>
        </div>
      </div>
    </div>
  )
}
