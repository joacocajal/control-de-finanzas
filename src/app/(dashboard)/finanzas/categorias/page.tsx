'use client'

import { useState } from 'react'
import { ArrowLeft, Pencil, Archive, Plus, Check, X, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useFinance } from '@/contexts/FinanceContext'
import { adoptSuggestedCategories } from '@/services/category.service'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Category, UpdateCategoryInput } from '@/types/database.types'

const COLOR_PALETTE = [
  '#f97316', '#38bdf8', '#8b5cf6', '#f43f5e',
  '#fbbf24', '#34d399', '#ec4899', '#22c55e',
  '#3b82f6', '#94a3b8', '#6366f1', '#64748b',
]

const SUGGESTED_NAMES = [
  'Comida', 'Transporte', 'Suscripciones', 'Salud', 'Ocio',
  'Educación', 'Ropa', 'Hogar', 'Impuestos', 'Insumos negocio',
  'Marketing', 'Software/Hosting', 'Honorarios profesionales', 'Otros',
]

// ─── Edit inline form ─────────────────────────────────────────

function CategoryEditForm({
  cat,
  onSave,
  onCancel,
}: {
  cat: Category
  onSave: (input: UpdateCategoryInput) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(cat.name)
  const [color, setColor] = useState(cat.color)
  const [icon, setIcon] = useState(cat.icon ?? '')
  const [budget, setBudget] = useState(cat.monthly_budget?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const budgetVal = budget.trim() ? parseFloat(budget.replace(/\./g, '').replace(',', '.')) : null
      await onSave({
        name: name.trim(),
        color,
        icon: icon.trim() || null,
        monthly_budget: isNaN(budgetVal!) ? null : budgetVal,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="pt-4 grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2">
          <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>Nombre</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            className="w-full rounded-xl px-4 py-2.5 text-[13px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }}
          />
        </div>
        {/* Icon */}
        <div>
          <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>Ícono (emoji)</label>
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            maxLength={4}
            placeholder="🍔"
            className="w-full rounded-xl px-4 py-2.5 text-[18px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }}
          />
        </div>
        {/* Budget */}
        <div>
          <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>Presupuesto/mes</label>
          <input
            value={budget}
            onChange={e => setBudget(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder="0"
            inputMode="decimal"
            className="w-full rounded-xl px-4 py-2.5 text-[13px] num"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }}
          />
        </div>
      </div>
      {/* Color */}
      <div>
        <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 relative"
              style={{ background: c }}>
              {color === c && <Check size={12} className="absolute inset-0 m-auto text-black" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-[12px] px-3 py-2 rounded-xl" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-medium"
          style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
        <button onClick={() => void handleSave()} disabled={saving || !name.trim()}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold disabled:opacity-40 transition-all"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
          {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Category card ────────────────────────────────────────────

function CategoryCard({ cat }: { cat: Category }) {
  const { editCategory, removeCategory, transactions } = useFinance()
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const spent = transactions
    .filter(t => t.type === 'expense' && t.category_id === cat.id)
    .reduce((acc, t) => acc + t.amount, 0)
  const pct = cat.monthly_budget ? Math.min(110, (spent / cat.monthly_budget) * 100) : 0
  const overBudget = cat.monthly_budget && spent > cat.monthly_budget

  async function handleArchive() {
    if (!confirm(`¿Archivar "${cat.name}"? Las transacciones existentes se conservan.`)) return
    setArchiving(true)
    try { await removeCategory(cat.id) }
    finally { setArchiving(false) }
  }

  return (
    <div className="glass rounded-2xl overflow-hidden lift" style={{ borderRadius: 16 }}>
      <div className="flex items-center gap-4 p-4">
        {/* Icon / color dot */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
          style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}>
          {cat.icon ?? <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: cat.color }} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-0)' }}>{cat.name}</span>
            {cat.is_default && (
              <span className="text-[9px] num uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
                Default
              </span>
            )}
          </div>
          {/* Budget bar */}
          {cat.monthly_budget ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 xp-track" style={{ height: 4 }}>
                <div style={{
                  width: `${Math.min(100, pct)}%`,
                  height: '100%',
                  background: overBudget ? '#f87171' : pct > 80 ? '#fbbf24' : cat.color,
                  borderRadius: 999,
                  transition: 'width 600ms ease',
                }} />
              </div>
              <span className="text-[10px] num shrink-0" style={{ color: overBudget ? '#f87171' : 'var(--text-2)' }}>
                {formatCurrency(spent)} / {formatCurrency(cat.monthly_budget)}
              </span>
            </div>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>
              {spent > 0 ? formatCurrency(spent) + ' este mes' : 'Sin presupuesto'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing(v => !v)}
            className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: editing ? cat.color : 'var(--text-2)' }}>
            {editing ? <X size={14} /> : <Pencil size={14} />}
          </button>
          <button onClick={() => void handleArchive()} disabled={archiving}
            className="p-2 rounded-lg transition-colors hover:bg-rose-500/10"
            style={{ color: 'var(--text-2)' }}>
            {archiving ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
          </button>
        </div>
      </div>

      {editing && (
        <CategoryEditForm
          cat={cat}
          onSave={async (input) => {
            await editCategory(cat.id, input)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ─── Suggested onboarding ─────────────────────────────────────

function SuggestedOnboarding({ existing, onDone }: { existing: string[]; onDone: () => void }) {
  const { reloadCategories } = useFinance()
  const available = SUGGESTED_NAMES.filter(n => !existing.includes(n))
  const [selected, setSelected] = useState<Set<string>>(new Set(available.slice(0, 6)))
  const [saving, setSaving] = useState(false)

  const toggle = (name: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(name) ? next.delete(name) : next.add(name)
    return next
  })

  async function handleAdopt() {
    if (selected.size === 0) { onDone(); return }
    setSaving(true)
    try {
      await adoptSuggestedCategories([...selected])
      await reloadCategories()
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass mb-6 overflow-hidden" style={{ borderRadius: 18 }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles size={16} style={{ color: '#fbbf24' }} />
          <h2 className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>
            Categorías sugeridas
          </h2>
        </div>
        <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
          Elegí las que usás y las importamos de una.
        </p>
      </div>
      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2 mb-5">
          {available.map(name => {
            const on = selected.has(name)
            return (
              <button key={name} onClick={() => toggle(name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
                style={{
                  background: on ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
                  color: on ? '#34d399' : 'var(--text-2)',
                  border: `1px solid ${on ? 'rgba(52,211,153,0.3)' : 'var(--line)'}`,
                }}>
                {on && <Check size={11} strokeWidth={3} />}
                {name}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={onDone}
            className="px-4 py-2.5 rounded-xl text-[12px] font-medium"
            style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}>
            Omitir
          </button>
          <button onClick={() => void handleAdopt()} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
            {saving ? (
              <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Importando...</span>
            ) : (
              `Importar ${selected.size} categorías`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New category inline form ─────────────────────────────────

function NewCategoryForm({ onDone }: { onDone: () => void }) {
  const { addCategory } = useFinance()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#34d399')
  const [icon, setIcon] = useState('')
  const [budget, setBudget] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const budgetVal = budget.trim() ? parseFloat(budget.replace(/\./g, '').replace(',', '.')) : undefined
      await addCategory({
        name: name.trim(),
        color,
        icon: icon.trim() || null,
        ...(budgetVal && !isNaN(budgetVal) ? { monthly_budget: budgetVal } : {}),
      } as Parameters<typeof addCategory>[0])
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass mb-4 p-5" style={{ borderRadius: 16 }}>
      <h2 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--text-0)' }}>Nueva categoría</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2">
          <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>Nombre</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={30}
            placeholder="Ej: Comida, Transporte..."
            className="w-full rounded-xl px-4 py-2.5 text-[13px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }} />
        </div>
        <div>
          <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>Ícono</label>
          <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} placeholder="🍔"
            className="w-full rounded-xl px-4 py-2.5 text-[18px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }} />
        </div>
        <div>
          <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>Presupuesto/mes</label>
          <input value={budget} onChange={e => setBudget(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder="0" inputMode="decimal"
            className="w-full rounded-xl px-4 py-2.5 text-[13px] num"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {COLOR_PALETTE.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className="w-7 h-7 rounded-full transition-transform hover:scale-110 relative"
            style={{ background: c }}>
            {color === c && <Check size={12} className="absolute inset-0 m-auto text-black" strokeWidth={3} />}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-[12px] mb-3 px-3 py-2 rounded-xl" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={onDone}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-medium"
          style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
        <button onClick={() => void handleSave()} disabled={saving || !name.trim()}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold disabled:opacity-40"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
          {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Crear'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function CategoriasPage() {
  const { categories, loading } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [showSuggested, setShowSuggested] = useState(true)

  const existingNames = categories.map(c => c.name)
  const hasSuggestions = SUGGESTED_NAMES.some(n => !existingNames.includes(n))


  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/finanzas"
          className="p-2 rounded-xl transition-colors hover:bg-white/[0.06]"
          style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}>
          <ArrowLeft size={15} />
        </Link>
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Finances · Categorías</div>
          <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Gestión de Categorías</h1>
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: showForm ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.12)',
              color: showForm ? 'var(--text-2)' : '#34d399',
              border: `1px solid ${showForm ? 'var(--line)' : 'rgba(52,211,153,0.25)'}`,
            }}>
            {showForm ? <X size={15} /> : <Plus size={15} strokeWidth={2.5} />}
            {showForm ? 'Cancelar' : 'Nueva'}
          </button>
        </div>
      </div>

      {/* Suggested onboarding */}
      {showSuggested && hasSuggestions && !loading && (
        <SuggestedOnboarding existing={existingNames} onDone={() => setShowSuggested(false)} />
      )}

      {/* New form */}
      {showForm && <NewCategoryForm onDone={() => setShowForm(false)} />}

      {/* Category list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-2xl animate-shimmer" style={{ border: '1px solid var(--line)' }} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="glass py-16 text-center" style={{ borderRadius: 16 }}>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Sin categorías. Importá las sugeridas o creá una arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(c => <CategoryCard key={c.id} cat={c} />)}
        </div>
      )}
    </>
  )
}
