'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getProgression,
  getAchievements,
  toggleStrictMode,
  cancelStrictModeDisable,
  checkAndDisableStrictMode,
} from '@/services/missions.service'
import type { UserProgression, UserAchievement } from '@/types/database.types'

export function useProgression() {
  const [progression, setProgression] = useState<UserProgression | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      await checkAndDisableStrictMode()
      const [prog, achs] = await Promise.all([getProgression(), getAchievements()])
      setProgression(prog)
      setAchievements(achs)
    } catch {
      // silencioso hasta que corra la migration
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void load()
  }, [load])

  const toggleStrict = useCallback(async () => {
    const updated = await toggleStrictMode()
    setProgression(updated)
    return updated
  }, [])

  const cancelDisable = useCallback(async () => {
    const updated = await cancelStrictModeDisable()
    setProgression(updated)
  }, [])

  return {
    progression, achievements, loading,
    toggleStrict, cancelDisable,
    reload: load,
  }
}
