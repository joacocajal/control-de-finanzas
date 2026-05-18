'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getProfileGamificado,
  getHabilidades,
  getMisionesHoy,
  completarMision,
  crearMision,
} from '@/services/gamification.service'
import type {
  ProfileGamificado,
  HabilidadStat,
  MisionDiaria,
  CreateMisionInput,
} from '@/types/database.types'

export function useGamification() {
  const [profile, setProfile] = useState<ProfileGamificado | null>(null)
  const [habilidades, setHabilidades] = useState<HabilidadStat[]>([])
  const [misiones, setMisiones] = useState<MisionDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [p, h, m] = await Promise.all([
        getProfileGamificado(),
        getHabilidades(),
        getMisionesHoy(),
      ])
      setProfile(p)
      setHabilidades(h)
      setMisiones(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const completar = useCallback(async (id: string) => {
    await completarMision(id)
    await load()
  }, [load])

  const crear = useCallback(async (input: CreateMisionInput) => {
    await crearMision(input)
    await load()
  }, [load])

  return { profile, habilidades, misiones, loading, error, completar, crear, reload: load }
}

export function xpUmbral(nivel: number): number {
  return Math.floor(100 * Math.pow(1.15, nivel - 1))
}

export function xpPorcentaje(xp: number, nivel: number): number {
  return Math.min(100, Math.round((xp / xpUmbral(nivel)) * 100))
}
