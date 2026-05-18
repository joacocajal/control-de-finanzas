'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { JournalEntry } from '@/types/database.types'

const MOOD_COLOR: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#fbbf24',
  4: '#34d399',
  5: '#818cf8',
}

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface JournalCalendarProps {
  year: number
  month: number
  entries: JournalEntry[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onMonthChange: (year: number, month: number) => void
}

export function JournalCalendar({
  year,
  month,
  entries,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: JournalCalendarProps) {
  const moodByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      if (e.mood) map[e.entry_date] = e.mood
    }
    return map
  }, [entries])

  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12)
    else onMonthChange(year, month - 1)
  }

  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1)
    else onMonthChange(year, month + 1)
  }

  function toDateStr(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      className="glass rounded-2xl p-4"
      style={{ border: '1px solid var(--line)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.06]"
          style={{ color: 'var(--text-2)' }}
        >
          <ChevronLeft size={14} />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>
            {MONTHS[month - 1]}
          </div>
          <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>{year}</div>
        </div>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.06]"
          style={{ color: 'var(--text-2)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] num uppercase tracking-[0.15em]"
            style={{ color: 'var(--text-2)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = toDateStr(day)
          const mood = moodByDate[dateStr]
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateStr)}
              className="flex flex-col items-center justify-center py-1 rounded-xl transition-all"
              style={{
                background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: isToday ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
              }}
            >
              <span
                className="text-[12px] num font-medium leading-none"
                style={{ color: isSelected ? 'var(--text-0)' : 'var(--text-1)' }}
              >
                {day}
              </span>
              <span
                className="mt-0.5 w-3 h-1 rounded-full"
                style={{
                  background: mood ? MOOD_COLOR[mood] : 'transparent',
                  opacity: mood ? 0.85 : 0,
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Mood legend */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {Object.entries(MOOD_COLOR).map(([m, color]) => (
          <div key={m} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{m}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
