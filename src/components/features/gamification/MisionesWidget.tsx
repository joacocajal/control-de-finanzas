'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, Clock, XCircle, Plus, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MisionDiaria, MisionDificultad, CreateMisionInput } from '@/types/database.types'

const DIFICULTAD_CONFIG: Record<MisionDificultad, { label: string; color: string; xp: number }> = {
  facil:   { label: 'Fácil',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', xp: 10 },
  media:   { label: 'Media',   color: 'text-amber-400   bg-amber-500/10   border-amber-500/20',   xp: 25 },
  dificil: { label: 'Difícil', color: 'text-rose-400    bg-rose-500/10    border-rose-500/20',    xp: 50 },
}

const ESTADO_ICON = {
  pendiente:  <Clock      size={15} className="text-gray-500 shrink-0" />,
  completada: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />,
  fallada:    <XCircle    size={15} className="text-rose-400 shrink-0" />,
}

function MisionRow({
  mision,
  onCompletar,
  onFallar,
  completing,
}: {
  mision: MisionDiaria
  onCompletar: (id: string) => Promise<void>
  onFallar: (id: string) => Promise<void>
  completing: string | null
}) {
  const cfg = DIFICULTAD_CONFIG[mision.dificultad]
  const isPending = mision.estado === 'pendiente'
  const isLoading = completing === mision.id

  return (
    <div className={cn(
      'flex flex-col gap-2 px-4 py-3 rounded-xl border transition-colors',
      mision.estado === 'completada'
        ? 'bg-emerald-500/[0.04] border-emerald-500/10 opacity-70'
        : mision.estado === 'fallada'
        ? 'bg-rose-500/[0.04] border-rose-500/10 opacity-60'
        : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
    )}>
      {/* Línea 1: ícono + descripción */}
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">{ESTADO_ICON[mision.estado]}</div>
        <p className={cn(
          'text-sm leading-snug',
          mision.estado === 'completada' ? 'line-through text-gray-600' : 'text-gray-200'
        )}>
          {mision.descripcion}
        </p>
      </div>

      {/* Línea 2: badge + xp + acciones */}
      <div className="flex items-center justify-between pl-[22px]">
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', cfg.color)}>
            {cfg.label}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-amber-400">
            <Zap size={10} />
            {mision.xp_recompensa} XP
          </span>
        </div>
        {isPending && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => void onCompletar(mision.id)}
              disabled={isLoading}
              className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors px-2 py-0.5 rounded-lg hover:bg-indigo-500/10"
            >
              {isLoading ? '...' : 'Completar'}
            </button>
            <span className="text-gray-700 text-[10px]">·</span>
            <button
              onClick={() => void onFallar(mision.id)}
              disabled={isLoading}
              className="text-xs text-rose-500 hover:text-rose-400 disabled:opacity-40 transition-colors px-2 py-0.5 rounded-lg hover:bg-rose-500/10"
            >
              Fallar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const DIFICULTAD_OPTIONS: MisionDificultad[] = ['facil', 'media', 'dificil']

function NuevaMisionForm({ onSubmit, onCancel }: {
  onSubmit: (input: CreateMisionInput) => Promise<void>
  onCancel: () => void
}) {
  const [descripcion, setDescripcion] = useState('')
  const [dificultad, setDificultad] = useState<MisionDificultad>('media')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descripcion.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        descripcion: descripcion.trim(),
        dificultad,
        xp_recompensa: DIFICULTAD_CONFIG[dificultad].xp,
      })
      setDescripcion('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 rounded-xl border border-white/[0.06] bg-gray-900 p-4 space-y-3">
      <input
        type="text"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción de la misión..."
        className="w-full rounded-lg border border-white/[0.06] bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
        autoFocus
      />
      <div className="flex items-center gap-2">
        {DIFICULTAD_OPTIONS.map((d) => {
          const cfg = DIFICULTAD_CONFIG[d]
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDificultad(d)}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all',
                dificultad === d ? cfg.color : 'text-gray-600 border-white/[0.06] hover:text-gray-400'
              )}
            >
              {cfg.label} +{cfg.xp}XP
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!descripcion.trim() || saving}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
        >
          {saving ? 'Guardando...' : 'Crear misión'}
        </button>
      </div>
    </form>
  )
}

interface MisionesWidgetProps {
  misiones: MisionDiaria[]
  loading: boolean
  onCompletar: (id: string) => Promise<void>
  onFallar: (id: string) => Promise<void>
  onCrear: (input: CreateMisionInput) => Promise<void>
}

export function MisionesWidget({ misiones, loading, onCompletar, onFallar, onCrear }: MisionesWidgetProps) {
  const [showForm, setShowForm] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)

  const handleCompletar = useCallback(async (id: string) => {
    setCompleting(id)
    try { await onCompletar(id) } finally { setCompleting(null) }
  }, [onCompletar])

  const handleFallar = useCallback(async (id: string) => {
    setCompleting(id)
    try { await onFallar(id) } finally { setCompleting(null) }
  }, [onFallar])

  const handleCrear = useCallback(async (input: CreateMisionInput) => {
    await onCrear(input)
    setShowForm(false)
  }, [onCrear])

  const pendientes = misiones.filter((m) => m.estado === 'pendiente').length
  const completadas = misiones.filter((m) => m.estado === 'completada').length

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Target size={15} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Misiones de hoy</p>
            {misiones.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                {completadas}/{misiones.length} completadas
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 transition-colors"
        >
          <Plus size={12} />
          Nueva
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-shimmer" />
          ))}
        </div>
      ) : misiones.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-600">
          <Target size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin misiones para hoy</p>
          <p className="text-xs mt-1">Crea tu primera misión del día</p>
        </div>
      ) : (
        <div className="space-y-2">
          {misiones
            .filter((m) => m.estado === 'pendiente')
            .map((m) => (
              <MisionRow key={m.id} mision={m} onCompletar={handleCompletar} onFallar={handleFallar} completing={completing} />
            ))}
          {misiones
            .filter((m) => m.estado !== 'pendiente')
            .map((m) => (
              <MisionRow key={m.id} mision={m} onCompletar={handleCompletar} onFallar={handleFallar} completing={completing} />
            ))}
        </div>
      )}

      {showForm && (
        <NuevaMisionForm onSubmit={handleCrear} onCancel={() => setShowForm(false)} />
      )}

      {!loading && misiones.length > 0 && pendientes === 0 && (
        <div className="mt-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 px-4 py-2.5 text-center">
          <p className="text-xs text-emerald-400 font-medium">Todas las misiones completadas</p>
        </div>
      )}
    </div>
  )
}
