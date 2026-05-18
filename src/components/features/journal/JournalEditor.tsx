'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Save, Dumbbell, Utensils, DollarSign, BookOpen, Droplets } from 'lucide-react'
import type { JournalEntry, UpsertJournalEntryInput, DailySnapshot, JournalBlockKey } from '@/types/database.types'

const MOOD_OPTS = [
  { value: 1, label: '😔', desc: 'Mal' },
  { value: 2, label: '😕', desc: 'Regular' },
  { value: 3, label: '😐', desc: 'Normal' },
  { value: 4, label: '🙂', desc: 'Bien' },
  { value: 5, label: '😄', desc: 'Excelente' },
]

const BLOCKS: { key: JournalBlockKey; label: string; placeholder: string }[] = [
  { key: 'what_i_did',      label: '¿Qué hice hoy?',      placeholder: 'Describe tus actividades, tareas, rutinas...' },
  { key: 'what_i_achieved', label: '¿Qué logré?',          placeholder: 'Un logro concreto, por pequeño que sea...' },
  { key: 'how_i_felt',      label: '¿Cómo me sentí?',      placeholder: 'Emociones, energía, estado mental...' },
  { key: 'gratitude',       label: 'Gratitud',             placeholder: 'Tres cosas por las que estás agradecido...' },
  { key: 'tomorrow_focus',  label: 'Foco para mañana',     placeholder: 'Una cosa principal que querés lograr mañana...' },
  { key: 'free_notes',      label: 'Notas libres',         placeholder: 'Cualquier pensamiento, idea, reflexión...' },
]

function MoodSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {MOOD_OPTS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          title={o.desc}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all"
          style={{
            background: value === o.value ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: value === o.value ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
            transform: value === o.value ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <span className="text-[20px] leading-none">{o.label}</span>
          <span className="text-[9px] num uppercase" style={{ color: 'var(--text-2)' }}>{o.desc}</span>
        </button>
      ))}
    </div>
  )
}

function SnapshotPanel({ snapshot }: { snapshot: DailySnapshot }) {
  return (
    <div
      className="glass rounded-xl p-3 space-y-2"
      style={{ border: '1px solid var(--line)' }}
    >
      <div className="text-[11px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
        Snapshot del día
      </div>

      {snapshot.workouts.length > 0 && (
        <div className="flex items-start gap-2">
          <Dumbbell size={13} style={{ color: '#8b5cf6', marginTop: 2 }} />
          <div className="flex-1">
            {snapshot.workouts.map((w, i) => (
              <div key={i} className="text-[12px]" style={{ color: 'var(--text-1)' }}>
                {w.name} {w.duration_minutes ? `(${w.duration_minutes}min)` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {(snapshot.calories > 0 || snapshot.protein > 0) && (
        <div className="flex items-center gap-2">
          <Utensils size={13} style={{ color: '#34d399' }} />
          <span className="text-[12px] num" style={{ color: 'var(--text-1)' }}>
            {snapshot.calories} kcal · {snapshot.protein}g prot
          </span>
        </div>
      )}

      {snapshot.money_spent > 0 && (
        <div className="flex items-center gap-2">
          <DollarSign size={13} style={{ color: '#fbbf24' }} />
          <span className="text-[12px] num" style={{ color: 'var(--text-1)' }}>
            ${snapshot.money_spent.toLocaleString('es-AR', { minimumFractionDigits: 0 })} gastados
          </span>
        </div>
      )}

      {snapshot.skills_studied.length > 0 && (
        <div className="flex items-start gap-2">
          <BookOpen size={13} style={{ color: '#f97316', marginTop: 2 }} />
          <div>
            {snapshot.skills_studied.map((s, i) => (
              <div key={i} className="text-[12px]" style={{ color: 'var(--text-1)' }}>
                {s.name} · {s.hours}h
              </div>
            ))}
          </div>
        </div>
      )}

      {snapshot.water_liters > 0 && (
        <div className="flex items-center gap-2">
          <Droplets size={13} style={{ color: '#38bdf8' }} />
          <span className="text-[12px] num" style={{ color: 'var(--text-1)' }}>
            {snapshot.water_liters.toFixed(1)}L agua
          </span>
        </div>
      )}

      {snapshot.workouts.length === 0 && snapshot.calories === 0 && snapshot.money_spent === 0 &&
       snapshot.skills_studied.length === 0 && snapshot.water_liters === 0 && (
        <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>Sin actividad registrada aún</div>
      )}
    </div>
  )
}

function JournalBlock({
  blockKey,
  label,
  placeholder,
  value,
  onChange,
}: {
  blockKey: JournalBlockKey
  label: string
  placeholder: string
  value: string
  onChange: (key: JournalBlockKey, v: string) => void
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (value) setOpen(true)
  }, [value])

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: '1px solid var(--line)' }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.03]"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <span className="text-[13px] font-medium" style={{ color: value ? 'var(--text-0)' : 'var(--text-1)' }}>
          {label}
          {value && <span className="ml-2 text-[10px] num" style={{ color: 'var(--text-2)' }}>• editado</span>}
        </span>
        {open ? <ChevronUp size={14} style={{ color: 'var(--text-2)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-2)' }} />}
      </button>
      {open && (
        <div style={{ background: 'rgba(0,0,0,0.15)' }}>
          <textarea
            value={value}
            onChange={(e) => onChange(blockKey, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-4 py-3 resize-none bg-transparent text-[13px] outline-none"
            style={{ color: 'var(--text-0)' }}
          />
        </div>
      )}
    </div>
  )
}

interface JournalEditorProps {
  date: string
  entry: JournalEntry | null
  snapshot: DailySnapshot | null
  saving: boolean
  onSave: (date: string, input: UpsertJournalEntryInput) => void
}

const DISPLAY_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function JournalEditor({ date, entry, snapshot, saving, onSave }: JournalEditorProps) {
  const [mood, setMood] = useState<number | null>(null)
  const [fields, setFields] = useState<Record<JournalBlockKey, string>>({
    what_i_did: '',
    what_i_achieved: '',
    how_i_felt: '',
    gratitude: '',
    tomorrow_focus: '',
    free_notes: '',
  })
  const initializedDate = useRef<string>('')

  useEffect(() => {
    if (initializedDate.current === date) return
    initializedDate.current = date
    if (entry) {
      setMood(entry.mood ?? null)
      setFields({
        what_i_did:      entry.what_i_did      ?? '',
        what_i_achieved: entry.what_i_achieved ?? '',
        how_i_felt:      entry.how_i_felt      ?? '',
        gratitude:       entry.gratitude       ?? '',
        tomorrow_focus:  entry.tomorrow_focus  ?? '',
        free_notes:      entry.free_notes      ?? '',
      })
    } else {
      setMood(null)
      setFields({ what_i_did: '', what_i_achieved: '', how_i_felt: '', gratitude: '', tomorrow_focus: '', free_notes: '' })
    }
  }, [date, entry])

  function handleMood(v: number) {
    setMood(v)
    onSave(date, { ...fields, mood: v })
  }

  function handleField(key: JournalBlockKey, value: string) {
    const next = { ...fields, [key]: value }
    setFields(next)
    onSave(date, { ...next, mood: mood ?? undefined })
  }

  const [y, m, d] = date.split('-').map(Number)
  const displayDate = `${d} de ${DISPLAY_MONTHS[m - 1]} ${y}`

  return (
    <div className="space-y-5">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Entrada del</div>
          <div className="text-[16px] font-semibold display" style={{ color: 'var(--text-0)' }}>{displayDate}</div>
        </div>
        {saving && (
          <div className="flex items-center gap-1.5 text-[11px] num" style={{ color: 'var(--text-2)' }}>
            <Save size={12} className="animate-pulse" />
            Guardando...
          </div>
        )}
        {!saving && entry && (
          <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
            <Save size={12} className="inline mr-1" />
            Guardado
          </div>
        )}
      </div>

      {/* Mood */}
      <div className="glass rounded-2xl p-4" style={{ border: '1px solid var(--line)' }}>
        <div className="text-[11px] num uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-2)' }}>
          ¿Cómo estuvo tu día?
        </div>
        <MoodSelector value={mood} onChange={handleMood} />
      </div>

      {/* Day snapshot */}
      {snapshot && <SnapshotPanel snapshot={snapshot} />}

      {/* Journal blocks */}
      <div className="space-y-2">
        {BLOCKS.map((b) => (
          <JournalBlock
            key={b.key}
            blockKey={b.key}
            label={b.label}
            placeholder={b.placeholder}
            value={fields[b.key]}
            onChange={handleField}
          />
        ))}
      </div>
    </div>
  )
}
