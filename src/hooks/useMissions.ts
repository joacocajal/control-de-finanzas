'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getTodayMissions,
  completeMission,
  uncompleteMission,
  createCustomMission,
  deleteMission,
} from '@/services/missions.service'
import type { DailyMission, CreateDailyMissionInput } from '@/types/database.types'

export function useMissions() {
  const [missions, setMissions] = useState<DailyMission[]>([])
  const [loading, setLoading] = useState(true)
  const [newAchievements, setNewAchievements] = useState<string[]>([])
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMissions(await getTodayMissions())
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

  const complete = useCallback(async (id: string) => {
    // Optimistic update
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m))
    try {
      const { newAchievements: earned } = await completeMission(id)
      if (earned.length > 0) setNewAchievements(earned)
      await load()
    } catch {
      setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: false } : m))
    }
  }, [load])

  const uncomplete = useCallback(async (id: string) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: false } : m))
    try {
      await uncompleteMission(id)
      await load()
    } catch {
      setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m))
    }
  }, [load])

  const create = useCallback(async (input: CreateDailyMissionInput) => {
    await createCustomMission(input)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteMission(id)
    await load()
  }, [load])

  const clearAchievements = useCallback(() => setNewAchievements([]), [])

  const completed = missions.filter(m => m.completed).length
  const total     = missions.length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    missions, loading,
    complete, uncomplete, create, remove,
    completed, total, pct,
    newAchievements, clearAchievements,
    reload: load,
  }
}
