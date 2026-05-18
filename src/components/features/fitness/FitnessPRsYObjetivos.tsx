'use client'

import { useState } from 'react'
import { Award, Target, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { usePersonalRecords } from '@/hooks/usePersonalRecords'
import { useFitnessGoals } from '@/hooks/useFitnessGoals'
import type { FitnessGoalType, CreatePersonalRecordInput } from '@/types/database.types'

const GOAL_LABELS: Record<FitnessGoalType, { label: string; unit: string; color: string }> = {
  daily_calories:    { label: 'Calorías diarias',  unit: 'kcal', color: '#f97316' },
  daily_protein:     { label: 'Proteína diaria',   unit: 'g',    color: '#8b5cf6' },
  daily_carbs:       { label: 'Carbohidratos',     unit: 'g',    color: '#fbbf24' },
  daily_fat:         { label: 'Grasas',            unit: 'g',    color: '#f87171' },
  daily_water_liters:{ label: 'Agua diaria',       unit: 'L',    color: '#38bdf8' },
}

function GoalCard({ type, value, onSave }: { type: FitnessGoalType; value?: number; onSave: (v: number) => Promise<void> }) {
  const meta = GOAL_LABELS[type]
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value ?? ''))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const v = parseFloat(input)
    if (isNaN(v) || v <= 0) return
    setSaving(true)
    try {
      await onSave(v)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}18`, color: meta.color }}>
            <Target size={13} />
          </div>
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{meta.label}</span>
        </div>
        {!editing && (
          <button onClick={() => { setInput(String(value ?? '')); setEditing(true) }}
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ color: 'var(--text-2)' }}>
            <Pencil size={12} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent border rounded-lg px-3 py-1.5 text-[13px] num"
            style={{ borderColor: meta.color, color: 'var(--text-0)', outline: 'none' }}
            placeholder="0"
          />
          <span className="text-[12px] num" style={{ color: 'var(--text-2)' }}>{meta.unit}</span>
          <button onClick={() => void save()} disabled={saving} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}22`, color: meta.color }}>
            <Check size={13} />
          </button>
          <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-bold num leading-none" style={{ color: 'var(--text-0)' }}>
            {value ?? '—'}
          </span>
          <span className="text-[13px] num" style={{ color: 'var(--text-2)' }}>{meta.unit}</span>
        </div>
      )}
    </div>
  )
}

function PRForm({ onSubmit, onCancel }: { onSubmit: (input: CreatePersonalRecordInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = parseFloat(value)
    if (!name.trim() || isNaN(v)) return
    setSaving(true)
    try {
      await onSubmit({ category: 'gym', exercise_name: name.trim(), value: v, unit })
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="glass p-4 rounded-xl space-y-3" style={{ borderRadius: 14, border: '1px solid rgba(139,92,246,0.25)' }}>
      <div className="text-[12px] font-semibold" style={{ color: '#8b5cf6' }}>Nuevo PR</div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Ejercicio (ej: Sentadilla)"
        className="w-full bg-transparent border rounded-lg px-3 py-2 text-[13px]"
        style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }}
        required
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Valor"
          className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-[13px] num"
          style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }}
          required
        />
        <select
          value={unit}
          onChange={e => setUnit(e.target.value)}
          className="bg-transparent border rounded-lg px-3 py-2 text-[13px]"
          style={{ borderColor: 'var(--line)', color: 'var(--text-1)', outline: 'none' }}
        >
          <option value="kg">kg</option>
          <option value="km">km</option>
          <option value="min">min</option>
          <option value="reps">reps</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors"
          style={{ background: '#8b5cf6', color: '#fff' }}>
          {saving ? 'Guardando...' : 'Guardar PR'}
        </button>
        <button type="button" onClick={onCancel}
          className="py-2 px-4 rounded-lg text-[13px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function FitnessPRsYObjetivos() {
  const { records, loading: prsLoading, create, remove } = usePersonalRecords()
  const { goalsMap, upsert, loading: goalsLoading } = useFitnessGoals()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-5">
      {/* Goals */}
      <div className="glass p-5" style={{ borderRadius: 18 }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
            <Target size={14} />
          </div>
          <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Objetivos diarios</h2>
        </div>
        {goalsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl animate-shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(GOAL_LABELS) as FitnessGoalType[]).map(type => (
              <GoalCard
                key={type}
                type={type}
                value={goalsMap[type]}
                onSave={v => upsert({ goal_type: type, target_value: v })}
              />
            ))}
          </div>
        )}
      </div>

      {/* PRs */}
      <div className="glass p-5" style={{ borderRadius: 18 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
              <Award size={14} />
            </div>
            <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Records personales</h2>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Plus size={13} />
            Nuevo PR
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <PRForm onSubmit={create} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {prsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-shimmer" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-[13px]" style={{ color: 'var(--text-2)' }}>
            Sin records aún. ¡Agregá tu primer PR!
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(pr => (
              <div key={pr.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <Award size={14} style={{ color: '#8b5cf6' }} />
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>{pr.exercise_name}</div>
                    <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>{pr.achieved_at}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[18px] font-bold num" style={{ color: '#8b5cf6' }}>{pr.value}</span>
                    <span className="text-[12px] num ml-1" style={{ color: 'var(--text-2)' }}>{pr.unit}</span>
                  </div>
                  <button onClick={() => void remove(pr.id)}
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ color: 'var(--text-2)' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
