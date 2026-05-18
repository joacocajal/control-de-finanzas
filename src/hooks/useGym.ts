'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import * as GymService from '@/services/gym.service'
import type {
  GymRutina,
  GymEjercicio,
  GymPR,
  GymSerieLog,
  CreateGymRutinaInput,
  CreateGymEjercicioInput,
  CreateGymSerieLogInput,
} from '@/types/database.types'

export function useGym(onMutation?: () => void) {
  const [rutinas, setRutinas] = useState<GymRutina[]>([])
  const [rutinaActiva, setRutinaActiva] = useState<GymRutina | null>(null)
  const [ejercicios, setEjercicios] = useState<GymEjercicio[]>([])
  const [prs, setPRs] = useState<GymPR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const loadBase = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [r, p] = await Promise.all([GymService.getRutinas(), GymService.getPRs()])
      setRutinas(r)
      setPRs(p)
      if (!initialized.current && r.length > 0) {
        initialized.current = true
        setRutinaActiva(r[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando gym')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadBase() }, [loadBase])

  useEffect(() => {
    if (!rutinaActiva) { setEjercicios([]); return }
    void GymService.getEjerciciosByRutina(rutinaActiva.id)
      .then(setEjercicios)
      .catch(() => {})
  }, [rutinaActiva?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const crearRutina = useCallback(async (input: CreateGymRutinaInput): Promise<GymRutina> => {
    const nueva = await GymService.crearRutina(input)
    setRutinas(prev => [nueva, ...prev])
    setRutinaActiva(nueva)
    initialized.current = true
    return nueva
  }, [])

  const crearEjercicio = useCallback(async (input: CreateGymEjercicioInput): Promise<GymEjercicio> => {
    const nuevo = await GymService.crearEjercicio(input)
    setEjercicios(prev => [...prev, nuevo])
    return nuevo
  }, [])

  const registrarSerie = useCallback(async (input: CreateGymSerieLogInput): Promise<GymSerieLog> => {
    const log = await GymService.registrarSerieLog(input)
    // Intentar PR automático si hay peso registrado
    if (input.peso_kg != null) {
      const ejercicio = ejercicios.find(e => e.id === input.ejercicio_id)
      if (ejercicio) {
        const pr = await GymService.actualizarPR(ejercicio.nombre_ejercicio, input.peso_kg)
        setPRs(prev => {
          const idx = prev.findIndex(p => p.tipo_ejercicio === ejercicio.nombre_ejercicio)
          return idx >= 0
            ? prev.map((p, i) => (i === idx ? pr : p))
            : [...prev, pr]
        })
      }
    }
    onMutation?.()
    return log
  }, [ejercicios, onMutation])

  return {
    rutinas,
    rutinaActiva,
    ejercicios,
    prs,
    loading,
    error,
    setRutinaActiva,
    crearRutina,
    crearEjercicio,
    registrarSerie,
    reload: loadBase,
  }
}
