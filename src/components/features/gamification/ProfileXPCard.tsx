'use client'

import { Zap, Flame } from 'lucide-react'
import { xpPorcentaje, xpUmbral } from '@/hooks/useGamification'
import type { ProfileGamificado } from '@/types/database.types'

interface ProfileXPCardProps {
  profile: ProfileGamificado | null
  loading: boolean
}

export function ProfileXPCard({ profile, loading }: ProfileXPCardProps) {
  if (loading || !profile) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-5 sm:p-6 animate-shimmer h-[120px]" />
    )
  }

  const nivel = profile.nivel_global ?? 1
  const xp = profile.xp_global ?? 0
  const umbral = xpUmbral(nivel)
  const pct = xpPorcentaje(xp, nivel)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-5 sm:p-6">
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Level badge */}
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25">
            <span className="text-2xl font-black text-white tracking-tight">{nivel}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 border-2 border-gray-900">
            <Zap size={9} className="text-white" />
          </div>
        </div>

        {/* XP info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-base font-bold text-white">Nivel {nivel}</p>
              <p className="text-xs text-gray-500">Desarrollo Personal</p>
            </div>
            {(profile.racha_dias ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Flame size={13} className="text-orange-400" />
                <span className="text-xs font-semibold text-orange-400">{profile.racha_dias}d</span>
              </div>
            )}
          </div>

          <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-gray-600">{xp} XP</span>
            <span className="text-[11px] text-gray-600">{umbral} XP para nivel {nivel + 1}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
