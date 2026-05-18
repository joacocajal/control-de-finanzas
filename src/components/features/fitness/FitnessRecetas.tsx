'use client'

import { useState } from 'react'
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, X, Search, Loader2 } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useFoodSearch } from '@/hooks/useFoods'
import type { RecipeWithIngredients, CreateRecipeInput } from '@/types/database.types'

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[13px] font-bold num" style={{ color }}>{Math.round(value * 10) / 10}</div>
      <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{label}</div>
    </div>
  )
}

function RecipeCard({ recipe, onDelete, calcMacros }: {
  recipe: RecipeWithIngredients
  onDelete: (id: string) => Promise<void>
  calcMacros: (r: RecipeWithIngredients) => { total: { calories: number; protein: number; carbs: number; fat: number }; perServing: { calories: number; protein: number; carbs: number; fat: number } }
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const m = calcMacros(recipe)

  return (
    <div className="glass" style={{ borderRadius: 16 }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold" style={{ color: 'var(--text-0)' }}>{recipe.name}</div>
            {recipe.description && (
              <div className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-2)' }}>{recipe.description}</div>
            )}
            <div className="text-[11px] num mt-1" style={{ color: 'var(--text-2)' }}>
              {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'} · {recipe.recipe_ingredients.length} ingredientes
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={async () => { setDeleting(true); try { await onDelete(recipe.id) } finally { setDeleting(false) } }}
              disabled={deleting}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: 'var(--text-2)' }}>
              <Trash2 size={13} />
            </button>
            <button onClick={() => setExpanded(v => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: 'var(--text-2)' }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Macros per serving */}
        <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
          <MacroBadge label="kcal/p" value={m.perServing.calories} color="#f97316" />
          <MacroBadge label="prot" value={m.perServing.protein} color="#8b5cf6" />
          <MacroBadge label="carbos" value={m.perServing.carbs} color="#fbbf24" />
          <MacroBadge label="grasas" value={m.perServing.fat} color="#f87171" />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-1.5 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="text-[11px] num uppercase tracking-[0.12em] pt-3 mb-2" style={{ color: 'var(--text-2)' }}>Ingredientes</div>
          {recipe.recipe_ingredients.map(ing => {
            const factor = ing.grams / 100
            return (
              <div key={ing.id} className="flex justify-between items-center py-1.5 px-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-[12px]" style={{ color: 'var(--text-1)' }}>{ing.foods.name}</span>
                <span className="text-[12px] num" style={{ color: 'var(--text-2)' }}>
                  {ing.display_amount ? `${ing.display_amount} ${ing.display_unit ?? ''}` : `${ing.grams}g`}
                  {' · '}{Math.round(ing.foods.calories_per_100g * factor)} kcal
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NewRecipeForm({ onCreate, onCancel }: { onCreate: (input: CreateRecipeInput) => Promise<void>; onCancel: () => void }) {
  const { results, loading: searching, search } = useFoodSearch()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState('1')
  const [ingredients, setIngredients] = useState<Array<{ food_id: string; food_name: string; grams: number }>>([])
  const [grams, setGrams] = useState('100')
  const [saving, setSaving] = useState(false)

  const addIngredient = (foodId: string, foodName: string) => {
    const g = parseFloat(grams)
    if (isNaN(g) || g <= 0) return
    setIngredients(prev => [...prev, { food_id: foodId, food_name: foodName, grams: g }])
  }

  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onCreate({ name: name.trim(), description: description || null, servings: parseInt(servings, 10) || 1 })
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleCreate(e)} className="glass p-5 space-y-4" style={{ borderRadius: 18, border: '1px solid rgba(52,211,153,0.2)' }}>
      <div className="text-[13px] font-semibold" style={{ color: '#34d399' }}>Nueva receta</div>

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la receta" required
        className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px]"
        style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />

      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" rows={2}
        className="w-full bg-transparent border rounded-xl px-3 py-2.5 text-[13px] resize-none"
        style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />

      <div className="flex items-center gap-2">
        <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>Porciones:</label>
        <input type="number" value={servings} onChange={e => setServings(e.target.value)} min={1}
          className="w-16 bg-transparent border rounded-lg px-2 py-1.5 text-[13px] num text-center"
          style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
      </div>

      {ingredients.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Ingredientes añadidos</div>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 px-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}>
              <span className="text-[12px]" style={{ color: 'var(--text-1)' }}>{ing.food_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] num" style={{ color: 'var(--text-2)' }}>{ing.grams}g</span>
                <button type="button" onClick={() => removeIngredient(i)}
                  className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>Buscar ingrediente</div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-2)' }} />
            <input onChange={e => search(e.target.value)} placeholder="Buscar alimento..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-[13px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }} />
          </div>
          <input type="number" value={grams} onChange={e => setGrams(e.target.value)} placeholder="g"
            className="w-20 bg-transparent border rounded-lg px-2 py-2 text-[13px] num text-center"
            style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }} />
        </div>
        {searching && <div className="flex justify-center"><Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-2)' }} /></div>}
        {!searching && results.length > 0 && (
          <div className="max-h-36 overflow-y-auto space-y-1">
            {results.map(food => (
              <button key={food.id} type="button" onClick={() => addIngredient(food.id, food.name)}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--text-1)' }}>
                {food.name}
                <span className="ml-2 text-[10px] num" style={{ color: 'var(--text-2)' }}>{food.calories_per_100g} kcal/100g</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: '#34d399', color: '#0a0a0a' }}>
          {saving ? 'Guardando...' : 'Crear receta'}
        </button>
        <button type="button" onClick={onCancel}
          className="py-2.5 px-4 rounded-xl text-[13px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function FitnessRecetas() {
  const { recipes, loading, create, remove, calcMacros } = useRecipes()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
            <BookOpen size={14} />
          </div>
          <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>
            Mis recetas
          </h2>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium"
          style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
          <Plus size={13} />
          Nueva
        </button>
      </div>

      {showForm && (
        <NewRecipeForm onCreate={create} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-[13px]" style={{ color: 'var(--text-2)' }}>
          No tenés recetas guardadas aún.
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={remove} calcMacros={calcMacros} />
          ))}
        </div>
      )}
    </div>
  )
}
