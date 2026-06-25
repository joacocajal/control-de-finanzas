'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getHabitsWithLogs,
  createHabit,
  deleteHabit,
  toggleHabitLog,
} from '@/services/habits.service'
import type { HabitWithLogs, CreateHabitInput } from '@/types/database.types'

/**
 * Maneja los hábitos y sus registros dentro de una ventana de fechas [from, to].
 * El toggle es optimista: actualiza el set local antes de persistir.
 */
export function useHabits(from: string, to: string) {
  const [habits, setHabits] = useState<HabitWithLogs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setHabits(await getHabitsWithLogs(from, to))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    // Recarga cuando cambia el rango; la primera vez también.
    initialized.current = true
    void load()
  }, [load])

  const create = useCallback(async (input: CreateHabitInput) => {
    await createHabit({ ...input, order_index: habits.length })
    await load()
  }, [habits.length, load])

  const remove = useCallback(async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    try {
      await deleteHabit(id)
    } catch {
      await load()
    }
  }, [load])

  const toggle = useCallback(async (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const currentlyDone = habit.done_dates.has(date)

    // Optimista
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h
      const next = new Set(h.done_dates)
      if (currentlyDone) next.delete(date)
      else next.add(date)
      return { ...h, done_dates: next }
    }))

    try {
      await toggleHabitLog(habitId, date, currentlyDone)
    } catch {
      // Revertir
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h
        const next = new Set(h.done_dates)
        if (currentlyDone) next.add(date)
        else next.delete(date)
        return { ...h, done_dates: next }
      }))
    }
  }, [habits])

  return { habits, loading, error, reload: load, create, remove, toggle }
}
