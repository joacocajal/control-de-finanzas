'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getDailyMacros, logFood, deleteFoodLog, groupByMeal, MEAL_ORDER } from '@/services/food-logs.service'
import type { FoodLogWithSource, CreateFoodLogInput, DailyMacroSummary, MealType } from '@/types/database.types'

export function useFoodLogs(date: string) {
  const [macros, setMacros] = useState<DailyMacroSummary>({ calories: 0, protein: 0, carbs: 0, fat: 0, logs: [] })
  const [grouped, setGrouped] = useState<Record<MealType, FoodLogWithSource[]>>(() => {
    const g = {} as Record<MealType, FoodLogWithSource[]>
    for (const m of MEAL_ORDER) g[m] = []
    return g
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summary = await getDailyMacros(date)
      setMacros(summary)
      setGrouped(groupByMeal(summary.logs))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void load()
  }, [load])

  useEffect(() => {
    initialized.current = false
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const addLog = useCallback(async (input: CreateFoodLogInput) => {
    await logFood(input)
    await load()
  }, [load])

  const removeLog = useCallback(async (id: string) => {
    await deleteFoodLog(id)
    await load()
  }, [load])

  return { macros, grouped, loading, error, addLog, removeLog, reload: load }
}
