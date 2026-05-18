'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getPresupuestosActivos,
  crearPresupuesto,
  actualizarPresupuesto,
  eliminarPresupuesto,
} from '@/services/budget.service'
import type { PresupuestoConCategoria, CreatePresupuestoInput, Presupuesto } from '@/types/database.types'

export function useBudgets() {
  const [budgets, setBudgets] = useState<PresupuestoConCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setBudgets(await getPresupuestosActivos())
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

  const create = useCallback(async (input: CreatePresupuestoInput) => {
    await crearPresupuesto(input)
    await load()
  }, [load])

  const update = useCallback(async (id: string, patch: Partial<Pick<Presupuesto, 'monto_limite' | 'periodo' | 'fecha_fin'>>) => {
    await actualizarPresupuesto(id, patch)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await eliminarPresupuesto(id)
    await load()
  }, [load])

  return { budgets, loading, error, create, update, remove, reload: load }
}
