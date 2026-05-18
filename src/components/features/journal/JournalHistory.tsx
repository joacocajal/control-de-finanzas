'use client'

import { useState, useMemo } from 'react'
import { Calendar } from 'lucide-react'
import type { JournalEntry } from '@/types/database.types'

const MOOD_EMOJI: Record<number, string> = {
  1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😄',
}
const MOOD_COLOR: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#fbbf24', 4: '#34d399', 5: '#818cf8',
}
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface JournalHistoryProps {
  entries: JournalEntry[]
  onSelectEntry: (date: string) => void
}

export function JournalHistory({ entries, onSelectEntry }: JournalHistoryProps) {
  const [moodFilter, setMoodFilter] = useState<number | null>(null)
  const [monthFilter, setMonthFilter] = useState<number | null>(null)

  const months = useMemo(() => {
    const set = new Set<number>()
    for (const e of entries) {
      const m = Number(e.entry_date.split('-')[1])
      set.add(m)
    }
    return Array.from(set).sort((a, b) => a - b)
  }, [entries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const m = Number(e.entry_date.split('-')[1])
      if (moodFilter && e.mood !== moodFilter) return false
      if (monthFilter && m !== monthFilter) return false
      return true
    })
  }, [entries, moodFilter, monthFilter])

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`
  }

  function preview(entry: JournalEntry) {
    return (
      entry.what_i_did ||
      entry.what_i_achieved ||
      entry.how_i_felt ||
      entry.free_notes ||
      ''
    ).slice(0, 80)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] num uppercase tracking-[0.15em]" style={{ color: 'var(--text-2)' }}>
          Filtrar:
        </div>

        {/* Mood filter */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((m) => (
            <button
              key={m}
              onClick={() => setMoodFilter(moodFilter === m ? null : m)}
              className="text-[15px] px-1.5 py-1 rounded-lg transition-all"
              style={{
                background: moodFilter === m ? `${MOOD_COLOR[m]}22` : 'transparent',
                border: moodFilter === m ? `1px solid ${MOOD_COLOR[m]}66` : '1px solid transparent',
              }}
              title={`Mood ${m}`}
            >
              {MOOD_EMOJI[m]}
            </button>
          ))}
        </div>

        {/* Month filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setMonthFilter(monthFilter === m ? null : m)}
              className="text-[11px] num px-2 py-1 rounded-lg transition-all"
              style={{
                color: monthFilter === m ? 'var(--text-0)' : 'var(--text-2)',
                background: monthFilter === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: '1px solid var(--line)',
              }}
            >
              {MONTHS[m - 1].slice(0, 3)}
            </button>
          ))}
        </div>

        {(moodFilter || monthFilter) && (
          <button
            onClick={() => { setMoodFilter(null); setMonthFilter(null) }}
            className="text-[11px] num px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div
          className="glass rounded-2xl p-8 text-center"
          style={{ border: '1px solid var(--line)' }}
        >
          <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--text-2)' }} />
          <div className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            No hay entradas para estos filtros
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const p = preview(entry)
            return (
              <button
                key={entry.id}
                onClick={() => onSelectEntry(entry.entry_date)}
                className="w-full text-left glass rounded-xl px-4 py-3 transition-all hover:bg-white/[0.04]"
                style={{ border: '1px solid var(--line)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {entry.mood && (
                      <span
                        className="text-[14px] w-6 h-6 flex items-center justify-center rounded-lg"
                        style={{ background: `${MOOD_COLOR[entry.mood]}20` }}
                      >
                        {MOOD_EMOJI[entry.mood]}
                      </span>
                    )}
                    <span className="text-[12px] font-medium num" style={{ color: 'var(--text-0)' }}>
                      {formatDate(entry.entry_date)}
                    </span>
                  </div>
                  <div className="text-[10px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>
                    Ver →
                  </div>
                </div>
                {p && (
                  <div className="text-[12px] truncate" style={{ color: 'var(--text-2)' }}>
                    {p}{p.length >= 80 ? '...' : ''}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
