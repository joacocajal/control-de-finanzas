'use client'

import { useGamification } from '@/hooks/useGamification'
import { useQuests } from '@/hooks/useQuests'
import { AprendizajeSection } from '@/components/features/learning/AprendizajeSection'
import { MisionesWidget } from '@/components/features/gamification/MisionesWidget'
import { HabilidadesGrid } from '@/components/features/gamification/HabilidadesGrid'
import { BookOpen, Star, Zap } from 'lucide-react'

const MASTERED = [
  { name: 'SQL — Window functions', xp: 328, ago: '2 semanas', color: '#34d399' },
  { name: 'React Server Components', xp: 229, ago: '1 mes', color: '#38bdf8' },
  { name: 'Marathon — 4:10:28', xp: 180, ago: '2 meses', color: '#fbbf24' },
]

export default function AprendizajePage() {
  const { habilidades, loading: loadingGam, reload } = useGamification()
  const { misiones, loading: questLoading, completar, fallar, crear } = useQuests(reload)

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Codex</div>
            <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Learning Hub</h1>
          </div>
        </div>
      </div>

      {/* ── Habilidades (XP per category) ── */}
      <div className="mb-5">
        <div className="text-[10px] num uppercase tracking-[0.18em] mb-3 px-1" style={{ color: 'var(--text-2)' }}>
          Skill Stats
        </div>
        <HabilidadesGrid habilidades={habilidades} loading={loadingGam} />
      </div>

      {/* ── Skill paths (AprendizajeSection) ── */}
      <div className="mb-5">
        <div className="glass p-5" style={{ borderRadius: 18 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
              <Zap size={14} />
            </div>
            <div>
              <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Codex</div>
              <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Skill paths</h2>
            </div>
          </div>
          <AprendizajeSection onMutation={reload} />
        </div>
      </div>

      {/* ── Daily Quests ── */}
      <div className="mb-5">
        <div className="text-[10px] num uppercase tracking-[0.18em] mb-3 px-1" style={{ color: 'var(--text-2)' }}>
          Daily Quests
        </div>
        <MisionesWidget
          misiones={misiones}
          loading={questLoading}
          onCompletar={completar}
          onFallar={fallar}
          onCrear={crear}
        />
      </div>

      {/* ── Mastered skill tree ── */}
      <div>
        <div className="text-[10px] num uppercase tracking-[0.18em] mb-3 px-1" style={{ color: 'var(--text-2)' }}>
          Mastered
        </div>
        <div className="glass p-5" style={{ borderRadius: 18 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
              <Star size={14} />
            </div>
            <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Skill tree</h2>
          </div>
          <div className="space-y-2">
            {MASTERED.map(item => (
              <div key={item.name} className="quest-row flex items-center gap-3 px-3 py-3 rounded-xl">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}18`, color: item.color }}>
                  <Star size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>{item.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>Hace {item.ago}</p>
                </div>
                <span className="text-[12px] num font-bold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ background: `${item.color}14`, color: item.color, border: `1px solid ${item.color}26` }}>
                  +{item.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
