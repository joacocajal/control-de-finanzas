'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Trash2, ChevronDown, ChevronUp, X, Loader2, BookOpen } from 'lucide-react'
import { useFoodLogs } from '@/hooks/useFoodLogs'
import { useFitnessGoals } from '@/hooks/useFitnessGoals'
import { useFoodSearch } from '@/hooks/useFoods'
import { calcMacros } from '@/services/foods.service'
import { getRecipes, calcRecipeMacros } from '@/services/recipes.service'
import { MEASUREMENT_UNITS, toGrams } from '@/lib/units'
import type { Food, MealType, CreateFoodLogInput, RecipeWithIngredients } from '@/types/database.types'

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
  const [mode, setMode] = useState<'food' | 'recipe'>('food')

  // Food mode
  const { results, loading, search } = useFoodSearch()
  const [selected, setSelected] = useState<Food | null>(null)
  const [amount, setAmount] = useState('100')
  const [unit, setUnit] = useState('g')
  const [gramsPerUnit, setGramsPerUnit] = useState('50')

  // Recipe mode
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null)
  const [servings, setServings] = useState('1')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'recipe' && recipes.length === 0) {
      setRecipesLoading(true)
      getRecipes()
        .then(r => setRecipes(r))
        .catch(() => {})
        .finally(() => setRecipesLoading(false))
    }
  }, [mode, recipes.length])

  const grams = toGrams(parseFloat(amount) || 0, unit, parseFloat(gramsPerUnit) || 1)
  const macros = selected ? calcMacros(selected, grams) : null

  const recipeMacros = selectedRecipe ? calcRecipeMacros(selectedRecipe) : null
  const srv = Math.max(parseFloat(servings) || 1, 0.25)

  const handleAddFood = async () => {
    if (!selected || !macros) return
    setSaving(true)
    try {
      await onAdd({
        meal_type: meal,
        food_id: selected.id,
        grams,
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

  const handleAddRecipe = async () => {
    if (!selectedRecipe || !recipeMacros) return
    setSaving(true)
    try {
      await onAdd({
        meal_type: meal,
        recipe_id: selectedRecipe.id,
        servings: srv,
        calories: Math.round(recipeMacros.perServing.calories * srv),
        protein: Math.round(recipeMacros.perServing.protein * srv * 10) / 10,
        carbs: Math.round(recipeMacros.perServing.carbs * srv * 10) / 10,
        fat: Math.round(recipeMacros.perServing.fat * srv * 10) / 10,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleServingClick = (g: number) => { setAmount(String(g)); setUnit('g') }

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

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}>
          {([['food', 'Alimento'], ['recipe', 'Receta']] as const).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: mode === m ? MEAL_COLORS[meal] + '22' : 'transparent',
                border: mode === m ? `1px solid ${MEAL_COLORS[meal]}44` : '1px solid transparent',
                color: mode === m ? MEAL_COLORS[meal] : 'var(--text-2)',
              }}>
              {m === 'recipe' && <BookOpen size={12} />}
              {m === 'food' && <Search size={12} />}
              {label}
            </button>
          ))}
        </div>

        {/* ── Food mode ── */}
        {mode === 'food' && (
          <>
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

            {selected && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)' }}>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>{selected.name}</div>
                  <button onClick={() => setSelected(null)} className="text-[11px]" style={{ color: '#8b5cf6' }}>Cambiar</button>
                </div>

                {selected.serving_units.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {selected.serving_units.map(su => (
                      <button key={su.label} onClick={() => handleServingClick(su.grams)}
                        className="px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                        style={{
                          background: unit === 'g' && parseFloat(amount) === su.grams ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${unit === 'g' && parseFloat(amount) === su.grams ? 'rgba(139,92,246,0.4)' : 'var(--line)'}`,
                          color: unit === 'g' && parseFloat(amount) === su.grams ? '#8b5cf6' : 'var(--text-1)',
                        }}>
                        {su.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[11px] num" style={{ color: 'var(--text-2)' }}>Cantidad</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      className="w-full bg-transparent border rounded-lg px-3 py-2 text-[14px] num mt-1"
                      style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="text-[11px] num" style={{ color: 'var(--text-2)' }}>Unidad</label>
                    <select value={unit} onChange={e => setUnit(e.target.value)}
                      className="border rounded-lg px-2 py-2 text-[12px] mt-1 block"
                      style={{ borderColor: 'var(--line)', color: 'var(--text-1)', outline: 'none', background: 'rgba(255,255,255,0.04)' }}>
                      {MEASUREMENT_UNITS.map(u => (
                        <option key={u.label} value={u.label} style={{ background: '#1a1a1a' }}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {unit === 'unidad' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>Gramos por unidad:</span>
                    <input type="number" value={gramsPerUnit} onChange={e => setGramsPerUnit(e.target.value)} min={1}
                      className="w-20 bg-transparent border rounded-lg px-2 py-1.5 text-[12px] num text-center"
                      style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
                  </div>
                )}

                {unit !== 'g' && unit !== 'ml' && grams > 0 && (
                  <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>≈ {Math.round(grams)}g</div>
                )}

                {macros && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Cal', value: macros.calories, color: '#f97316' },
                      { label: 'Prot', value: macros.protein, color: '#8b5cf6' },
                      { label: 'Carb', value: macros.carbs, color: '#fbbf24' },
                      { label: 'Gras', value: macros.fat, color: '#f87171' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-[14px] font-bold num" style={{ color }}>{value}</div>
                        <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => void handleAddFood()} disabled={saving || !macros || grams <= 0}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors"
                  style={{ background: MEAL_COLORS[meal], color: '#fff', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Agregando...' : `Agregar a ${MEAL_LABELS[meal]}`}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Recipe mode ── */}
        {mode === 'recipe' && (
          <>
            {recipesLoading && (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-2)' }} /></div>
            )}

            {!recipesLoading && recipes.length === 0 && (
              <div className="text-center py-6 text-[13px]" style={{ color: 'var(--text-2)' }}>
                No tenés recetas guardadas aún.
              </div>
            )}

            {!recipesLoading && !selectedRecipe && recipes.length > 0 && (
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {recipes.map(r => {
                  const m = calcRecipeMacros(r)
                  return (
                    <button key={r.id} onClick={() => setSelectedRecipe(r)}
                      className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[13px] font-medium" style={{ color: 'var(--text-0)' }}>{r.name}</div>
                          <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                            {r.servings} {r.servings === 1 ? 'porción' : 'porciones'} · {r.recipe_ingredients.length} ing.
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[12px] num font-semibold" style={{ color: '#f97316' }}>
                            {Math.round(m.perServing.calories)} kcal
                          </div>
                          <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>por porción</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedRecipe && recipeMacros && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)' }}>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>{selectedRecipe.name}</div>
                    <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                      {selectedRecipe.recipe_ingredients.length} ingredientes
                    </div>
                  </div>
                  <button onClick={() => setSelectedRecipe(null)} className="text-[11px]" style={{ color: '#8b5cf6' }}>Cambiar</button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>Porciones:</label>
                  <input type="number" value={servings} onChange={e => setServings(e.target.value)}
                    min={0.25} step={0.5}
                    className="w-20 bg-transparent border rounded-lg px-3 py-2 text-[14px] num text-center"
                    style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
                  <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                    de {selectedRecipe.servings}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Cal', value: Math.round(recipeMacros.perServing.calories * srv), color: '#f97316' },
                    { label: 'Prot', value: Math.round(recipeMacros.perServing.protein * srv * 10) / 10, color: '#8b5cf6' },
                    { label: 'Carb', value: Math.round(recipeMacros.perServing.carbs * srv * 10) / 10, color: '#fbbf24' },
                    { label: 'Gras', value: Math.round(recipeMacros.perServing.fat * srv * 10) / 10, color: '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-[14px] font-bold num" style={{ color }}>{value}</div>
                      <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => void handleAddRecipe()} disabled={saving}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors"
                  style={{ background: MEAL_COLORS[meal], color: '#fff', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Agregando...' : `Agregar a ${MEAL_LABELS[meal]}`}
                </button>
              </div>
            )}
          </>
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
