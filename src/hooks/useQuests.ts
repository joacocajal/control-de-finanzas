'use client'

import { useEffect, useState, useCallback } from 'react'
import * as QuestService from '@/services/quest.service'
import type { MisionDiaria, MisionEstado, CreateMisionInput } from '@/types/database.types'

export function useQuests(onMutation?: () => void) {
  const [misiones, setMisiones] = useState<MisionDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await QuestService.getMisionesHoy()
      setMisiones(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando misiones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const cambiarEstado = useCallback(async (
    id: string,
    estado: Extract<MisionEstado, 'completada' | 'fallada'>,
  ) => {
    setCompleting(id)
    try {
      const updated = await QuestService.actualizarEstadoMision(id, estado)
      setMisiones(prev => prev.map(m => (m.id === id ? updated : m)))
      onMutation?.()
    } finally {
      setCompleting(null)
    }
  }, [onMutation])

  const completar = useCallback((id: string) => cambiarEstado(id, 'completada'), [cambiarEstado])
  const fallar   = useCallback((id: string) => cambiarEstado(id, 'fallada'),    [cambiarEstado])

  const crear = useCallback(async (input: CreateMisionInput): Promise<void> => {
    const nueva = await QuestService.crearMision(input)
    setMisiones(prev => [...prev, nueva])
  }, [])

  const resumen = QuestService.calcularResumenMisiones(misiones)

  return {
    misiones,
    loading,
    error,
    completing,
    resumen,
    completar,
    fallar,
    crear,
    reload: load,
  }
}
