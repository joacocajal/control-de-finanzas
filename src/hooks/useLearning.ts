'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import * as LearningService from '@/services/learning.service'
import type {
  AprendizajeSkill,
  AprendizajeLog,
  CreateAprendizajeSkillInput,
  CreateAprendizajeLogInput,
} from '@/types/database.types'

export function useLearning(onMutation?: () => void) {
  const [skills, setSkills] = useState<AprendizajeSkill[]>([])
  const [skillActiva, setSkillActiva] = useState<AprendizajeSkill | null>(null)
  const [historial, setHistorial] = useState<AprendizajeLog[]>([])
  const [totalHoras, setTotalHoras] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const s = await LearningService.getSkills()
      setSkills(s)
      if (!initialized.current && s.length > 0) {
        initialized.current = true
        setSkillActiva(s[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando aprendizaje')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadSkills() }, [loadSkills])

  useEffect(() => {
    if (!skillActiva) return
    void Promise.all([
      LearningService.getHistorialVideos(skillActiva.id),
      LearningService.getTotalHorasSkill(skillActiva.id),
    ]).then(([h, t]) => {
      setHistorial(h)
      setTotalHoras(t)
    }).catch(() => {})
  }, [skillActiva?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addEstudio = useCallback(async (input: CreateAprendizajeLogInput): Promise<AprendizajeLog> => {
    const log = await LearningService.registrarHorasEstudio(input)
    if (skillActiva && input.skill_id === skillActiva.id) {
      const [h, t] = await Promise.all([
        LearningService.getHistorialVideos(skillActiva.id),
        LearningService.getTotalHorasSkill(skillActiva.id),
      ])
      setHistorial(h)
      setTotalHoras(t)
    }
    onMutation?.()
    return log
  }, [skillActiva, onMutation])

  const crearSkill = useCallback(async (
    input: CreateAprendizajeSkillInput & { suggested_skill_id?: string | null }
  ): Promise<AprendizajeSkill> => {
    const nueva = await LearningService.crearSkill(input)
    setSkills(prev => [...prev, nueva])
    setSkillActiva(nueva)
    initialized.current = true
    return nueva
  }, [])

  const eliminarSkill = useCallback(async (id: string): Promise<void> => {
    await LearningService.eliminarSkill(id)
    setSkills(prev => {
      const remaining = prev.filter(s => s.id !== id)
      if (skillActiva?.id === id) setSkillActiva(remaining[0] ?? null)
      return remaining
    })
    onMutation?.()
  }, [skillActiva, onMutation])

  const adoptarSkill = useCallback(async (suggested: import('@/types/database.types').SuggestedSkill): Promise<AprendizajeSkill> => {
    return crearSkill({ nombre_habilidad: suggested.name, suggested_skill_id: suggested.id })
  }, [crearSkill])

  return {
    skills,
    skillActiva,
    historial,
    totalHoras,
    loading,
    error,
    setSkillActiva,
    addEstudio,
    crearSkill,
    eliminarSkill,
    adoptarSkill,
    reload: loadSkills,
  }
}
