'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getFinancialGoals,
  createFinancialGoal,
  updateFinancialGoal,
  addProgress,
  toggleCompleted,
  deleteFinancialGoal,
} from '@/services/financial-goals.service'
import type { FinancialGoal, CreateFinancialGoalInput, UpdateFinancialGoalInput } from '@/types/database.types'

export function useFinancialGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGoals(await getFinancialGoals())
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

  const create = useCallback(async (input: CreateFinancialGoalInput) => {
    await createFinancialGoal(input)
    await load()
  }, [load])

  const update = useCallback(async (id: string, patch: UpdateFinancialGoalInput) => {
    await updateFinancialGoal(id, patch)
    await load()
  }, [load])

  const addAmount = useCallback(async (id: string, amount: number) => {
    await addProgress(id, amount)
    await load()
  }, [load])

  const toggle = useCallback(async (id: string, completed: boolean) => {
    await toggleCompleted(id, completed)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteFinancialGoal(id)
    await load()
  }, [load])

  return { goals, loading, error, create, update, addAmount, toggle, remove, reload: load }
}
