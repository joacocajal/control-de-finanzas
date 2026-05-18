'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as SessionService from '@/services/learning-sessions.service'
import type { LearningSession, PlannedMinutes, FinishLearningSessionInput } from '@/types/database.types'

interface UseLearningSessionReturn {
  activeSession: LearningSession | null
  elapsed: number
  isRunning: boolean
  start: (skillId: string, planned: PlannedMinutes) => Promise<void>
  pause: () => void
  resume: () => void
  finish: (input: FinishLearningSessionInput) => Promise<LearningSession>
  updateWhatStudied: (text: string) => void
  recentSessions: LearningSession[]
  weeklyHours: { week_start: string; hours: number }[]
  loadStats: (skillId: string) => Promise<void>
}

export function useLearningSession(): UseLearningSessionReturn {
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [recentSessions, setRecentSessions] = useState<LearningSession[]>([])
  const [weeklyHours, setWeeklyHours] = useState<{ week_start: string; hours: number }[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const whatStudiedDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  const startTick = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setElapsed((p) => p + 1)
    }, 1000)
  }, [])

  const stopTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopTick()
  }, [stopTick])

  const start = useCallback(async (skillId: string, planned: PlannedMinutes) => {
    const session = await SessionService.startSession({ skill_id: skillId, planned_minutes: planned })
    setActiveSession(session)
    sessionIdRef.current = session.id
    setElapsed(0)
    setIsRunning(true)
    startTick()
  }, [startTick])

  const pause = useCallback(() => {
    setIsRunning(false)
    stopTick()
  }, [stopTick])

  const resume = useCallback(() => {
    setIsRunning(true)
    startTick()
  }, [startTick])

  const finish = useCallback(async (input: FinishLearningSessionInput): Promise<LearningSession> => {
    stopTick()
    setIsRunning(false)
    const id = sessionIdRef.current
    if (!id) throw new Error('No hay sesión activa')
    const finished = await SessionService.finishSession(id, input)
    setActiveSession(null)
    sessionIdRef.current = null
    setElapsed(0)
    return finished
  }, [stopTick])

  const updateWhatStudied = useCallback((text: string) => {
    setActiveSession((prev) => prev ? { ...prev, what_studied: text } : prev)
    if (whatStudiedDebounceRef.current) clearTimeout(whatStudiedDebounceRef.current)
    const id = sessionIdRef.current
    if (!id) return
    whatStudiedDebounceRef.current = setTimeout(() => {
      void SessionService.updateWhatStudied(id, text)
    }, 1500)
  }, [])

  const loadStats = useCallback(async (skillId: string) => {
    const [sessions, weekly] = await Promise.all([
      SessionService.getRecentSessions(skillId),
      SessionService.getWeeklyHours(skillId),
    ])
    setRecentSessions(sessions)
    setWeeklyHours(weekly)
  }, [])

  return {
    activeSession,
    elapsed,
    isRunning,
    start,
    pause,
    resume,
    finish,
    updateWhatStudied,
    recentSessions,
    weeklyHours,
    loadStats,
  }
}
