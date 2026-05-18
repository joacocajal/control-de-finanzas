'use client'

import { useState, useCallback } from 'react'
import { Dumbbell, Plus, Trophy, ChevronRight, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGym } from '@/hooks/useGym'
import type { GymEjercicio, CreateGymSerieLogInput } from '@/types/database.types'

// ─── Subcomponents ────────────────────────────────────────────

function SerieForm({
  ejercicio,
  onSubmit,
  onCancel,
}: {
  ejercicio: GymEjercicio
  onSubmit: (input: CreateGymSerieLogInput) => Promise<void>
  onCancel: () => void
}) {
  const [peso, setPeso] = useState('')
  const [reps, setReps] = useState('')
  const [serie, setSerie] = useState('1')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reps) return
    setSaving(true)
    try {
      await onSubmit({
        ejercicio_id: ejercicio.id,
        numero_serie: parseInt(serie, 10),
        peso_kg: peso ? parseFloat(peso) : null,
        repeticiones: parseInt(reps, 10),
      })
      setPeso('')
      setReps('')
      setSerie(prev => String(parseInt(prev, 10) + 1))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-2 flex items-center gap-2 flex-wrap"
    >
      <input
        type="number"
        value={serie}
        onChange={(e) => setSerie(e.target.value)}
        placeholder="Serie"
        min={1}
        className="w-16 rounded-lg border border-white/[0.06] bg-gray-800 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
      />
      <input
        type="number"
        value={peso}
        onChange={(e) => setPeso(e.target.value)}
        placeholder="kg"
        step="0.5"
        className="w-20 rounded-lg border border-white/[0.06] bg-gray-800 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
      />
      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="reps"
        min={1}
        required
        className="w-20 rounded-lg border border-white/[0.06] bg-gray-800 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
      />
      <button
        type="submit"
        disabled={!reps || saving}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-colors"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : '✓'}
      </button>
      <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-400 transition-colors">
        <X size={14} />
      </button>
    </form>
  )
}

function EjercicioRow({
  ejercicio,
  onRegistrar,
}: {
  ejercicio: GymEjercicio
  onRegistrar: (input: CreateGymSerieLogInput) => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
            <Dumbbell size={13} className="text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{ejercicio.nombre_ejercicio}</p>
            {ejercicio.notas && (
              <p className="text-[11px] text-gray-600 truncate">{ejercicio.notas}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
            open
              ? 'text-violet-300 border-violet-500/30 bg-violet-500/10'
              : 'text-gray-500 border-white/[0.06] hover:text-gray-300 hover:border-white/[0.12]',
          )}
        >
          <Plus size={11} />
          Serie
        </button>
      </div>

      {open && (
        <SerieForm
          ejercicio={ejercicio}
          onSubmit={async (input) => {
            await onRegistrar(input)
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

interface GymSectionProps {
  onMutation?: () => void
}

export function GymSection({ onMutation }: GymSectionProps) {
  const {
    rutinas, rutinaActiva, ejercicios, prs, loading, error,
    setRutinaActiva, crearRutina, crearEjercicio, registrarSerie,
  } = useGym(onMutation)

  const [showNuevaRutina, setShowNuevaRutina] = useState(false)
  const [showNuevoEjercicio, setShowNuevoEjercicio] = useState(false)
  const [nombreRutina, setNombreRutina] = useState('')
  const [nombreEjercicio, setNombreEjercicio] = useState('')
  const [notasEjercicio, setNotasEjercicio] = useState('')
  const [savingR, setSavingR] = useState(false)
  const [savingE, setSavingE] = useState(false)

  const handleCrearRutina = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreRutina.trim()) return
    setSavingR(true)
    try {
      await crearRutina({ nombre_rutina: nombreRutina.trim() })
      setNombreRutina('')
      setShowNuevaRutina(false)
    } finally {
      setSavingR(false)
    }
  }

  const handleCrearEjercicio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rutinaActiva || !nombreEjercicio.trim()) return
    setSavingE(true)
    try {
      await crearEjercicio({
        rutina_id: rutinaActiva.id,
        nombre_ejercicio: nombreEjercicio.trim(),
        notas: notasEjercicio.trim() || null,
      })
      setNombreEjercicio('')
      setNotasEjercicio('')
      setShowNuevoEjercicio(false)
    } finally {
      setSavingE(false)
    }
  }

  const handleRegistrar = useCallback(async (input: CreateGymSerieLogInput) => {
    await registrarSerie(input)
  }, [registrarSerie])

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Dumbbell size={15} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Forge</p>
            <p className="text-sm font-semibold text-white leading-none">Entrenamiento</p>
          </div>
        </div>
        <button
          onClick={() => setShowNuevaRutina(!showNuevaRutina)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/20 transition-colors"
        >
          <Plus size={12} />
          Rutina
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-400 mb-3">{error}</p>
      )}

      {/* Nueva rutina form */}
      {showNuevaRutina && (
        <form onSubmit={(e) => void handleCrearRutina(e)} className="mb-4 flex gap-2">
          <input
            type="text"
            value={nombreRutina}
            onChange={(e) => setNombreRutina(e.target.value)}
            placeholder="Nombre de la rutina..."
            autoFocus
            className="flex-1 rounded-lg border border-white/[0.06] bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
          />
          <button
            type="submit"
            disabled={!nombreRutina.trim() || savingR}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-colors"
          >
            {savingR ? <Loader2 size={14} className="animate-spin" /> : 'Crear'}
          </button>
          <button type="button" onClick={() => setShowNuevaRutina(false)} className="text-gray-600 hover:text-gray-400 px-1">
            <X size={16} />
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-shimmer" />)}
        </div>
      ) : rutinas.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <Dumbbell size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin rutinas</p>
          <p className="text-xs mt-1">Crea tu primera rutina para empezar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rutina tabs */}
          {rutinas.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {rutinas.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRutinaActiva(r)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    rutinaActiva?.id === r.id
                      ? 'text-violet-300 border-violet-500/30 bg-violet-500/10'
                      : 'text-gray-500 border-white/[0.06] hover:text-gray-300',
                  )}
                >
                  {r.nombre_rutina}
                </button>
              ))}
            </div>
          )}

          {rutinaActiva && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white">{rutinaActiva.nombre_rutina}</p>
                <button
                  onClick={() => setShowNuevoEjercicio(!showNuevoEjercicio)}
                  className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={11} />
                  Ejercicio
                </button>
              </div>

              {/* Nuevo ejercicio form */}
              {showNuevoEjercicio && (
                <form onSubmit={(e) => void handleCrearEjercicio(e)} className="mb-3 space-y-2">
                  <input
                    type="text"
                    value={nombreEjercicio}
                    onChange={(e) => setNombreEjercicio(e.target.value)}
                    placeholder="Nombre del ejercicio..."
                    autoFocus
                    className="w-full rounded-lg border border-white/[0.06] bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={notasEjercicio}
                      onChange={(e) => setNotasEjercicio(e.target.value)}
                      placeholder="Notas opcionales..."
                      className="flex-1 rounded-lg border border-white/[0.06] bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
                    />
                    <button
                      type="submit"
                      disabled={!nombreEjercicio.trim() || savingE}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-colors"
                    >
                      {savingE ? <Loader2 size={12} className="animate-spin" /> : 'Añadir'}
                    </button>
                    <button type="button" onClick={() => setShowNuevoEjercicio(false)} className="text-gray-600 hover:text-gray-400">
                      <X size={14} />
                    </button>
                  </div>
                </form>
              )}

              {ejercicios.length === 0 ? (
                <p className="text-xs text-gray-600 py-4 text-center">Sin ejercicios en esta rutina</p>
              ) : (
                <div className="space-y-2">
                  {ejercicios.map(e => (
                    <EjercicioRow key={e.id} ejercicio={e} onRegistrar={handleRegistrar} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRs */}
          {prs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-2">
                <Trophy size={13} className="text-amber-400" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Records personales</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {prs.map(pr => (
                  <div key={pr.id} className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-3 py-2.5">
                    <p className="text-[11px] text-gray-500 truncate">{pr.tipo_ejercicio}</p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">{pr.valor_record} kg</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ChevronRight size={10} className="text-gray-600" />
                      <p className="text-[10px] text-gray-600">{pr.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
