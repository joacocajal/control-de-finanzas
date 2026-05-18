'use client'

import { useState } from 'react'
import { ShieldAlert, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useBudgets } from '@/hooks/useBudgets'
import type { Category, PeriodoPresupuesto, PresupuestoConCategoria } from '@/types/database.types'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const PERIODOS: PeriodoPresupuesto[] = ['mensual', 'semanal', 'anual']

// ─── Inline edit row ──────────────────────────────────────────

function BudgetRow({ budget, onUpdate, onDelete }: {
  budget: PresupuestoConCategoria
  onUpdate: (id: string, patch: { monto_limite?: number; periodo?: PeriodoPresupuesto; fecha_fin?: string | null }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [monto, setMonto] = useState(String(budget.monto_limite))
  const [periodo, setPeriodo] = useState<PeriodoPresupuesto>(budget.periodo)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const v = parseFloat(monto)
    if (isNaN(v) || v <= 0) return
    setSaving(true)
    try {
      await onUpdate(budget.id, { monto_limite: v, periodo })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const color = budget.categories?.color ?? '#6b7280'

  return (
    <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>
            {budget.categories?.name ?? 'Sin categoría'}
          </span>
        </div>

        {editing ? (
          <div className="flex items-center gap-2 shrink-0">
            <input type="number" value={monto} onChange={e => setMonto(e.target.value)} min={1}
              className="w-24 bg-transparent border rounded-lg px-2 py-1 text-[12px] num text-right"
              style={{ borderColor: '#34d399', color: 'var(--text-0)', outline: 'none' }} />
            <select value={periodo} onChange={e => setPeriodo(e.target.value as PeriodoPresupuesto)}
              className="bg-transparent border rounded-lg px-1.5 py-1 text-[11px]"
              style={{ borderColor: 'var(--line)', color: 'var(--text-1)', outline: 'none' }}>
              {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => void save()} disabled={saving}
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
              <Check size={12} />
            </button>
            <button onClick={() => setEditing(false)}
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ color: 'var(--text-2)' }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[13px] font-bold num" style={{ color: 'var(--text-0)' }}>
                {formatCurrency(budget.monto_limite)}
              </div>
              <div className="text-[10px] num capitalize" style={{ color: 'var(--text-2)' }}>{budget.periodo}</div>
            </div>
            <button onClick={() => setEditing(true)}
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ color: 'var(--text-2)' }}>
              <Pencil size={11} />
            </button>
            <button onClick={() => void onDelete(budget.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ color: 'var(--text-2)' }}>
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Create form ──────────────────────────────────────────────

function CreateBudgetForm({ categories, onCreate, onCancel }: {
  categories: Category[]
  onCreate: (input: { categoria_gasto: string | null; monto_limite: number; periodo: PeriodoPresupuesto; fecha_inicio?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [catId, setCatId] = useState(categories[0]?.id ?? '')
  const [monto, setMonto] = useState('')
  const [periodo, setPeriodo] = useState<PeriodoPresupuesto>('mensual')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = parseFloat(monto)
    if (isNaN(v) || v <= 0) return
    setSaving(true)
    try {
      await onCreate({ categoria_gasto: catId || null, monto_limite: v, periodo })
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)}
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}>
      <div className="text-[12px] font-semibold" style={{ color: '#38bdf8' }}>Nuevo presupuesto</div>

      <div className="grid grid-cols-2 gap-2">
        <select value={catId} onChange={e => setCatId(e.target.value)}
          className="bg-transparent border rounded-xl px-3 py-2.5 text-[12px] col-span-2"
          style={{ borderColor: 'var(--line)', color: 'var(--text-1)', outline: 'none' }}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
          placeholder="Monto límite" required min={1}
          className="bg-transparent border rounded-xl px-3 py-2.5 text-[13px] num"
          style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />

        <select value={periodo} onChange={e => setPeriodo(e.target.value as PeriodoPresupuesto)}
          className="bg-transparent border rounded-xl px-3 py-2.5 text-[12px]"
          style={{ borderColor: 'var(--line)', color: 'var(--text-1)', outline: 'none' }}>
          {PERIODOS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
          style={{ background: '#38bdf8', color: '#0a0a0a' }}>
          {saving ? 'Guardando...' : 'Crear presupuesto'}
        </button>
        <button type="button" onClick={onCancel}
          className="py-2 px-3 rounded-xl text-[12px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Main ─────────────────────────────────────────────────────

export function BudgetSection({ categories }: { categories: Category[] }) {
  const { budgets, loading, create, update, remove } = useBudgets()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="glass p-5" style={{ borderRadius: 18 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
            <ShieldAlert size={14} />
          </div>
          <div>
            <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Vault</div>
            <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Presupuestos</h2>
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium"
          style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
          <Plus size={13} />Nuevo
        </button>
      </div>

      {showForm && (
        <div className="mb-3">
          <CreateBudgetForm categories={categories} onCreate={create} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl animate-shimmer" />)}
        </div>
      ) : budgets.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Sin presupuestos. Creá uno para controlar tus gastos por categoría.
          </p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-[12px] font-semibold" style={{ color: '#38bdf8' }}>
            + Crear presupuesto
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {budgets.map(b => (
            <BudgetRow key={b.id} budget={b} onUpdate={update} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  )
}
