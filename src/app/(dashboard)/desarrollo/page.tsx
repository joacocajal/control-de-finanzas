'use client'

import { useGamification } from '@/hooks/useGamification'
import { useQuests } from '@/hooks/useQuests'
import { ProfileXPCard } from '@/components/features/gamification/ProfileXPCard'
import { HabilidadesGrid } from '@/components/features/gamification/HabilidadesGrid'
import { MisionesWidget } from '@/components/features/gamification/MisionesWidget'
import { GymSection } from '@/components/features/gym/GymSection'
import { NutricionSection } from '@/components/features/nutrition/NutricionSection'
import { AprendizajeSection } from '@/components/features/learning/AprendizajeSection'

export default function DesarrolloPage() {
  const { profile, habilidades, loading, error: errorGam, reload } = useGamification()

  // useQuests recibe reload como onMutation → la XP bar se mueve en tiempo real
  const {
    misiones,
    loading: loadingQ,
    error: errorQ,
    completar,
    fallar,
    crear,
  } = useQuests(reload)

  const anyError = errorGam ?? errorQ

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Desarrollo Personal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tu progreso en finanzas, fitness y aprendizaje</p>
      </div>

      {anyError && (
        <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-400">{anyError}</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        {/* Nivel global — se refresca vía reload() */}
        <ProfileXPCard profile={profile} loading={loading} />

        {/* Habilidades */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Habilidades</p>
          <HabilidadesGrid habilidades={habilidades} loading={loading} />
        </div>

        {/* Misiones — con completar + fallar */}
        <MisionesWidget
          misiones={misiones}
          loading={loadingQ}
          onCompletar={completar}
          onFallar={fallar}
          onCrear={crear}
        />

        {/* Gym */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Fitness</p>
          <GymSection onMutation={reload} />
        </div>

        {/* Nutrición */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Nutrición</p>
          <NutricionSection onMutation={reload} />
        </div>

        {/* Aprendizaje */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Aprendizaje</p>
          <AprendizajeSection onMutation={reload} />
        </div>
      </div>
    </>
  )
}
