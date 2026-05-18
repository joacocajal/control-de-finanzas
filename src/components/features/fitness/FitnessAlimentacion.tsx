'use client'

import { useState } from 'react'
import { Search, Plus, Trash2, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react'
import { useFoodLogs } from '@/hooks/useFoodLogs'
import { useFitnessGoals } from '@/hooks/useFitnessGoals'
import { useFoodSearch } from '@/hooks/useFoods'
import { calcMacros } from '@/services/foods.service'
import type { Food, MealType, CreateFoodLogInput } from '@/types/database.types'

const MEAL_LABELS: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  snack: 'Snack',
}

const MEAL_COLORS: Record<MealType, string> = {
  desayuno: '#fbbf24',
  almuerzo: '#34d399',
  merienda: '#f97316',
  cena: '#8b5cf6',
  snack: '#38bdf8',
}

function toToday() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Food search modal ────────────────────────────────────────

function FoodSearchModal({ meal, onAdd, onClose }: {
  meal: MealType
  onAdd: (input: CreateFoodLogInput) => Promise<void>
  onClose: () => void
}) {
  const { results, loading, search } = useFoodSearch()
  const [selected, setSelected] = useState<Food | null>(null)
  const [grams, setGrams] = useState('100')
  const [saving, setSaving] = useState(false)

  const macros = selected ? calcMacros(selected, parseFloat(grams) || 0) : null

  const handleAdd = async () => {
    if (!selected || !macros) return
    setSaving(true)
    try {
      await onAdd({
        meal_type: meal,
        food_id: selected.id,
        grams: parseFloat(grams),
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleServingClick = (g: number) => setGrams(String(g))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>
            Agregar a {MEAL_LABELS[meal]}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-2)' }} />
          <input
            type="text"
            placeholder="Buscar alimento..."
            onChange={e => search(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }}
            autoFocus
          />
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-2)' }} /></div>
        )}

        {!loading && results.length > 0 && !selected && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {results.map(food => (
              <button key={food.id} onClick={() => setSelected(food)}
                className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--text-0)' }}>{food.name}</div>
                    {food.brand && <div className="text-[11px]" style={{ color: 'var(--text-2)' }}>{food.brand}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] num font-semibold" style={{ color: '#f97316' }}>{food.calories_per_100g} kcal</div>
                    <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>por 100g</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected food detail */}
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)' }}>
              <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>{selected.name}</div>
              <button onClick={() => setSelected(null)} className="text-[11px]" style={{ color: '#8b5cf6' }}>Cambiar</button>
            </div>

            {/* Serving options */}
            {selected.serving_units.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selected.serving_units.map(su => (
                  <button key={su.label} onClick={() => handleServingClick(su.grams)}
                    className="px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                    style={{
                      background: parseFloat(grams) === su.grams ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${parseFloat(grams) === su.grams ? 'rgba(139,92,246,0.4)' : 'var(--line)'}`,
                      color: parseFloat(grams) === su.grams ? '#8b5cf6' : 'var(--text-1)',
                    }}>
                    {su.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] num" style={{ color: 'var(--text-2)' }}>Gramos</label>
                <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
                  className="w-full bg-transparent border rounded-lg px-3 py-2 text-[14px] num mt-1"
                  style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
              </div>
              {macros && (
                <div className="grid grid-cols-4 gap-2 flex-1">
                  {[
                    { label: 'Cal', value: macros.calories, color: '#f97316' },
                    { label: 'P', value: macros.protein, color: '#8b5cf6' },
                    { label: 'C', value: macros.carbs, color: '#fbbf24' },
                    { label: 'G', value: macros.fat, color: '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <div className="text-[13px] font-bold num" style={{ color }}>{value}</div>
                      <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => void handleAdd()} disabled={saving || !macros}
              className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors"
              style={{ background: MEAL_COLORS[meal], color: '#fff', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Agregando...' : `Agregar a ${MEAL_LABELS[meal]}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Meal group card ──────────────────────────────────────────

function MealCard({ meal, logs, onAdd, onRemove }: {
  meal: MealType
  logs: Array<{ id: string; calories: number; protein: number; carbs: number; fat: number; grams?: number | null; foods?: { name: string; brand?: string | null } | null; recipes?: { name: string } | null; notes?: string | null }>
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const color = MEAL_COLORS[meal]
  const total = logs.reduce((a, l) => ({ cal: a.cal + l.calories, prot: a.prot + l.protein }), { cal: 0, prot: 0 })

  return (
    <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <button
        className="w-full flex items-center justify-between p-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-0)' }}>{MEAL_LABELS[meal]}</span>
          {logs.length > 0 && (
            <span className="text-[11px] num px-2 py-0.5 rounded-full"
              style={{ background: `${color}18`, color }}>
              {Math.round(total.cal)} kcal
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: `${color}15`, color }}>
            <Plus size={13} />
          </button>
          {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-2)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-2)' }} />}
        </div>
      </button>

      {expanded && logs.length > 0 && (
        <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'var(--line)' }}>
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between py-2">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>
                  {log.foods?.name ?? log.recipes?.name ?? 'Alimento'}
                </div>
                <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                  {log.grams ? `${log.grams}g · ` : ''}
                  {Math.round(log.calories)} kcal · {log.protein}g prot
                </div>
              </div>
              <button onClick={() => onRemove(log.id)}
                className="w-6 h-6 rounded-md flex items-center justify-center ml-2 shrink-0"
                style={{ color: 'var(--text-2)' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {expanded && logs.length === 0 && (
        <div className="px-4 pb-4">
          <button onClick={onAdd}
            className="w-full py-2.5 rounded-xl text-[12px] border-dashed border transition-colors"
            style={{ borderColor: color, color, background: `${color}08` }}>
            + Agregar alimento
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────

export function FitnessAlimentacion() {
  const today = toToday()
  const { macros, grouped, loading, addLog, removeLog } = useFoodLogs(today)
  const { goalsMap } = useFitnessGoals()
  const [addingTo, setAddingTo] = useState<MealType | null>(null)

  const calGoal = goalsMap['daily_calories']
  const protGoal = goalsMap['daily_protein']

  return (
    <>
      {/* Daily summary strip */}
      <div className="glass p-4 mb-4" style={{ borderRadius: 18 }}>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Calorías', value: Math.round(macros.calories), goal: calGoal, unit: 'kcal', color: '#f97316' },
            { label: 'Proteína', value: macros.protein,  goal: protGoal, unit: 'g',    color: '#8b5cf6' },
            { label: 'Carbos',   value: macros.carbs,    unit: 'g',    color: '#fbbf24' },
            { label: 'Grasas',   value: macros.fat,      unit: 'g',    color: '#f87171' },
          ].map(({ label, value, goal, unit, color }) => (
            <div key={label} className="text-center">
              <div className="text-[11px] num uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--text-2)' }}>{label}</div>
              <div className="text-[20px] font-bold num leading-none" style={{ color }}>{value}</div>
              {goal && (
                <div className="text-[10px] num mt-0.5" style={{ color: 'var(--text-2)' }}>/{goal}{unit}</div>
              )}
              {!goal && <div className="text-[10px] num mt-0.5" style={{ color: 'var(--text-2)' }}>{unit}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Meal cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl animate-shimmer" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.keys(MEAL_LABELS) as MealType[]).map(meal => (
            <MealCard
              key={meal}
              meal={meal}
              logs={grouped[meal]}
              onAdd={() => setAddingTo(meal)}
              onRemove={removeLog}
            />
          ))}
        </div>
      )}

      {/* Food search modal */}
      {addingTo && (
        <FoodSearchModal
          meal={addingTo}
          onAdd={addLog}
          onClose={() => setAddingTo(null)}
        />
      )}
    </>
  )
}
