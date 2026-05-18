'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getFitnessGoals, upsertGoal, deleteGoal, goalsToMap } from '@/services/fitness-goals.service'
import type { FitnessGoal, FitnessGoalType, UpsertFitnessGoalInput } from '@/types/database.types'

export function useFitnessGoals() {
  const [goals, setGoals] = useState<FitnessGoal[]>([])
  const [goalsMap, setGoalsMap] = useState<Partial<Record<FitnessGoalType, number>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFitnessGoals()
      setGoals(data)
      setGoalsMap(goalsToMap(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void load()
  }, [load])

  const upsert = useCallback(async (input: UpsertFitnessGoalInput) => {
    await upsertGoal(input)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteGoal(id)
    await load()
  }, [load])

  return { goals, goalsMap, loading, error, upsert, remove, reload: load }
}
