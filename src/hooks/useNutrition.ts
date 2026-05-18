'use client'

import { useEffect, useState, useCallback } from 'react'
import * as NutritionService from '@/services/nutrition.service'
import type {
  AlimentoBase,
  ResumenNutricionDiaria,
  CreateNutricionLogInput,
} from '@/types/database.types'

export function useNutrition(onMutation?: () => void) {
  const [alimentosBase, setAlimentosBase] = useState<AlimentoBase[]>([])
  const [resumen, setResumen] = useState<ResumenNutricionDiaria>({
    logs: [],
    totalCalorias: 0,
    totalProteinas: 0,
    totalAguaMl: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [alimentos, res] = await Promise.all([
        NutritionService.getAlimentosBase(),
        NutritionService.getResumenDiario(),
      ])
      setAlimentosBase(alimentos)
      setResumen(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando nutrición')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const addComida = useCallback(async (input: CreateNutricionLogInput): Promise<void> => {
    await NutritionService.registrarComidaDiaria(input)
    await load()
    onMutation?.()
  }, [load, onMutation])

  const addAgua = useCallback(async (cantidadMl: number): Promise<void> => {
    // Optimistic update para feedback instantáneo
    setResumen(prev => ({ ...prev, totalAguaMl: prev.totalAguaMl + cantidadMl }))
    try {
      await NutritionService.registrarAgua(cantidadMl)
    } catch {
      setResumen(prev => ({ ...prev, totalAguaMl: prev.totalAguaMl - cantidadMl }))
    }
  }, [])

  const removeLog = useCallback(async (id: string): Promise<void> => {
    await NutritionService.eliminarLogNutricion(id)
    await load()
  }, [load])

  return {
    alimentosBase,
    resumen,
    loading,
    error,
    addComida,
    addAgua,
    removeLog,
    calcularMacros: NutritionService.calcularMacros,
    reload: load,
  }
}
