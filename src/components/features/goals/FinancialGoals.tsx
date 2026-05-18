'use client'

import { useState, useRef, useEffect } from 'react'
import { Target, Plus, MoreVertical, Pencil, Trash2, CheckCircle2, Circle, PlusCircle, X } from 'lucide-react'
import { useFinancialGoals } from '@/hooks/useFinancialGoals'
import type { FinancialGoal, CreateFinancialGoalInput } from '@/types/database.types'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Goal form modal ──────────────────────────────────────────

function GoalModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<CreateFinancialGoalInput>
  onSave: (input: CreateFinancialGoalInput) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(String(initial?.target_amount ?? ''))
  const [current, setCurrent] = useState(String(initial?.current_amount ?? '0'))
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = parseFloat(target)
    if (!name.trim() || isNaN(t) || t <= 0) { setErr('Nombre y monto meta son requeridos.'); return }
    if (deadline && deadline < today) { setErr('La fecha límite no puede ser en el pasado.'); return }
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        target_amount: t,
        current_amount: parseFloat(current) || 0,
        deadline: deadline || null,
        category: category.trim() || null,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold display" style={{ color: 'var(--text-0)' }}>
            {initial?.name ? 'Editar objetivo' : 'Nuevo objetivo'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div>
            <label className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="ej: Moto, Viaje a Bariloche..."
              className="mt-1 w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px]"
              style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Meta ($) *</label>
              <input type="number" value={target} onChange={e => setTarget(e.target.value)} required min={1} placeholder="0"
                className="mt-1 w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px] num"
                style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
            </div>
            <div>
              <label className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Ahorrado ($)</label>
              <input type="number" value={current} onChange={e => setCurrent(e.target.value)} min={0} placeholder="0"
                className="mt-1 w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px] num"
                style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Fecha límite</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={today}
                className="mt-1 w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px] num"
                style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
            </div>
            <div>
              <label className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Categoría</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="ej: Viaje, Auto..."
                className="mt-1 w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px]"
                style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional..."
              className="mt-1 w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px] resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
          </div>

          {err && <p className="text-[12px] px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>{err}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: '#34d399', color: '#0a0a0a', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar objetivo'}
            </button>
            <button type="button" onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-[13px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add progress modal ───────────────────────────────────────

function AddProgressModal({ goal, onAdd, onClose }: {
  goal: FinancialGoal
  onAdd: (amount: number) => Promise<void>
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const remaining = goal.target_amount - goal.current_amount

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = parseFloat(amount)
    if (isNaN(v) || v <= 0) return
    setSaving(true)
    try {
      await onAdd(v)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const quickAmounts = [1000, 5000, 10000, Math.round(remaining)].filter(v => v > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>Agregar monto a</div>
            <h3 className="text-[15px] font-bold display" style={{ color: 'var(--text-0)' }}>{goal.name}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
            <X size={15} />
          </button>
        </div>

        <div className="text-center py-2">
          <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>Faltan</div>
          <div className="text-[28px] font-bold num" style={{ color: '#34d399' }}>{formatCurrency(remaining)}</div>
        </div>

        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.slice(0, 4).map(q => (
              <button key={q} type="button" onClick={() => setAmount(String(q))}
                className="py-2 rounded-lg text-[11px] num font-semibold transition-colors"
                style={{
                  background: parseFloat(amount) === q ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${parseFloat(amount) === q ? 'rgba(52,211,153,0.4)' : 'var(--line)'}`,
                  color: parseFloat(amount) === q ? '#34d399' : 'var(--text-2)',
                }}>
                {q >= 1000 ? `$${q / 1000}k` : `$${q}`}
              </button>
            ))}
          </div>

          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Otro monto..."
            className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[14px] num text-center"
            style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />

          <button type="submit" disabled={saving || !amount}
            className="w-full py-3 rounded-xl text-[14px] font-semibold"
            style={{ background: '#34d399', color: '#0a0a0a', opacity: !amount ? 0.5 : 1 }}>
            {saving ? 'Guardando...' : `+ Agregar ${amount ? formatCurrency(parseFloat(amount)) : ''}`}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Menu de 3 puntos ─────────────────────────────────────────

function GoalMenu({ onEdit, onDelete, onToggle, completed }: {
  onEdit: () => void; onDelete: () => void; onToggle: () => void; completed: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: 'var(--text-2)', background: open ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 rounded-xl py-1 min-w-[140px] shadow-xl"
          style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)' }}>
          <button onClick={() => { onEdit(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-1)' }}>
            <Pencil size={12} />Editar
          </button>
          <button onClick={() => { onToggle(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors hover:bg-white/5"
            style={{ color: completed ? '#f97316' : '#34d399' }}>
            {completed ? <><Circle size={12} />Reabrir</> : <><CheckCircle2 size={12} />Completar</>}
          </button>
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
          <button onClick={() => { onDelete(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors hover:bg-white/5"
            style={{ color: '#f87171' }}>
            <Trash2 size={12} />Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Goal card ────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete, onToggle, onAddProgress }: {
  goal: FinancialGoal
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onAddProgress: () => void
}) {
  const pct = Math.min(1, goal.current_amount / goal.target_amount)
  const color = goal.completed ? '#34d399' : pct >= 0.75 ? '#fbbf24' : '#38bdf8'
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="glass p-4" style={{ borderRadius: 18, opacity: goal.completed ? 0.75 : 1 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-0)' }}>
              {goal.name}
            </span>
            {goal.completed && (
              <span className="text-[10px] num px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                ✓ Completado
              </span>
            )}
            {goal.category && (
              <span className="text-[10px] num px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
                {goal.category}
              </span>
            )}
          </div>
          {goal.deadline && (
            <div className="text-[11px] num mt-0.5" style={{ color: daysLeft !== null && daysLeft < 30 ? '#f97316' : 'var(--text-2)' }}>
              {daysLeft !== null && daysLeft < 0
                ? 'Vencido'
                : daysLeft !== null && daysLeft === 0
                ? 'Vence hoy'
                : `${formatDate(goal.deadline)}${daysLeft !== null ? ` · ${daysLeft}d` : ''}`}
            </div>
          )}
        </div>
        <GoalMenu
          completed={goal.completed}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      </div>

      {/* Amounts */}
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-[22px] font-bold num" style={{ color }}>{formatCurrency(goal.current_amount)}</span>
          <span className="text-[12px] num ml-1.5" style={{ color: 'var(--text-2)' }}>de {formatCurrency(goal.target_amount)}</span>
        </div>
        <span className="text-[13px] font-semibold num" style={{ color }}>{Math.round(pct * 100)}%</span>
      </div>

      {/* Progress bar */}
      <div className="xp-track mb-3" style={{ height: 6, borderRadius: 99 }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
          borderRadius: 99, transition: 'width 700ms ease',
        }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {goal.notes ? (
          <p className="text-[11px] truncate flex-1 mr-2" style={{ color: 'var(--text-2)' }}>{goal.notes}</p>
        ) : (
          <div className="flex-1" />
        )}
        {!goal.completed && (
          <button onClick={onAddProgress}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
            <PlusCircle size={13} />
            Agregar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

export function FinancialGoals() {
  const { goals, loading, create, update, addAmount, toggle, remove } = useFinancialGoals()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<FinancialGoal | null>(null)
  const [addingTo, setAddingTo] = useState<FinancialGoal | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const active = goals.filter(g => !g.completed)
  const done = goals.filter(g => g.completed)

  return (
    <div className="glass p-5" style={{ borderRadius: 18 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
            <Target size={14} />
          </div>
          <div>
            <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Vault</div>
            <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Objetivos de ahorro</h2>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium"
          style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
          <Plus size={13} />Nuevo
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(52,211,153,0.08)' }}>
            <Target size={22} style={{ color: '#34d399' }} />
          </div>
          <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-1)' }}>Sin objetivos aún</p>
          <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>Creá tu primer objetivo de ahorro</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 rounded-xl text-[13px] font-semibold"
            style={{ background: '#34d399', color: '#0a0a0a' }}>
            + Crear objetivo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditing(goal)}
              onDelete={() => setConfirmDelete(goal.id)}
              onToggle={() => void toggle(goal.id, !goal.completed)}
              onAddProgress={() => setAddingTo(goal)}
            />
          ))}
          {done.length > 0 && (
            <>
              <div className="text-[10px] num uppercase tracking-[0.18em] pt-2 px-1" style={{ color: 'var(--text-2)' }}>
                Completados ({done.length})
              </div>
              {done.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => setEditing(goal)}
                  onDelete={() => setConfirmDelete(goal.id)}
                  onToggle={() => void toggle(goal.id, !goal.completed)}
                  onAddProgress={() => setAddingTo(goal)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <GoalModal onSave={create} onClose={() => setShowCreate(false)} />
      )}

      {editing && (
        <GoalModal
          initial={editing}
          onSave={(input) => update(editing.id, input)}
          onClose={() => setEditing(null)}
        />
      )}

      {addingTo && (
        <AddProgressModal
          goal={addingTo}
          onAdd={(amount) => addAmount(addingTo.id, amount)}
          onClose={() => setAddingTo(null)}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xs rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)' }}>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--text-0)' }}>¿Eliminar objetivo?</p>
            <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => { void remove(confirmDelete); setConfirmDelete(null) }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: '#f87171', color: '#fff' }}>
                Eliminar
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-[13px]"
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
