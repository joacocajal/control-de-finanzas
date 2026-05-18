'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, Check, Dumbbell, Calendar, BarChart2 } from 'lucide-react'
import { useRoutineTemplates, useTemplateDetail } from '@/hooks/useRoutineTemplates'
import type { RoutineTemplate, RoutineTemplateWithDays, TemplateLevel } from '@/types/database.types'

// ─── Helpers ──────────────────────────────────────────────────

const LEVEL_STYLE: Record<TemplateLevel, { color: string; label: string }> = {
  principiante: { color: '#34d399', label: 'Principiante' },
  intermedio:   { color: '#fbbf24', label: 'Intermedio'   },
  avanzado:     { color: '#ef4444', label: 'Avanzado'     },
}

// ─── Template card ────────────────────────────────────────────

function TemplateCard({ template, onSelect }: {
  template: RoutineTemplate
  onSelect: () => void
}) {
  const lvl = LEVEL_STYLE[template.level]

  return (
    <button
      onClick={onSelect}
      className="glass w-full p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{ borderRadius: 16, border: '1px solid var(--line)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <Dumbbell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold" style={{ color: 'var(--text-0)' }}>
              {template.name}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] font-semibold" style={{ color: lvl.color }}>
                {lvl.label}
              </span>
              {template.days_per_week && (
                <span className="flex items-center gap-1 text-[11px] num" style={{ color: 'var(--text-2)' }}>
                  <Calendar size={10} />
                  {template.days_per_week} días/sem
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-2)', flexShrink: 0, marginTop: 2 }} />
      </div>
      {template.description && (
        <p className="text-[12px] mt-3 leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {template.description}
        </p>
      )}
    </button>
  )
}

// ─── Template preview ─────────────────────────────────────────

function TemplatePreview({ template, onAdopt, onBack, adopting }: {
  template: RoutineTemplateWithDays
  onAdopt: () => void
  onBack: () => void
  adopting: boolean
}) {
  const lvl = LEVEL_STYLE[template.level]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-0)' }}>
            {template.name}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] font-semibold" style={{ color: lvl.color }}>{lvl.label}</span>
            {template.days_per_week && (
              <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                {template.days_per_week} días/sem
              </span>
            )}
            <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
              {template.days.length} rutinas
            </span>
          </div>
        </div>
        <button
          onClick={onAdopt}
          disabled={adopting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold shrink-0"
          style={{ background: '#8b5cf6', color: '#fff', opacity: adopting ? 0.7 : 1 }}>
          {adopting ? 'Adoptando...' : 'Adoptar'}
        </button>
      </div>

      {/* Days */}
      {template.days.map(day => (
        <div key={day.day_label} className="glass p-4 space-y-3" style={{ borderRadius: 16 }}>
          <div className="flex items-center gap-2">
            <BarChart2 size={13} style={{ color: '#8b5cf6' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>
              {day.day_label}
            </span>
            <span className="text-[11px] num ml-auto" style={{ color: 'var(--text-2)' }}>
              {day.exercises.length} ejercicios
            </span>
          </div>
          <div className="space-y-2">
            {day.exercises.map(ex => (
              <div key={ex.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--text-2)' }} />
                  <span className="text-[13px]" style={{ color: 'var(--text-1)' }}>
                    {ex.exercise_name}
                  </span>
                  {ex.notes && (
                    <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>— {ex.notes}</span>
                  )}
                </div>
                {(ex.target_sets || ex.target_reps) && (
                  <span className="text-[12px] num font-medium shrink-0 ml-3"
                    style={{ color: '#8b5cf6' }}>
                    {ex.target_sets && `${ex.target_sets}×`}{ex.target_reps}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Adopt CTA */}
      <button
        onClick={onAdopt}
        disabled={adopting}
        className="w-full py-3 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2"
        style={{ background: '#8b5cf6', color: '#fff', opacity: adopting ? 0.7 : 1 }}>
        {adopting ? (
          'Creando rutinas...'
        ) : (
          <>
            <Check size={15} />
            Adoptar esta rutina
          </>
        )}
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────

export function FitnessTemplates({ onBack, onAdopted }: {
  onBack: () => void
  onAdopted: (count: number) => void
}) {
  const { templates, loading, load } = useRoutineTemplates()
  const { template, loading: detailLoading, adopting, loadDetail, adopt } = useTemplateDetail()
  const [view, setView] = useState<'list' | 'preview'>('list')

  useEffect(() => {
    void load()
  }, [load])

  const handleSelect = async (t: RoutineTemplate) => {
    await loadDetail(t.id)
    setView('preview')
  }

  const handleAdopt = async () => {
    if (!template) return
    const created = await adopt(template.id)
    onAdopted(created.length)
  }

  if (view === 'preview' && template) {
    return (
      <TemplatePreview
        template={template}
        adopting={adopting}
        onBack={() => setView('list')}
        onAdopt={() => void handleAdopt()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
            Explorar
          </div>
          <h2 className="text-[16px] font-bold display" style={{ color: 'var(--text-0)' }}>
            Plantillas de rutinas
          </h2>
        </div>
      </div>

      {/* List */}
      {loading || detailLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onSelect={() => void handleSelect(t)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
