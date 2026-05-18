'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  archiveRoutine,
  deleteRoutine,
  addExercise,
  updateExercise,
  deleteExercise,
} from '@/services/workout-routines.service'
import type {
  WorkoutRoutineWithExercises,
  CreateWorkoutRoutineInput,
  CreateRoutineExerciseInput,
  RoutineExercise,
} from '@/types/database.types'

export function useWorkoutRoutines() {
  const [routines, setRoutines] = useState<WorkoutRoutineWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRoutines(await getRoutines())
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

  const create = useCallback(async (input: CreateWorkoutRoutineInput) => {
    await createRoutine(input)
    await load()
  }, [load])

  const update = useCallback(async (id: string, input: Partial<CreateWorkoutRoutineInput>) => {
    await updateRoutine(id, input)
    await load()
  }, [load])

  const archive = useCallback(async (id: string) => {
    await archiveRoutine(id)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteRoutine(id)
    await load()
  }, [load])

  const addEx = useCallback(async (input: CreateRoutineExerciseInput): Promise<RoutineExercise> => {
    const ex = await addExercise(input)
    await load()
    return ex
  }, [load])

  const updateEx = useCallback(async (id: string, input: Partial<Omit<CreateRoutineExerciseInput, 'routine_id'>>) => {
    await updateExercise(id, input)
    await load()
  }, [load])

  const removeEx = useCallback(async (id: string) => {
    await deleteExercise(id)
    await load()
  }, [load])

  return {
    routines, loading, error, reload: load,
    create, update, archive, remove,
    addEx, updateEx, removeEx,
  }
}

export function useRoutineDetail(id: string | null) {
  const [routine, setRoutine] = useState<WorkoutRoutineWithExercises | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!id) { setRoutine(null); return }
    setLoading(true)
    try {
      setRoutine(await getRoutineById(id))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  return { routine, loading, reload: load }
}
