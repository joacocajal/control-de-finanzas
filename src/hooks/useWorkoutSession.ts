'use client'

import { useState, useCallback } from 'react'
import {
  startSession,
  finishSession,
  logSet,
  deleteSet,
  getSessionHistory,
  getLastSessionForRoutine,
} from '@/services/workout-sessions.service'
import { detectNewPRs } from '@/services/personal-records.service'
import type {
  WorkoutSession,
  WorkoutSet,
  WorkoutSessionWithSets,
  WorkoutPreFeelingInput,
  WorkoutPostFeelingInput,
  PersonalRecord,
  WorkoutCategory,
} from '@/types/database.types'

export function useWorkoutSession() {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [loading, setLoading] = useState(false)
  const [newPRs, setNewPRs] = useState<PersonalRecord[]>([])

  const start = useCallback(async (
    routineId: string | null,
    routineName: string,
    preFeeling?: WorkoutPreFeelingInput
  ) => {
    setLoading(true)
    try {
      const session = await startSession(
        { routine_id: routineId, routine_name_snapshot: routineName },
        preFeeling
      )
      setActiveSession(session)
      setSets([])
      setNewPRs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addSet = useCallback(async (
    exerciseName: string,
    setNumber: number,
    data: { reps?: number; weight_kg?: number; rpe?: number; notes?: string }
  ) => {
    if (!activeSession) return
    const set = await logSet({
      session_id: activeSession.id,
      exercise_name: exerciseName,
      set_number: setNumber,
      ...data,
    })
    setSets(prev => [...prev, set])
    return set
  }, [activeSession])

  const removeSet = useCallback(async (id: string) => {
    await deleteSet(id)
    setSets(prev => prev.filter(s => s.id !== id))
  }, [])

  const finish = useCallback(async (postFeeling?: WorkoutPostFeelingInput, category: WorkoutCategory = 'gym') => {
    if (!activeSession) return
    setLoading(true)
    try {
      await finishSession(activeSession.id, postFeeling)
      const detected = await detectNewPRs(sets, category)
      setNewPRs(detected)
      setActiveSession(null)
      setSets([])
      return detected
    } finally {
      setLoading(false)
    }
  }, [activeSession, sets])

  const discard = useCallback(() => {
    setActiveSession(null)
    setSets([])
    setNewPRs([])
  }, [])

  return { activeSession, sets, loading, newPRs, start, addSet, removeSet, finish, discard }
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<WorkoutSessionWithSets[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (limit = 20) => {
    setLoading(true)
    try {
      setSessions(await getSessionHistory(limit))
    } finally {
      setLoading(false)
    }
  }, [])

  const getLastForRoutine = useCallback(
    (routineId: string) => getLastSessionForRoutine(routineId),
    []
  )

  return { sessions, loading, load, getLastForRoutine }
}
