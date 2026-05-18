'use client'

import { TrendingUp, Dumbbell, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { xpPorcentaje, xpUmbral } from '@/hooks/useGamification'
import type { HabilidadStat, HabilidadCategoria } from '@/types/database.types'

const CONFIG: Record<HabilidadCategoria, {
  label: string
  Icon: React.ElementType
  gradient: string
  text: string
  border: string
  track: string
  fill: string
  glow: string
}> = {
  finanzas: {
    label: 'Finanzas',
    Icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    track: 'bg-emerald-500/15',
    fill: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20',
  },
  fitness: {
    label: 'Fitness',
    Icon: Dumbbell,
    gradient: 'from-orange-500 to-amber-500',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    track: 'bg-orange-500/15',
    fill: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
  },
  aprendizaje: {
    label: 'Aprendizaje',
    Icon: BookOpen,
    gradient: 'from-violet-500 to-indigo-600',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    track: 'bg-violet-500/15',
    fill: 'bg-violet-500',
    glow: 'shadow-violet-500/20',
  },
}

function HabilidadCard({ hab }: { hab: HabilidadStat }) {
  const cfg = CONFIG[hab.categoria]
  const pct = xpPorcentaje(hab.xp, hab.nivel)
  const umbral = xpUmbral(hab.nivel)

  return (
    <div className={cn(
      'rounded-2xl border bg-gray-900 p-5 flex flex-col gap-4',
      cfg.border
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
            cfg.gradient, cfg.glow
          )}>
            <cfg.Icon size={17} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{cfg.label}</p>
            <p className={cn('text-xs font-medium', cfg.text)}>Nivel {hab.nivel}</p>
          </div>
        </div>
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold',
          'bg-white/[0.04] border border-white/[0.06]',
          cfg.text
        )}>
          {hab.nivel}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-500">XP</span>
          <span className="text-[11px] text-gray-500">{hab.xp} / {umbral}</span>
        </div>
        <div className={cn('h-1.5 w-full rounded-full', cfg.track)}>
          <div
            className={cn('h-full rounded-full transition-all duration-700', cfg.fill)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={cn('text-[11px] mt-1 text-right', cfg.text)}>{pct}%</p>
      </div>
    </div>
  )
}

function HabilidadSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-5 animate-shimmer h-[148px]" />
  )
}

const ORDER: HabilidadCategoria[] = ['finanzas', 'fitness', 'aprendizaje']

interface HabilidadesGridProps {
  habilidades: HabilidadStat[]
  loading: boolean
}

export function HabilidadesGrid({ habilidades, loading }: HabilidadesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => <HabilidadSkeleton key={i} />)}
      </div>
    )
  }

  const sorted = ORDER
    .map((cat) => habilidades.find((h) => h.categoria === cat))
    .filter(Boolean) as HabilidadStat[]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {sorted.map((hab) => <HabilidadCard key={hab.id} hab={hab} />)}
    </div>
  )
}
