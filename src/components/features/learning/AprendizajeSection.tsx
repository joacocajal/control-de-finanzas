'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Plus, Youtube, Clock, X, Loader2, ExternalLink,
  Sparkles, ChevronDown, ChevronUp, Timer,
  MessageCircle, Mic, PenLine, Handshake, Scale, Send,
  TrendingUp, Search, Camera, Star, Code2, Palette, Wallet,
  Calculator, LineChart, Brain, Users, LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLearning } from '@/hooks/useLearning'
import { xpPorcentaje, xpUmbral } from '@/hooks/useGamification'
import { getSuggestedSkills } from '@/services/suggested-skills.service'
import { getRecentSessions, getWeeklyHours } from '@/services/learning-sessions.service'
import type { AprendizajeLog, AprendizajeSkill, SuggestedSkill, LearningSession } from '@/types/database.types'
import { LearningSessionTimer } from '@/components/features/learning/LearningSessionTimer'
import { SkillResources } from '@/components/features/learning/SkillResources'
import { useSkillResources } from '@/hooks/useSkillResources'
import { SkillRoadmap } from '@/components/features/learning/SkillRoadmap'
import { useSkillMilestones } from '@/hooks/useSkillMilestones'

// ─── Icon map ─────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  MessageCircle, Mic, PenLine, BookOpen, Handshake, Scale, Send,
  TrendingUp, Search, Camera, Star, Code2, Sparkles, Palette,
  Wallet, Calculator, LineChart, Clock, Brain, Users,
}

function SkillIcon({ name, size = 14, color }: { name: string | null; size?: number; color?: string }) {
  const Icon = name ? (ICON_MAP[name] ?? BookOpen) : BookOpen
  return <Icon size={size} style={color ? { color } : undefined} />
}

const DIFFICULTY_COLORS: Record<string, string> = {
  principiante: '#34d399',
  intermedio: '#fbbf24',
  avanzado: '#f87171',
}

const CATEGORY_COLORS: Record<string, string> = {
  Comunicación: '#8b5cf6',
  Ventas: '#34d399',
  Marketing: '#f97316',
  Tecnología: '#38bdf8',
  Finanzas: '#fbbf24',
  Personal: '#f87171',
}

// ─── Weekly bar chart ─────────────────────────────────────────

function WeeklyChart({ data }: { data: { week_start: string; hours: number }[] }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => d.hours), 1)

  return (
    <div>
      <div className="text-[10px] num uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-2)' }}>
        Horas por semana (últimas 12 semanas)
      </div>
      <div className="flex items-end gap-1 h-16">
        {data.slice(-12).map((d, i) => {
          const h = (d.hours / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(h, 4)}%`,
                  background: `rgba(249,115,22,${0.3 + 0.7 * (h / 100)})`,
                }}
              />
              <div
                className="absolute bottom-full mb-1 px-1.5 py-0.5 rounded text-[10px] num whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.8)', color: '#fff' }}
              >
                {d.hours}h
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Session row ──────────────────────────────────────────────

function SessionRow({ session }: { session: LearningSession }) {
  const date = session.started_at ? new Date(session.started_at).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short',
  }) : ''

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02]">
      <div className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
        style={{ background: session.was_completed ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)' }}>
        <Timer size={12} style={{ color: session.was_completed ? '#34d399' : '#fbbf24' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] truncate" style={{ color: 'var(--text-1)' }}>
          {session.what_studied ?? 'Sesión de estudio'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] num flex items-center gap-0.5" style={{ color: '#f97316' }}>
            <Clock size={9} />{session.duration_minutes}min
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-2)' }}>{date}</span>
          {session.was_completed && (
            <span className="text-[10px]" style={{ color: '#34d399' }}>✓ completado</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Catalog modal ────────────────────────────────────────────

function CatalogModal({ userSkills, onAdopt, onClose }: {
  userSkills: AprendizajeSkill[]
  onAdopt: (s: SuggestedSkill) => Promise<AprendizajeSkill>
  onClose: () => void
}) {
  const [catalog, setCatalog] = useState<SuggestedSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [diffFilter, setDiffFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adopting, setAdopting] = useState<string | null>(null)

  useEffect(() => {
    getSuggestedSkills()
      .then(setCatalog)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const adoptedIds = new Set(userSkills.map(s => s.suggested_skill_id).filter(Boolean))
  const categories = [...new Set(catalog.map(s => s.category))]
  const difficulties = ['principiante', 'intermedio', 'avanzado']

  const filtered = catalog.filter(s => {
    if (catFilter && s.category !== catFilter) return false
    if (diffFilter && s.difficulty !== diffFilter) return false
    return true
  })

  const handleAdopt = async (skill: SuggestedSkill) => {
    setAdopting(skill.id)
    try { await onAdopt(skill) } finally { setAdopting(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col"
        style={{ background: 'var(--bg-1, #0d1117)', border: '1px solid var(--line)', maxHeight: '88vh' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
              <Sparkles size={15} />
            </div>
            <div>
              <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Codex</div>
              <h2 className="text-[15px] font-bold display" style={{ color: 'var(--text-0)' }}>Catálogo de skills</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-3 space-y-2 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setCatFilter(null)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
              style={{
                background: !catFilter ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${!catFilter ? 'rgba(249,115,22,0.35)' : 'var(--line)'}`,
                color: !catFilter ? '#f97316' : 'var(--text-2)',
              }}>Todas</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
                style={{
                  background: catFilter === cat ? `${CATEGORY_COLORS[cat] ?? '#f97316'}18` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${catFilter === cat ? `${CATEGORY_COLORS[cat] ?? '#f97316'}40` : 'var(--line)'}`,
                  color: catFilter === cat ? (CATEGORY_COLORS[cat] ?? '#f97316') : 'var(--text-2)',
                }}>{cat}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {difficulties.map(d => (
              <button key={d} onClick={() => setDiffFilter(diffFilter === d ? null : d)}
                className="px-3 py-1 rounded-lg text-[11px] capitalize transition-colors"
                style={{
                  background: diffFilter === d ? `${DIFFICULTY_COLORS[d]}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${diffFilter === d ? `${DIFFICULTY_COLORS[d]}40` : 'var(--line)'}`,
                  color: diffFilter === d ? DIFFICULTY_COLORS[d] : 'var(--text-2)',
                }}>{d}</button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-2)' }} /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-[13px]" style={{ color: 'var(--text-2)' }}>Sin skills con esos filtros</p>
          ) : filtered.map(skill => {
            const adopted = adoptedIds.has(skill.id)
            const isExpanded = expanded === skill.id
            const catColor = CATEGORY_COLORS[skill.category] ?? '#f97316'
            const diffColor = DIFFICULTY_COLORS[skill.difficulty]
            return (
              <div key={skill.id} className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${catColor}12`, color: catColor }}>
                      <SkillIcon name={skill.icon} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>{skill.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${catColor}12`, color: catColor }}>{skill.category}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md capitalize" style={{ background: `${diffColor}12`, color: diffColor }}>{skill.difficulty}</span>
                            {skill.estimated_hours && (
                              <span className="text-[10px] num flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                                <Clock size={9} />{skill.estimated_hours}h
                              </span>
                            )}
                          </div>
                        </div>
                        {adopted ? (
                          <span className="shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg font-medium"
                            style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                            ✓ En tu lista
                          </span>
                        ) : (
                          <button onClick={() => void handleAdopt(skill)} disabled={adopting === skill.id}
                            className="shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}>
                            {adopting === skill.id ? <Loader2 size={11} className="animate-spin" /> : '+ Agregar'}
                          </button>
                        )}
                      </div>
                      <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{skill.description}</p>
                      {skill.why_it_matters && (
                        <button onClick={() => setExpanded(isExpanded ? null : skill.id)}
                          className="flex items-center gap-1 mt-2 text-[11px] font-medium transition-colors"
                          style={{ color: catColor }}>
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          {isExpanded ? 'Ocultar' : '¿Por qué desarrollarla?'}
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && skill.why_it_matters && (
                    <div className="mt-3 ml-12 px-3 py-2.5 rounded-xl text-[12px] leading-relaxed"
                      style={{ background: `${catColor}08`, border: `1px solid ${catColor}18`, color: 'var(--text-1)' }}>
                      {skill.why_it_matters}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Skill chip ───────────────────────────────────────────────

function SkillChip({ skill, active, onClick, onDelete }: {
  skill: AprendizajeSkill; active: boolean; onClick: () => void; onDelete: () => void
}) {
  return (
    <div className={cn(
      'shrink-0 group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer',
      active
        ? 'text-orange-300 border-orange-500/30 bg-orange-500/10'
        : 'text-gray-500 border-white/[0.06] hover:text-gray-300 hover:border-white/[0.12]',
    )} onClick={onClick}>
      <BookOpen size={11} />
      <span>{skill.nombre_habilidad}</span>
      <span className={cn('text-[10px]', active ? 'text-orange-500' : 'text-gray-700')}>
        Lvl {skill.nivel_skill}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: active ? '#f97316' : '#6b7280' }}>
        <X size={10} />
      </button>
    </div>
  )
}

// ─── Video row ────────────────────────────────────────────────

function VideoRow({ log }: { log: AprendizajeLog }) {
  const hostname = log.youtube_url
    ? (() => { try { return new URL(log.youtube_url).hostname.replace('www.', '') } catch { return log.youtube_url } })()
    : null

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02]">
      <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center bg-rose-500/10 border border-rose-500/15 mt-0.5">
        <Youtube size={12} className="text-rose-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 truncate">{log.notas ?? hostname ?? 'Video'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-orange-400 flex items-center gap-1">
            <Clock size={9} />{log.horas_estudio}h
          </span>
          <span className="text-[10px] text-gray-600">{log.fecha}</span>
        </div>
      </div>
      {log.youtube_url && (
        <a href={log.youtube_url} target="_blank" rel="noopener noreferrer"
          className="text-gray-700 hover:text-orange-400 transition-colors mt-1">
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  )
}

// ─── Session form (manual log) ────────────────────────────────

function SesionForm({ skillId, onSubmit, onCancel }: {
  skillId: string
  onSubmit: (input: { skill_id: string; horas_estudio: number; youtube_url?: string; notas?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [horas, setHoras] = useState('1')
  const [url, setUrl] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const h = parseFloat(horas)
    if (!h || h <= 0) return
    setSaving(true)
    try {
      await onSubmit({ skill_id: skillId, horas_estudio: h, youtube_url: url.trim() || undefined, notas: notas.trim() || undefined })
      setHoras('1'); setUrl(''); setNotas('')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-xl border border-white/[0.06] bg-gray-800 p-4 space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Horas</label>
          <input type="number" value={horas} onChange={e => setHoras(e.target.value)}
            min={0.25} step={0.25} required autoFocus
            className="w-full rounded-lg border border-white/[0.06] bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40" />
        </div>
        <div className="flex-[3]">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">YouTube URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/..."
            className="w-full rounded-lg border border-white/[0.06] bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40" />
        </div>
      </div>
      <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas o tema estudiado..."
        className="w-full rounded-lg border border-white/[0.06] bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40" />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">Cancelar</button>
        <button type="submit" disabled={saving || !horas}
          className="flex-1 py-2 text-xs font-medium rounded-lg bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition-colors">
          {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Registrar sesión'}
        </button>
      </div>
    </form>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────

type SkillTab = 'historial' | 'sesiones' | 'recursos' | 'roadmap'

// ─── Main component ───────────────────────────────────────────

export function AprendizajeSection({ onMutation }: { onMutation?: () => void }) {
  const {
    skills, skillActiva, historial, totalHoras, loading, error,
    setSkillActiva, addEstudio, crearSkill, eliminarSkill, adoptarSkill,
  } = useLearning(onMutation)

  const [showSesion, setShowSesion] = useState(false)
  const [showNuevaSkill, setShowNuevaSkill] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [nombreSkill, setNombreSkill] = useState('')
  const [savingSkill, setSavingSkill] = useState(false)
  const [activeTab, setActiveTab] = useState<SkillTab>('historial')
  const [toast, setToast] = useState<string | null>(null)
  const [recentSessions, setRecentSessions] = useState<LearningSession[]>([])
  const [weeklyHours, setWeeklyHours] = useState<{ week_start: string; hours: number }[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [timerResourceId, setTimerResourceId] = useState<string | null>(null)

  const {
    resources,
    loading: loadingResources,
    load: loadResources,
    create: createResource,
    update: updateResource,
    markConsumed: markResourceConsumed,
    remove: removeResource,
  } = useSkillResources()

  const {
    milestones,
    loading: loadingMilestones,
    suggesting,
    suggestions,
    load: loadMilestones,
    create: createMilestone,
    adoptSuggestions,
    toggle: toggleMilestone,
    remove: removeMilestone,
    suggestWithAI,
    clearSuggestions,
  } = useSkillMilestones()

  const loadSessionStats = useCallback(async (skillId: string) => {
    setLoadingStats(true)
    try {
      const [sessions, weekly] = await Promise.all([
        getRecentSessions(skillId),
        getWeeklyHours(skillId),
      ])
      setRecentSessions(sessions)
      setWeeklyHours(weekly)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    if (!skillActiva) return
    if (activeTab === 'sesiones') void loadSessionStats(skillActiva.id)
    if (activeTab === 'recursos') void loadResources(skillActiva.id)
    if (activeTab === 'roadmap') void loadMilestones(skillActiva.id)
  }, [skillActiva?.id, activeTab, loadSessionStats, loadResources, loadMilestones]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCrearSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreSkill.trim()) return
    setSavingSkill(true)
    try {
      await crearSkill({ nombre_habilidad: nombreSkill.trim() })
      setNombreSkill('')
      setShowNuevaSkill(false)
    } finally { setSavingSkill(false) }
  }

  const handleDelete = async (skill: AprendizajeSkill) => {
    if (!confirm(`¿Eliminar "${skill.nombre_habilidad}"? Se borrará el historial de esta skill.`)) return
    await eliminarSkill(skill.id)
  }

  const handleSessionFinished = useCallback(async (durationMinutes: number, wasCompleted: boolean) => {
    setShowTimer(false)
    const xpGained = Math.round(durationMinutes * (wasCompleted ? 1.5 : 1))
    const msg = `🔥 +${xpGained} XP · ${durationMinutes}min en ${skillActiva?.nombre_habilidad ?? 'skill'}`
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
    if (skillActiva) await loadSessionStats(skillActiva.id)
    onMutation?.()
  }, [skillActiva, loadSessionStats, onMutation])

  const pct = skillActiva ? xpPorcentaje(skillActiva.xp_skill, skillActiva.nivel_skill) : 0
  const umbral = skillActiva ? xpUmbral(skillActiva.nivel_skill) : 100

  const TABS: { key: SkillTab; label: string }[] = [
    { key: 'historial', label: 'Historial' },
    { key: 'sesiones', label: 'Sesiones' },
    { key: 'recursos', label: 'Recursos' },
    { key: 'roadmap', label: 'Roadmap' },
  ]

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
            <BookOpen size={15} className="text-orange-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Codex</p>
            <p className="text-sm font-semibold text-white leading-none">Aprendizaje</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCatalog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.08)' }}>
            <Sparkles size={11} />Catálogo
          </button>
          <button onClick={() => setShowNuevaSkill(!showNuevaSkill)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/20 transition-colors">
            <Plus size={12} />Skill
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {/* Nueva skill form */}
      {showNuevaSkill && (
        <form onSubmit={(e) => void handleCrearSkill(e)} className="flex gap-2">
          <input type="text" value={nombreSkill} onChange={e => setNombreSkill(e.target.value)}
            placeholder="Nombre de la habilidad..." autoFocus
            className="flex-1 rounded-lg border border-white/[0.06] bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40" />
          <button type="submit" disabled={!nombreSkill.trim() || savingSkill}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition-colors">
            {savingSkill ? <Loader2 size={14} className="animate-spin" /> : 'Crear'}
          </button>
          <button type="button" onClick={() => setShowNuevaSkill(false)} className="text-gray-600 hover:text-gray-400 px-1">
            <X size={16} />
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map(i => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-shimmer" />)}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen size={28} className="mx-auto mb-2 opacity-30 text-gray-600" />
          <p className="text-sm text-gray-600">Sin habilidades creadas</p>
          <p className="text-xs mt-1 text-gray-700">Crea tu primer path de aprendizaje</p>
          <button onClick={() => setShowCatalog(true)}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-[13px] font-semibold border transition-colors"
            style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.08)' }}>
            <Sparkles size={14} />
            Explorar skills sugeridas
          </button>
        </div>
      ) : (
        <>
          {/* Skill selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {skills.map(s => (
              <SkillChip key={s.id} skill={s} active={skillActiva?.id === s.id}
                onClick={() => { setSkillActiva(s); setActiveTab('historial') }}
                onDelete={() => void handleDelete(s)} />
            ))}
          </div>

          {/* Skill activa detail */}
          {skillActiva && (
            <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.03] p-4 space-y-4">
              {/* XP bar + total hours */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-white">{skillActiva.nombre_habilidad}</p>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Nivel {skillActiva.nivel_skill} · {skillActiva.xp_skill}/{umbral} XP
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-orange-500/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700"
                    style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-600">{totalHoras.toFixed(1)}h registradas</span>
                  <span className="text-[10px] text-gray-600">{pct}% al siguiente nivel</span>
                </div>
              </div>

              {/* Iniciar sesión cronometrada */}
              <button
                onClick={() => setShowTimer(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))',
                  border: '1px solid rgba(249,115,22,0.3)',
                  color: '#f97316',
                }}
              >
                <Timer size={14} />
                Iniciar sesión de estudio
              </button>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      background: activeTab === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: activeTab === tab.key ? 'var(--text-0)' : 'var(--text-2)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: Historial de logs manuales */}
              {activeTab === 'historial' && (
                <>
                  {showSesion ? (
                    <SesionForm skillId={skillActiva.id}
                      onSubmit={async (input) => { await addEstudio(input); setShowSesion(false) }}
                      onCancel={() => setShowSesion(false)} />
                  ) : (
                    <button onClick={() => setShowSesion(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-orange-500/20 text-xs font-medium text-orange-400 hover:bg-orange-500/10 transition-colors">
                      <Plus size={12} />Registrar horas manualmente
                    </button>
                  )}
                  {historial.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                        <Youtube size={10} className="text-rose-400" />Historial de videos
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {historial.map(log => <VideoRow key={log.id} log={log} />)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tab: Recursos */}
              {activeTab === 'recursos' && (
                <SkillResources
                  skillId={skillActiva.id}
                  resources={resources}
                  loading={loadingResources}
                  onAdd={createResource}
                  onUpdate={updateResource}
                  onMarkConsumed={markResourceConsumed}
                  onDelete={(id) => void removeResource(id)}
                  onStartSessionWithResource={(resourceId) => {
                    setTimerResourceId(resourceId)
                    setShowTimer(true)
                  }}
                />
              )}

              {/* Tab: Roadmap */}
              {activeTab === 'roadmap' && (
                <SkillRoadmap
                  skill={skillActiva}
                  milestones={milestones}
                  loading={loadingMilestones}
                  suggesting={suggesting}
                  suggestions={suggestions}
                  onCreate={async (title, description) => {
                    await createMilestone({
                      skill_id: skillActiva.id,
                      title,
                      description: description || null,
                      order_index: milestones.length,
                      created_by: 'user',
                    })
                  }}
                  onToggle={toggleMilestone}
                  onDelete={removeMilestone}
                  onSuggestAI={async () => {
                    const supabase = (await import('@/lib/supabase/client')).createClient()
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return
                    await suggestWithAI({
                      skill_name: skillActiva.nombre_habilidad,
                      skill_description: null,
                      skill_category: null,
                      existing_milestones: milestones.map((m) => m.title),
                      user_level: `nivel ${skillActiva.nivel_skill}`,
                      user_id: user.id,
                    })
                  }}
                  onAdoptSuggestions={(selected) => adoptSuggestions(skillActiva.id, selected)}
                  onClearSuggestions={clearSuggestions}
                />
              )}

              {/* Tab: Sesiones cronometradas */}
              {activeTab === 'sesiones' && (
                <div className="space-y-4">
                  {loadingStats ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-2)' }} />
                    </div>
                  ) : (
                    <>
                      {/* Total hours from sessions */}
                      <div className="text-center py-2">
                        <div className="text-[32px] font-bold num" style={{ color: '#f97316' }}>
                          {recentSessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) >= 60
                            ? `${(recentSessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / 60).toFixed(1)}h`
                            : `${recentSessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)}min`}
                        </div>
                        <div className="text-[11px] num uppercase tracking-[0.15em] mt-1" style={{ color: 'var(--text-2)' }}>
                          en sesiones cronometradas
                        </div>
                      </div>

                      <WeeklyChart data={weeklyHours} />

                      {recentSessions.length === 0 ? (
                        <div className="text-center py-4">
                          <Timer size={24} className="mx-auto mb-2" style={{ color: 'var(--text-2)' }} />
                          <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                            Sin sesiones cronometradas aún
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                            <Timer size={10} className="text-orange-400" />Últimas sesiones
                          </p>
                          {recentSessions.map((s) => <SessionRow key={s.id} session={s} />)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Catalog modal */}
      {showCatalog && (
        <CatalogModal userSkills={skills} onAdopt={adoptarSkill} onClose={() => setShowCatalog(false)} />
      )}

      {/* Timer modal */}
      {showTimer && skillActiva && (
        <LearningSessionTimer
          skill={skillActiva}
          resources={resources}
          preselectedResourceId={timerResourceId}
          onClose={() => { setShowTimer(false); setTimerResourceId(null) }}
          onFinished={(mins, completed) => void handleSessionFinished(mins, completed)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-[13px] font-medium z-[60] transition-all"
          style={{
            background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.4)',
            color: '#fb923c',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
