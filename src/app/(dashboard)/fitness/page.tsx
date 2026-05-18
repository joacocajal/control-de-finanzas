'use client'

import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { FitnessResumen } from '@/components/features/fitness/FitnessResumen'
import { FitnessAlimentacion } from '@/components/features/fitness/FitnessAlimentacion'
import { FitnessRecetas } from '@/components/features/fitness/FitnessRecetas'
import { FitnessRutinas } from '@/components/features/fitness/FitnessRutinas'
import { FitnessPRsYObjetivos } from '@/components/features/fitness/FitnessPRsYObjetivos'
import { FitnessHidratacion } from '@/components/features/fitness/FitnessHidratacion'

type Tab = 'resumen' | 'alimentacion' | 'recetas' | 'rutinas' | 'prs' | 'hidratacion'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'resumen',      label: 'Resumen' },
  { id: 'alimentacion', label: 'Alimentación' },
  { id: 'recetas',      label: 'Recetas' },
  { id: 'rutinas',      label: 'Rutinas' },
  { id: 'prs',          label: 'PRs & Objetivos' },
  { id: 'hidratacion',  label: 'Hidratación' },
]

export default function FitnessPage() {
  const [tab, setTab] = useState<Tab>('resumen')

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
          <Dumbbell size={18} />
        </div>
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>The Forge</div>
          <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Fitness</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-0.5 -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={{
              background: tab === t.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === t.id ? 'rgba(139,92,246,0.35)' : 'var(--line)'}`,
              color: tab === t.id ? '#8b5cf6' : 'var(--text-2)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'resumen'      && <FitnessResumen />}
      {tab === 'alimentacion' && <FitnessAlimentacion />}
      {tab === 'recetas'      && <FitnessRecetas />}
      {tab === 'rutinas'      && <FitnessRutinas />}
      {tab === 'prs'          && <FitnessPRsYObjetivos />}
      {tab === 'hidratacion'  && <FitnessHidratacion />}
    </>
  )
}
