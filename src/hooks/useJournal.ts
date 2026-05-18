'use client'

import { useState, useCallback, useRef } from 'react'
import {
  getMonthEntries,
  getEntryByDate,
  upsertEntry,
  getDailySnapshot,
} from '@/services/journal.service'
import type { JournalEntry, UpsertJournalEntryInput, DailySnapshot } from '@/types/database.types'

export function useMonthJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (year: number, month: number) => {
    setLoading(true)
    try {
      const data = await getMonthEntries(year, month)
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }, [])

  return { entries, loading, load }
}

export function useJournalEditor() {
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingEntry, setLoadingEntry] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentDateRef = useRef<string>('')

  const loadDate = useCallback(async (date: string) => {
    setLoadingEntry(true)
    currentDateRef.current = date
    try {
      const [e, snap] = await Promise.all([getEntryByDate(date), getDailySnapshot(date)])
      setEntry(e)
      setSnapshot(snap)
    } finally {
      setLoadingEntry(false)
    }
  }, [])

  const save = useCallback((date: string, input: UpsertJournalEntryInput) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        const updated = await upsertEntry(date, input)
        if (currentDateRef.current === date) setEntry(updated)
      } finally {
        setSaving(false)
      }
    }, 1500)
  }, [])

  return { entry, snapshot, saving, loadingEntry, loadDate, save }
}
