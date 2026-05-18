'use client'

import { useState } from 'react'
import { Utensils, Droplets, Plus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNutrition } from '@/hooks/useNutrition'
import type { AlimentoBase } from '@/types/database.types'

// ─── Agua ────────────────────────────────────────────────────

const META_AGUA_ML = 2500

function AguaWidget({
  totalMl,
  onAdd,
}: {
  totalMl: number
  onAdd: (ml: number) => Promise<void>
}) {
  const pct = Math.min(100, Math.round((totalMl / META_AGUA_ML) * 100))
  const [loading, setLoading] = useState<number | null>(null)

  const handle = async (ml: number) => {
    setLoading(ml)
    try { await onAdd(ml) } finally { setLoading(null) }
  }

  return (
    <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.04] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-sky-400" />
          <p className="text-xs font-semibold text-white">Hidratación</p>
        </div>
        <span className="text-xs font-mono text-sky-400">{(totalMl / 1000).toFixed(1)}L / {META_AGUA_ML / 1000}L</span>
      </div>
      <div className="h-2 w-full rounded-full bg-sky-500/10 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        {([250, 500, 1000] as const).map(ml => (
          <button
            key={ml}
            onClick={() => void handle(ml)}
            disabled={loading !== null}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-sky-500/20 text-sky-400 hover:bg-sky-500/10 disabled:opacity-40 transition-colors"
          >
            {loading === ml ? <Loader2 size={11} className="animate-spin mx-auto" /> : `+${ml < 1000 ? ml : '1000'}ml`}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Formulario de comida ─────────────────────────────────────

function ComidaForm({
  alimentosBase,
  onSubmit,
  onCancel,
  calcularMacros,
}: {
  alimentosBase: AlimentoBase[]
  onSubmit: (input: { alimento_id?: string; nombre_alimento_custom?: string; cantidad_g: number; calorias_totales: number; proteinas_totales: number }) => Promise<void>
  onCancel: () => void
  calcularMacros: (a: AlimentoBase, g: number) => { calorias_totales: number; proteinas_totales: number }
}) {
  const [alimentoId, setAlimentoId] = useState('')
  const [customNombre, setCustomNombre] = useState('')
  const [cantidad, setCantidad] = useState('100')
  const [saving, setSaving] = useState(false)

  const alimentoSel = alimentosBase.find(a => a.id === alimentoId)
  const macros = alimentoSel && cantidad
    ? calcularMacros(alimentoSel, parseFloat(cantidad) || 0)
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cantidad) return
    const g = parseFloat(cantidad)
    if (!g) return
    setSaving(true)
    try {
      if (alimentoSel) {
        const m = calcularMacros(alimentoSel, g)
        await onSubmit({
          alimento_id: alimentoSel.id,
          cantidad_g: g,
          calorias_totales: m.calorias_totales,
          proteinas_totales: m.proteinas_totales,
        })
      } else {
        await onSubmit({
          nombre_alimento_custom: customNombre.trim() || 'Personalizado',
          cantidad_g: g,
          calorias_totales: 0,
          proteinas_totales: 0,
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-xl border border-white/[0.06] bg-gray-800 p-4 space-y-3">
      <select
        value={alimentoId}
        onChange={(e) => setAlimentoId(e.target.value)}
        className="w-full rounded-lg border border-white/[0.06] bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40"
      >
        <option value="">— Seleccionar alimento —</option>
        {alimentosBase.map(a => (
          <option key={a.id} value={a.id}>{a.nombre}</option>
        ))}
        <option value="__custom">✏ Personalizado</option>
      </select>

      {alimentoId === '__custom' && (
        <input
          type="text"
          value={customNombre}
          onChange={(e) => setCustomNombre(e.target.value)}
          placeholder="Nombre del alimento..."
          className="w-full rounded-lg border border-white/[0.06] bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40"
        />
      )}

      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="gramos"
          min={1}
          step={1}
          required
          className="w-28 rounded-lg border border-white/[0.06] bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40"
        />
        <span className="text-xs text-gray-500">g</span>
        {macros && (
          <div className="flex gap-3 ml-2">
            <span className="text-xs text-amber-400">{macros.calorias_totales} kcal</span>
            <span className="text-xs text-emerald-400">{macros.proteinas_totales}g prot</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || (!alimentoId && !customNombre.trim())}
          className="flex-1 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors"
        >
          {saving ? 'Guardando...' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────

const META_KCAL = 2400
const META_PROT = 200

interface NutricionSectionProps {
  onMutation?: () => void
}

export function NutricionSection({ onMutation }: NutricionSectionProps) {
  const {
    alimentosBase, resumen, loading, error,
    addComida, addAgua, removeLog, calcularMacros,
  } = useNutrition(onMutation)

  const [showForm, setShowForm] = useState(false)

  const pctKcal = Math.min(100, Math.round((resumen.totalCalorias / META_KCAL) * 100))
  const pctProt = Math.min(100, Math.round((resumen.totalProteinas / META_PROT) * 100))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Utensils size={15} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Nutrición</p>
            <p className="text-sm font-semibold text-white leading-none">Hoy</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
        >
          <Plus size={12} />
          Comida
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map(i => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-shimmer" />)}
        </div>
      ) : (
        <>
          {/* Macros resumen */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Calorías</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5 font-mono">
                {Math.round(resumen.totalCalorias)}
                <span className="text-xs text-gray-600 font-normal"> / {META_KCAL}</span>
              </p>
              <div className="h-1.5 w-full rounded-full bg-amber-500/10 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${pctKcal}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Proteínas</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">
                {Math.round(resumen.totalProteinas)}g
                <span className="text-xs text-gray-600 font-normal"> / {META_PROT}g</span>
              </p>
              <div className="h-1.5 w-full rounded-full bg-emerald-500/10 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pctProt}%` }} />
              </div>
            </div>
          </div>

          {/* Agua */}
          <AguaWidget totalMl={resumen.totalAguaMl} onAdd={addAgua} />

          {/* Form */}
          {showForm && (
            <ComidaForm
              alimentosBase={alimentosBase}
              onSubmit={async (input) => {
                await addComida(input)
                setShowForm(false)
              }}
              onCancel={() => setShowForm(false)}
              calcularMacros={calcularMacros}
            />
          )}

          {/* Log del día */}
          {resumen.logs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Log del día</p>
              {resumen.logs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02] group"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">
                      {log.nombre_alimento_custom ?? alimentosBase.find(a => a.id === log.alimento_id)?.nombre ?? 'Alimento'}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {log.cantidad_g}g · {Math.round(log.calorias_totales)} kcal · {Math.round(log.proteinas_totales)}g prot
                    </p>
                  </div>
                  <button
                    onClick={() => void removeLog(log.id)}
                    className={cn(
                      'ml-3 text-gray-700 hover:text-rose-400 transition-colors shrink-0',
                      'opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 opacity-100',
                    )}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {resumen.logs.length === 0 && !showForm && (
            <div className="text-center py-6 text-gray-600">
              <Utensils size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin registros hoy</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
