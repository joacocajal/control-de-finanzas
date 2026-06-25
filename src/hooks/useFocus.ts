'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getActiveFocus, startFocus, endFocus, discardFocus, getRecentFocus, getFocusStats,
} from '@/services/focus.service'
import type { FocusSession, FocusStats } from '@/types/database.types'

const EMPTY_STATS: FocusStats = { totalSessions: 0, totalSeconds: 0, avgSeconds: 0, todaySeconds: 0, bestSeconds: 0 }

export function useFocus() {
  const [active, setActive] = useState<FocusSession | null>(null)
  const [elapsed, setElapsed] = useState(0) // segundos
  const [recent, setRecent] = useState<FocusSession[]>([])
  const [stats, setStats] = useState<FocusStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  const reloadHistory = useCallback(async () => {
    const [r, s] = await Promise.all([getRecentFocus(20), getFocusStats()])
    setRecent(r)
    setStats(s)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const a = await getActiveFocus()
      setActive(a)
      if (a) setElapsed(Math.floor((Date.now() - new Date(a.started_at).getTime()) / 1000))
      await reloadHistory()
    } finally {
      setLoading(false)
    }
  }, [reloadHistory])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void load()
  }, [load])

  // Tick mientras hay sesión activa
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [active])

  const start = useCallback(async (label: string | null) => {
    const s = await startFocus(label)
    setActive(s)
    setElapsed(0)
  }, [])

  const stop = useCallback(async () => {
    if (!active) return
    const dur = Math.max(0, Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000))
    await endFocus(active.id, dur)
    setActive(null)
    setElapsed(0)
    await reloadHistory()
    return dur
  }, [active, reloadHistory])

  const discard = useCallback(async () => {
    if (!active) return
    await discardFocus(active.id)
    setActive(null)
    setElapsed(0)
  }, [active])

  return { active, elapsed, recent, stats, loading, start, stop, discard }
}
