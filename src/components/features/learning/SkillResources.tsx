'use client'

import { useState } from 'react'
import {
  Youtube, BookOpen, GraduationCap, FileText, Mic, Package2,
  Plus, X, ExternalLink, Star, Loader2, ChevronDown, ChevronUp,
  Clock, DollarSign, Check, Trash2,
} from 'lucide-react'
import type { SkillResource, ResourceType, ResourceStatus, CreateSkillResourceInput } from '@/types/database.types'

// ─── Constants ────────────────────────────────────────────────

const TYPE_META: Record<ResourceType, { label: string; icon: React.ElementType; color: string }> = {
  youtube:  { label: 'YouTube',  icon: Youtube,        color: '#ef4444' },
  libro:    { label: 'Libro',    icon: BookOpen,       color: '#f97316' },
  curso:    { label: 'Curso',    icon: GraduationCap,  color: '#8b5cf6' },
  articulo: { label: 'Artículo', icon: FileText,       color: '#38bdf8' },
  podcast:  { label: 'Podcast',  icon: Mic,            color: '#34d399' },
  otro:     { label: 'Otro',     icon: Package2,       color: '#94a3b8' },
}

const STATUS_META: Record<ResourceStatus, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',   color: '#94a3b8' },
  en_progreso: { label: 'En progreso', color: '#fbbf24' },
  consumido:   { label: 'Consumido',   color: '#34d399' },
  descartado:  { label: 'Descartado',  color: '#6b7280' },
}

const PRIORITIES = [1, 2, 3, 4, 5]

// ─── Star rating ──────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="transition-all"
        >
          <Star
            size={18}
            style={{
              color: s <= value ? '#fbbf24' : 'rgba(255,255,255,0.15)',
              fill: s <= value ? '#fbbf24' : 'transparent',
            }}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Add resource form ────────────────────────────────────────

function AddResourceForm({
  skillId,
  onSave,
  onCancel,
}: {
  skillId: string
  onSave: (input: CreateSkillResourceInput) => Promise<void>
  onCancel: () => void
}) {
  const [type, setType] = useState<ResourceType>('youtube')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [author, setAuthor] = useState('')
  const [duration, setDuration] = useState('')
  const [cost, setCost] = useState('0')
  const [priority, setPriority] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        skill_id: skillId,
        resource_type: type,
        title: title.trim(),
        url: url.trim() || null,
        author: author.trim() || null,
        duration_minutes: duration ? parseInt(duration) : null,
        cost: parseFloat(cost) || 0,
        priority,
        notes: notes.trim() || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-0)' }}>Agregar recurso</span>
        <button type="button" onClick={onCancel} style={{ color: 'var(--text-2)' }}>
          <X size={14} />
        </button>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {(Object.entries(TYPE_META) as [ResourceType, typeof TYPE_META[ResourceType]][]).map(([t, meta]) => {
          const Icon = meta.icon
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
              style={{
                background: type === t ? `${meta.color}18` : 'transparent',
                border: `1px solid ${type === t ? `${meta.color}50` : 'var(--line)'}`,
              }}
            >
              <Icon size={14} style={{ color: type === t ? meta.color : 'var(--text-2)' }} />
              <span className="text-[9px] num" style={{ color: type === t ? meta.color : 'var(--text-2)' }}>
                {meta.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título *"
        required
        autoFocus
        className="w-full rounded-lg px-3 py-2 text-[13px] bg-transparent outline-none"
        style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
      />

      {/* URL + Author */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL (opcional)"
          className="rounded-lg px-3 py-2 text-[12px] bg-transparent outline-none"
          style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
        />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Autor / canal"
          className="rounded-lg px-3 py-2 text-[12px] bg-transparent outline-none"
          style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
        />
      </div>

      {/* Duration + Cost + Priority */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[10px] num uppercase mb-1" style={{ color: 'var(--text-2)' }}>Duración (min)</div>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="—"
            min={0}
            className="w-full rounded-lg px-3 py-2 text-[12px] bg-transparent outline-none"
            style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
          />
        </div>
        <div>
          <div className="text-[10px] num uppercase mb-1" style={{ color: 'var(--text-2)' }}>Costo ($)</div>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            min={0}
            step={0.01}
            className="w-full rounded-lg px-3 py-2 text-[12px] bg-transparent outline-none"
            style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
          />
        </div>
        <div>
          <div className="text-[10px] num uppercase mb-1" style={{ color: 'var(--text-2)' }}>Prioridad</div>
          <div className="flex gap-0.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="flex-1 rounded py-2 text-[11px] num font-bold transition-all"
                style={{
                  background: priority === p ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.03)',
                  color: priority === p ? '#f97316' : 'var(--text-2)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="¿Por qué elegiste esto? ¿Qué esperás aprender?..."
        rows={2}
        className="w-full rounded-lg px-3 py-2 text-[12px] bg-transparent resize-none outline-none"
        style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 text-[12px] rounded-lg"
          style={{ color: 'var(--text-2)' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff',
            opacity: saving || !title.trim() ? 0.5 : 1,
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin mx-auto" /> : '+ Agregar'}
        </button>
      </div>
    </form>
  )
}

// ─── Mark consumed modal ──────────────────────────────────────

function MarkConsumedModal({
  resource,
  onSave,
  onClose,
}: {
  resource: SkillResource
  onSave: (rating: number, notes: string) => Promise<void>
  onClose: () => void
}) {
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(rating, notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[15px] font-bold display" style={{ color: 'var(--text-0)' }}>
            Marcar como consumido
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-2)' }}>
            <X size={15} />
          </button>
        </div>

        <div className="text-[13px] truncate" style={{ color: 'var(--text-1)' }}>
          {resource.title}
        </div>

        <div>
          <div className="text-[11px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
            Rating
          </div>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <div className="text-[11px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
            Notas finales (opcional)
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Qué aprendiste? ¿Lo recomendarías?..."
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-transparent resize-none outline-none"
            style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px]"
            style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Resource detail modal ────────────────────────────────────

function ResourceDetail({
  resource,
  onUpdate,
  onStartSession,
  onClose,
}: {
  resource: SkillResource
  onUpdate: (id: string, input: import('@/types/database.types').UpdateSkillResourceInput) => Promise<SkillResource>
  onStartSession: (resourceId: string) => void
  onClose: () => void
}) {
  const [notes, setNotes] = useState(resource.notes ?? '')
  const [saving, setSaving] = useState(false)
  const meta = TYPE_META[resource.resource_type]
  const Icon = meta.icon
  const statusMeta = STATUS_META[resource.status]

  async function saveNotes() {
    setSaving(true)
    try {
      await onUpdate(resource.id, { notes: notes || null })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col"
        style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${meta.color}18`, color: meta.color }}
            >
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold" style={{ color: 'var(--text-0)' }}>
                {resource.title}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: `${statusMeta.color}18`, color: statusMeta.color }}>
                  {statusMeta.label}
                </span>
                {resource.author && (
                  <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>por {resource.author}</span>
                )}
                {resource.duration_minutes && (
                  <span className="text-[11px] num flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                    <Clock size={10} />{resource.duration_minutes}min
                  </span>
                )}
                {resource.cost > 0 && (
                  <span className="text-[11px] num flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                    <DollarSign size={10} />{resource.cost}
                  </span>
                )}
                {resource.rating && (
                  <span className="text-[11px] num flex items-center gap-1" style={{ color: '#fbbf24' }}>
                    <Star size={10} style={{ fill: '#fbbf24' }} />{resource.rating}/5
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-2)' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}
              >
                <ExternalLink size={12} />
                Abrir recurso
              </a>
            )}
            {resource.duration_minutes && resource.status !== 'consumido' && (
              <button
                onClick={() => onStartSession(resource.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}
              >
                ⏱ Estudiar este recurso
              </button>
            )}
          </div>

          {/* Notes editor */}
          <div>
            <div className="text-[11px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
              Notas / reseña
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => { if (notes !== resource.notes) void saveNotes() }}
              placeholder="Anotá lo que aprendés, tu opinión, ideas clave..."
              rows={8}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-transparent resize-none outline-none"
              style={{ border: '1px solid var(--line)', color: 'var(--text-0)' }}
            />
            {saving && (
              <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                <Loader2 size={11} className="animate-spin" />Guardando...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Resource card ────────────────────────────────────────────

function ResourceCard({
  resource,
  onMarkConsumed,
  onDelete,
  onClick,
}: {
  resource: SkillResource
  onMarkConsumed: (r: SkillResource) => void
  onDelete: (id: string) => void
  onClick: (r: SkillResource) => void
}) {
  const meta = TYPE_META[resource.resource_type]
  const Icon = meta.icon
  const statusMeta = STATUS_META[resource.status]
  const isConsumed = resource.status === 'consumido'
  const isDiscarded = resource.status === 'descartado'

  return (
    <div
      className="rounded-xl p-3 transition-all group"
      style={{
        background: isConsumed ? 'rgba(52,211,153,0.04)' : isDiscarded ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isConsumed ? 'rgba(52,211,153,0.2)' : 'var(--line)'}`,
        opacity: isDiscarded ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox / mark consumed */}
        <button
          onClick={() => !isConsumed && !isDiscarded && onMarkConsumed(resource)}
          disabled={isConsumed || isDiscarded}
          className="shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: isConsumed ? 'rgba(52,211,153,0.15)' : `${meta.color}15`,
            border: `1px solid ${isConsumed ? 'rgba(52,211,153,0.4)' : `${meta.color}30`}`,
            color: isConsumed ? '#34d399' : meta.color,
          }}
        >
          {isConsumed ? <Check size={14} /> : <Icon size={14} />}
        </button>

        {/* Content */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => onClick(resource)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div
                className="text-[13px] font-medium truncate"
                style={{ color: isConsumed ? 'var(--text-2)' : 'var(--text-0)', textDecoration: isDiscarded ? 'line-through' : 'none' }}
              >
                {resource.title}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${statusMeta.color}12`, color: statusMeta.color }}>
                  {statusMeta.label}
                </span>
                {resource.author && (
                  <span className="text-[10px]" style={{ color: 'var(--text-2)' }}>{resource.author}</span>
                )}
                {resource.duration_minutes && (
                  <span className="text-[10px] num flex items-center gap-0.5" style={{ color: 'var(--text-2)' }}>
                    <Clock size={9} />{resource.duration_minutes}min
                  </span>
                )}
                {resource.rating && (
                  <span className="text-[10px] num flex items-center gap-0.5" style={{ color: '#fbbf24' }}>
                    <Star size={9} style={{ fill: '#fbbf24' }} />{resource.rating}
                  </span>
                )}
              </div>
            </div>
            {/* Priority dots */}
            <div className="flex gap-0.5 shrink-0 mt-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <div
                  key={p}
                  className="w-1 h-1 rounded-full"
                  style={{ background: p <= resource.priority ? '#f97316' : 'rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>
          </div>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(resource.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
          style={{ color: 'var(--text-2)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Main SkillResources component ───────────────────────────

interface SkillResourcesProps {
  skillId: string
  resources: SkillResource[]
  loading: boolean
  onAdd: (input: CreateSkillResourceInput) => Promise<SkillResource>
  onUpdate: (id: string, input: import('@/types/database.types').UpdateSkillResourceInput) => Promise<SkillResource>
  onMarkConsumed: (id: string, rating: number, notes?: string) => Promise<void>
  onDelete: (id: string) => void
  onStartSessionWithResource: (resourceId: string) => void
}

export function SkillResources({
  skillId,
  resources,
  loading,
  onAdd,
  onUpdate,
  onMarkConsumed,
  onDelete,
  onStartSessionWithResource,
}: SkillResourcesProps) {
  const [showForm, setShowForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState<ResourceType | null>(null)
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | null>(null)
  const [consumingResource, setConsumingResource] = useState<SkillResource | null>(null)
  const [detailResource, setDetailResource] = useState<SkillResource | null>(null)
  const [expanded, setExpanded] = useState(true)

  const filtered = resources.filter((r) => {
    if (typeFilter && r.resource_type !== typeFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  async function handleAdd(input: CreateSkillResourceInput) {
    await onAdd(input)
    setShowForm(false)
  }

  async function handleMarkConsumed(rating: number, notes: string) {
    if (!consumingResource) return
    await onMarkConsumed(consumingResource.id, rating, notes || undefined)
    setConsumingResource(null)
  }

  function handleStartSession(resourceId: string) {
    setDetailResource(null)
    onStartSessionWithResource(resourceId)
  }

  const statusCounts = {
    pendiente:   resources.filter((r) => r.status === 'pendiente').length,
    en_progreso: resources.filter((r) => r.status === 'en_progreso').length,
    consumido:   resources.filter((r) => r.status === 'consumido').length,
  }

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-2"
          >
            <span className="text-[11px] num uppercase tracking-[0.15em]" style={{ color: 'var(--text-2)' }}>
              Recursos ({resources.length})
            </span>
            {expanded ? <ChevronUp size={12} style={{ color: 'var(--text-2)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-2)' }} />}
          </button>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
            style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <Plus size={12} />Agregar
          </button>
        </div>

        {showForm && (
          <AddResourceForm
            skillId={skillId}
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        {expanded && (
          <>
            {/* Stats summary */}
            {resources.length > 0 && (
              <div className="flex gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  count > 0 && (
                    <div key={status} className="text-center">
                      <div className="text-[15px] font-bold num" style={{ color: STATUS_META[status as ResourceStatus].color }}>
                        {count}
                      </div>
                      <div className="text-[10px] num uppercase" style={{ color: 'var(--text-2)' }}>
                        {STATUS_META[status as ResourceStatus].label}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Filters */}
            {resources.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {/* Type filters */}
                {(Object.entries(TYPE_META) as [ResourceType, typeof TYPE_META[ResourceType]][])
                  .filter(([t]) => resources.some((r) => r.resource_type === t))
                  .map(([t, meta]) => {
                    const Icon = meta.icon
                    return (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all"
                        style={{
                          background: typeFilter === t ? `${meta.color}18` : 'transparent',
                          border: `1px solid ${typeFilter === t ? `${meta.color}40` : 'var(--line)'}`,
                          color: typeFilter === t ? meta.color : 'var(--text-2)',
                        }}
                      >
                        <Icon size={10} />
                        {meta.label}
                      </button>
                    )
                  })}

                {/* Status filters */}
                {(['pendiente', 'en_progreso', 'consumido'] as ResourceStatus[])
                  .filter((s) => resources.some((r) => r.status === s))
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                      className="px-2 py-1 rounded-lg text-[11px] transition-all"
                      style={{
                        background: statusFilter === s ? `${STATUS_META[s].color}18` : 'transparent',
                        border: `1px solid ${statusFilter === s ? `${STATUS_META[s].color}40` : 'var(--line)'}`,
                        color: statusFilter === s ? STATUS_META[s].color : 'var(--text-2)',
                      }}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
              </div>
            )}

            {/* Resource list */}
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-2)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-4">
                <BookOpen size={22} className="mx-auto mb-2" style={{ color: 'var(--text-2)', opacity: 0.4 }} />
                <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                  {resources.length === 0 ? 'Sin recursos agregados' : 'Sin recursos con esos filtros'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onMarkConsumed={setConsumingResource}
                    onDelete={(id) => void onDelete(id)}
                    onClick={setDetailResource}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {consumingResource && (
        <MarkConsumedModal
          resource={consumingResource}
          onSave={handleMarkConsumed}
          onClose={() => setConsumingResource(null)}
        />
      )}

      {detailResource && (
        <ResourceDetail
          resource={detailResource}
          onUpdate={onUpdate}
          onStartSession={handleStartSession}
          onClose={() => setDetailResource(null)}
        />
      )}
    </>
  )
}
