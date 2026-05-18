'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookHeart, List, ArrowLeft } from 'lucide-react'
import { JournalCalendar } from '@/components/features/journal/JournalCalendar'
import { JournalEditor } from '@/components/features/journal/JournalEditor'
import { JournalHistory } from '@/components/features/journal/JournalHistory'
import { useMonthJournal, useJournalEditor } from '@/hooks/useJournal'

type View = 'main' | 'history'

export default function DiarioPage() {
  const today = new Date().toISOString().slice(0, 10)
  const nowYear = new Date().getFullYear()
  const nowMonth = new Date().getMonth() + 1

  const [view, setView] = useState<View>('main')
  const [calYear, setCalYear] = useState(nowYear)
  const [calMonth, setCalMonth] = useState(nowMonth)
  const [selectedDate, setSelectedDate] = useState(today)

  const { entries, loading: loadingMonth, load: loadMonth } = useMonthJournal()
  const { entry, snapshot, saving, loadingEntry, loadDate, save } = useJournalEditor()

  const handleMonthChange = useCallback((year: number, month: number) => {
    setCalYear(year)
    setCalMonth(month)
    loadMonth(year, month)
  }, [loadMonth])

  useEffect(() => {
    loadMonth(calYear, calMonth)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadDate(selectedDate)
  }, [selectedDate, loadDate])

  function handleSelectDate(date: string) {
    const [y, m] = date.split('-').map(Number)
    if (y !== calYear || m !== calMonth) {
      handleMonthChange(y, m)
    }
    setSelectedDate(date)
    setView('main')
  }

  const accent = '#818cf8'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === 'history' && (
            <button
              onClick={() => setView('main')}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}22`, color: accent }}
          >
            <BookHeart size={20} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold display" style={{ color: 'var(--text-0)' }}>
              {view === 'history' ? 'Historial' : 'Diario Personal'}
            </h1>
            <div className="text-[12px] num" style={{ color: 'var(--text-2)' }}>
              {view === 'history' ? 'Todas tus entradas' : 'Reflexión diaria'}
            </div>
          </div>
        </div>

        {view === 'main' && (
          <button
            onClick={() => { setView('history'); loadMonth(calYear, calMonth) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-all hover:bg-white/[0.06]"
            style={{
              color: 'var(--text-1)',
              border: '1px solid var(--line)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <List size={14} />
            Historial
          </button>
        )}
      </div>

      {view === 'main' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Left: calendar */}
          <div className="space-y-4">
            {loadingMonth ? (
              <div
                className="glass rounded-2xl h-64 animate-pulse"
                style={{ border: '1px solid var(--line)' }}
              />
            ) : (
              <JournalCalendar
                year={calYear}
                month={calMonth}
                entries={entries}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onMonthChange={handleMonthChange}
              />
            )}

            {/* Quick stats */}
            <div
              className="glass rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ border: '1px solid var(--line)' }}
            >
              <div className="text-center">
                <div className="text-[18px] font-bold num" style={{ color: 'var(--text-0)' }}>
                  {entries.length}
                </div>
                <div className="text-[10px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>
                  Entradas
                </div>
              </div>
              <div className="text-center">
                <div className="text-[18px] font-bold num" style={{ color: 'var(--text-0)' }}>
                  {entries.filter((e) => e.mood !== null).length}
                </div>
                <div className="text-[10px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>
                  Con mood
                </div>
              </div>
              <div className="text-center">
                <div className="text-[18px] font-bold num" style={{ color: accent }}>
                  {entries.length > 0
                    ? (entries.reduce((s, e) => s + (e.mood ?? 0), 0) / entries.filter((e) => e.mood).length || 0).toFixed(1)
                    : '—'}
                </div>
                <div className="text-[10px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>
                  Mood prom
                </div>
              </div>
            </div>
          </div>

          {/* Right: editor */}
          <div>
            {loadingEntry ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass rounded-xl h-16 animate-pulse"
                    style={{ border: '1px solid var(--line)' }}
                  />
                ))}
              </div>
            ) : (
              <JournalEditor
                date={selectedDate}
                entry={entry}
                snapshot={snapshot}
                saving={saving}
                onSave={save}
              />
            )}
          </div>
        </div>
      )}

      {view === 'history' && (
        <JournalHistory
          entries={entries}
          onSelectEntry={handleSelectDate}
        />
      )}
    </div>
  )
}
