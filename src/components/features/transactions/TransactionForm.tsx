'use client'

import { useState } from 'react'
import { X, Plus, DollarSign, Check, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toISODate } from '@/lib/utils/formatters'
import type { Category, CreateTransactionInput, CreateCategoryInput, TransactionType } from '@/types/database.types'

interface TransactionFormProps {
  categories: Category[]
  onSubmit: (input: CreateTransactionInput) => Promise<void>
  onClose: () => void
  onCreateCategory: (input: CreateCategoryInput) => Promise<Category>
}

interface FormState {
  type: TransactionType
  amount: string
  category_id: string
  description: string
  transaction_date: string
}

const INITIAL: FormState = {
  type: 'expense',
  amount: '',
  category_id: '',
  description: '',
  transaction_date: toISODate(),
}

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#6b7280',
]

// Parses Argentine number format: 1.500,50 → 1500.50
function parseArgentineAmount(raw: string): number {
  const cleaned = raw.trim().replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned)
}

// Only allow digits, dots, and commas
function filterAmountChars(value: string): string {
  return value.replace(/[^\d.,]/g, '')
}

export function TransactionForm({ categories, onSubmit, onClose, onCreateCategory }: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inline new-category state (errors kept separate so submit doesn't clear them)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(COLOR_PALETTE[5])
  const [savingCat, setSavingCat] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const amount = parseArgentineAmount(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a 0 (usá punto para miles y coma para decimales: ej. 1.500,50)')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        type: form.type,
        amount,
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        transaction_date: form.transaction_date,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    setCatError(null)
    try {
      const cat = await onCreateCategory({ name: newCatName.trim(), color: newCatColor })
      set('category_id', cat.id)
      setNewCatName('')
      setNewCatColor(COLOR_PALETTE[5])
      setShowNewCat(false)
    } catch (err) {
      // Keep panel open and show error inline — don't touch the form's error state
      setCatError(err instanceof Error ? err.message : 'Error al crear categoría')
    } finally {
      setSavingCat(false)
    }
  }

  const isIncome = form.type === 'income'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md animate-modal-in">
        <div className="rounded-2xl border border-white/[0.08] bg-gray-900 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-white">Nueva Transacción</h2>
              <p className="text-xs text-gray-500 mt-0.5">Registrá un ingreso o gasto</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-5">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-950 p-1">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type', t)}
                  className={cn(
                    'rounded-lg py-2.5 text-sm font-semibold transition-all duration-200',
                    form.type === t
                      ? t === 'income'
                        ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                        : 'bg-rose-500/20 text-rose-300 shadow-sm'
                      : 'text-gray-600 hover:text-gray-400'
                  )}
                >
                  {t === 'income' ? '↑ Ingreso' : '↓ Gasto'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Monto
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <DollarSign
                    size={16}
                    className={isIncome ? 'text-emerald-500' : 'text-rose-500'}
                  />
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => set('amount', filterAmountChars(e.target.value))}
                  className={cn(
                    'w-full rounded-xl border bg-gray-950 py-3 pl-10 pr-4 text-xl font-bold text-white',
                    'placeholder-gray-700 focus:outline-none transition-colors tabular-nums',
                    isIncome
                      ? 'border-emerald-500/20 focus:border-emerald-500/40'
                      : 'border-rose-500/20 focus:border-rose-500/40'
                  )}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-600">
                Usá punto para miles y coma para decimales — ej: <span className="text-gray-500">1.500,50</span>
              </p>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Categoría
                </label>
                <button
                  type="button"
                  onClick={() => { setShowNewCat((v) => !v); setCatError(null) }}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Tag size={11} />
                  {showNewCat ? 'Cancelar' : 'Nueva categoría'}
                </button>
              </div>

              {/* Existing category select */}
              {!showNewCat && (
                <div className="relative">
                  {form.category_id && (
                    <div
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          categories.find((c) => c.id === form.category_id)?.color ?? 'transparent',
                      }}
                    />
                  )}
                  <select
                    value={form.category_id}
                    onChange={(e) => set('category_id', e.target.value)}
                    className={cn(
                      'w-full rounded-xl border border-white/5 bg-gray-950 py-3 pr-4 text-sm text-gray-200',
                      'focus:outline-none focus:border-indigo-500/40 transition-colors appearance-none',
                      form.category_id ? 'pl-8' : 'pl-4'
                    )}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Inline new category form */}
              {showNewCat && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-3">
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="Nombre de la categoría"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                    className="w-full rounded-lg border border-white/5 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                  {/* Color palette */}
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className="relative h-7 w-7 rounded-full transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                      >
                        {newCatColor === color && (
                          <Check size={12} className="absolute inset-0 m-auto text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                  {catError && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">{catError}</p>
                  )}
                  <button
                    type="button"
                    disabled={!newCatName.trim() || savingCat}
                    onClick={() => void handleCreateCategory()}
                    className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    {savingCat ? 'Creando...' : 'Crear categoría'}
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Descripción <span className="normal-case text-gray-700">(opcional)</span>
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder="Ej: Almuerzo con compañeros"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-gray-950 px-4 py-3 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Fecha
              </label>
              <input
                type="date"
                required
                value={form.transaction_date}
                onChange={(e) => set('transaction_date', e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-gray-950 px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <p className="text-sm text-rose-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/5 py-3 text-sm font-medium text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className={cn(
                  'flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  isIncome
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/10'
                )}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export function AddTransactionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
    >
      <Plus size={16} strokeWidth={2.5} />
      Nueva Transacción
    </button>
  )
}
