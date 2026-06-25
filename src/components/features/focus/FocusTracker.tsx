'use client'

import { useState } from 'react'
import { Target, Play, Square, X, Clock, Flame, History, TrendingUp, Hash } from 'lucide-react'
import { useFocus } from '@/hooks/useFocus'
import type { FocusSession } from '@/types/database.types'

const ACCENT = '#f43f5e'

// ─── Formato ──────────────────────────────────────────────────

function clock(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function dur(total: number): string {
  if (total < 60) return `${total}s`
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="glass p-3.5" style={{ borderRadius: 16 }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: color ?? 'var(--text-2)' }}>{icon}</span>
        <span className="text-[10px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>{label}</span>
      </div>
      <div className="text-[20px] font-bold num tabular-nums leading-none" style={{ color: 'var(--text-0)' }}>{value}</div>
    </div>
  )
}

function HistoryRow({ s }: { s: FocusSession }) {
  const d = new Date(s.started_at)
  const when = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${ACCENT}14`, color: ACCENT }}>
        <Target size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>
          {s.label || 'Sesión de focus'}
        </div>
        <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>{when}</div>
      </div>
      <div className="text-[14px] font-bold num tabular-nums shrink-0" style={{ color: ACCENT }}>
        {dur(s.duration_seconds ?? 0)}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────

export function FocusTracker() {
  const { active, elapsed, recent, stats, loading, start, stop, discard } = useFocus()
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)

  const begin = async () => {
    setBusy(true)
    try { await start(label || null); setLabel('') } finally { setBusy(false) }
  }
  const finish = async () => {
    setBusy(true)
    try { await stop() } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${ACCENT}16`, color: ACCENT }}>
          <Target size={18} />
        </div>
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Deep Work</div>
          <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Focus</h1>
        </div>
      </div>

      {/* Timer principal */}
      <div className="glass p-6 text-center relative overflow-hidden" style={{ borderRadius: 22 }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(420px 240px at 50% 0%, ${ACCENT}14, transparent 70%)` }} />

        {active ? (
          <div className="relative space-y-5">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full animate-recording-pulse" style={{ background: ACCENT }} />
              <span className="text-[12px] num uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                Concentrado
              </span>
            </div>
            <div className="text-[15px] font-medium" style={{ color: 'var(--text-1)' }}>
              {active.label || 'Sesión de focus'}
            </div>
            <div className="text-[56px] font-bold num tabular-nums leading-none tracking-tight" style={{ color: 'var(--text-0)' }}>
              {clock(elapsed)}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button onClick={() => void finish()} disabled={busy}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-semibold transition-opacity"
                style={{ background: ACCENT, color: '#fff', opacity: busy ? 0.7 : 1 }}>
                <Square size={15} /> Terminar
              </button>
              <button onClick={() => void discard()} disabled={busy}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-[13px] transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
                <X size={14} /> Descartar
              </button>
            </div>
          </div>
        ) : (
          <div className="relative space-y-4">
            <div className="text-[44px] font-bold num tabular-nums leading-none" style={{ color: 'var(--text-2)' }}>
              00:00
            </div>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="¿En qué te vas a enfocar?"
              className="w-full max-w-sm mx-auto block bg-transparent border rounded-xl px-4 py-3 text-[14px] text-center"
              style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none' }}
            />
            <button onClick={() => void begin()} disabled={busy}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold transition-opacity"
              style={{ background: ACCENT, color: '#fff', opacity: busy ? 0.7 : 1 }}>
              <Play size={16} /> Empezar focus
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard icon={<TrendingUp size={13} />} label="Promedio" value={stats.totalSessions ? dur(stats.avgSeconds) : '—'} color={ACCENT} />
        <StatCard icon={<Clock size={13} />} label="Hoy" value={dur(stats.todaySeconds)} />
        <StatCard icon={<Hash size={13} />} label="Sesiones" value={String(stats.totalSessions)} />
        <StatCard icon={<Flame size={13} />} label="Mejor" value={stats.bestSeconds ? dur(stats.bestSeconds) : '—'} color="#fbbf24" />
      </div>

      {/* Historial */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <History size={14} style={{ color: 'var(--text-2)' }} />
          <h2 className="text-[12px] font-medium num uppercase tracking-[0.14em]" style={{ color: 'var(--text-2)' }}>
            Historial
          </h2>
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl animate-shimmer" />)}</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-[13px]" style={{ color: 'var(--text-2)' }}>
            Todavía no registraste sesiones. Arrancá tu primer focus 🎯
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(s => <HistoryRow key={s.id} s={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}
