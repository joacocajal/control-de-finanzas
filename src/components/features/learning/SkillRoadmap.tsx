'use client'

import { useState } from 'react'
import {
  Plus, X, Sparkles, Loader2, Trash2, GripVertical,
  CheckCircle2, Circle, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { SkillMilestone, AprendizajeSkill } from '@/types/database.types'

// ─── AI suggestion modal ──────────────────────────────────────

function AISuggestionsModal({
  suggestions,
  onAdopt,
  onClose,
}: {
  suggestions: { title: string; description: string }[]
  onAdopt: (selected: { title: string; description: string }[]) => Promise<void>
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set(suggestions.map((_, i) => i)))
  const [saving, setSaving] = useState(false)

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleAdopt() {
    const toAdopt = suggestions.filter((_, i) => selected.has(i))
    if (toAdopt.length === 0) return
    setSaving(true)
    try {
      await onAdopt(toAdopt)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)', maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}>
              <Sparkles size={15} />
            </div>
            <div>
              <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Ascend AI</div>
              <div className="text-[14px] font-bold display" style={{ color: 'var(--text-0)' }}>Hitos sugeridos</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-2)' }}><X size={15} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="w-full text-left rounded-xl p-3.5 transition-all"
              style={{
                background: selected.has(i) ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selected.has(i) ? 'rgba(129,140,248,0.35)' : 'var(--line)'}`,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {selected.has(i)
                    ? <CheckCircle2 size={16} style={{ color: '#818cf8' }} />
                    : <Circle size={16} style={{ color: 'var(--text-2)' }} />}
                </div>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-0)' }}>{s.title}</div>
                  {s.description && (
                    <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.description}</div>
                  )}
                  <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded-md inline-block" style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8' }}>
                    ✨ IA
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--line)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px]" style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}>
            Cancelar
          </button>
          <button
            onClick={() => void handleAdopt()}
            disabled={saving || selected.size === 0}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
            style={{
              background: 'rgba(129,140,248,0.15)',
              color: '#818cf8',
              border: '1px solid rgba(129,140,248,0.3)',
              opacity: saving || selected.size === 0 ? 0.5 : 1,
            }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Agregar {selected.size} hito{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Milestone row ────────────────────────────────────────────

function MilestoneRow({
  milestone,
  onToggle,
  onDelete,
}: {
  milestone: SkillMilestone
  onToggle: (completed: boolean) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden transition-all group"
      style={{
        background: milestone.completed ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${milestone.completed ? 'rgba(52,211,153,0.2)' : 'var(--line)'}`,
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Drag handle (visual only) */}
        <GripVertical size={14} className="shrink-0 opacity-30 cursor-grab" style={{ color: 'var(--text-2)' }} />

        {/* Toggle */}
        <button onClick={() => onToggle(!milestone.completed)} className="shrink-0">
          {milestone.completed
            ? <CheckCircle2 size={18} style={{ color: '#34d399' }} />
            : <Circle size={18} style={{ color: 'var(--text-2)' }} />}
        </button>

        {/* Title + description toggle */}
        <div className="flex-1 min-w-0">
          <div
            className="text-[13px] font-medium"
            style={{
              color: milestone.completed ? 'var(--text-2)' : 'var(--text-0)',
              textDecoration: milestone.completed ? 'line-through' : 'none',
            }}
          >
            {milestone.title}
            {milestone.created_by === 'ai' && (
              <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8' }}>IA</span>
            )}
          </div>
          {milestone.completed_at && (
            <div className="text-[10px] num mt-0.5" style={{ color: '#34d399' }}>
              ✓ {new Date(milestone.completed_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>

        {/* Expand description */}
        {milestone.description && (
          <button onClick={() => setExpanded((p) => !p)} style={{ color: 'var(--text-2)' }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-2)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && milestone.description && (
        <div
          className="px-10 pb-3 text-[12px] leading-relaxed"
          style={{ color: 'var(--text-2)' }}
        >
          {milestone.description}
        </div>
      )}
    </div>
  )
}

// ─── Add milestone form ───────────────────────────────────────

function AddMilestoneForm({
  onSave,
  onCancel,
  nextOrder,
  skillId,
}: {
  onSave: (title: string, description: string) => Promise<void>
  onCancel: () => void
  nextOrder: number
  skillId: string
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  void skillId
  void nextOrder

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave(title.trim(), description.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nombre del hito *"
        required
        autoFocus
        className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-transparent outline-none"
        style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)..."
        rows={2}
        className="w-full rounded-xl px-3 py-2.5 text-[12px] bg-transparent resize-none outline-none"
        style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 text-[12px] rounded-xl" style={{ color: 'var(--text-2)' }}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all"
          style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', opacity: saving || !title.trim() ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={13} className="animate-spin mx-auto" /> : '+ Agregar'}
        </button>
      </div>
    </form>
  )
}

// ─── Main ─────────────────────────────────────────────────────

interface SkillRoadmapProps {
  skill: AprendizajeSkill
  milestones: SkillMilestone[]
  loading: boolean
  suggesting: boolean
  suggestions: { title: string; description: string }[]
  onCreate: (title: string, description: string) => Promise<void>
  onToggle: (id: string, completed: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSuggestAI: () => Promise<void>
  onAdoptSuggestions: (selected: { title: string; description: string }[]) => Promise<void>
  onClearSuggestions: () => void
}

export function SkillRoadmap({
  skill,
  milestones,
  loading,
  suggesting,
  suggestions,
  onCreate,
  onToggle,
  onDelete,
  onSuggestAI,
  onAdoptSuggestions,
  onClearSuggestions,
}: SkillRoadmapProps) {
  const [showForm, setShowForm] = useState(false)

  const completed = milestones.filter((m) => m.completed).length
  const total = milestones.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  async function handleCreate(title: string, description: string) {
    await onCreate(title, description)
    setShowForm(false)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Progress bar */}
        {total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px]" style={{ color: 'var(--text-1)' }}>
                {completed} de {total} hitos completados
              </span>
              <span className="text-[12px] font-bold num" style={{ color: '#34d399' }}>{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #34d399, #10b981)' }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <Plus size={12} />Hito manual
          </button>
          <button
            onClick={() => void onSuggestAI()}
            disabled={suggesting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={{
              background: 'rgba(129,140,248,0.1)',
              color: '#818cf8',
              border: '1px solid rgba(129,140,248,0.25)',
              opacity: suggesting ? 0.6 : 1,
            }}
          >
            {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {suggesting ? 'Generando...' : '✨ Sugerir con IA'}
          </button>
        </div>

        {showForm && (
          <AddMilestoneForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            nextOrder={milestones.length}
            skillId={skill.id}
          />
        )}

        {/* Milestone list */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-2)' }} />
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: 'var(--text-2)', opacity: 0.3 }} />
            <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>Sin hitos aún</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-2)', opacity: 0.7 }}>
              Agregá hitos manuales o pedile a la IA que sugiera un roadmap
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {milestones.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                onToggle={(completed) => void onToggle(m.id, completed)}
                onDelete={() => void onDelete(m.id)}
              />
            ))}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <AISuggestionsModal
          suggestions={suggestions}
          onAdopt={onAdoptSuggestions}
          onClose={onClearSuggestions}
        />
      )}
    </>
  )
}
