'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getWaterByDate, logWater, deleteWaterLog } from '@/services/water-logs.service'
import type { WaterLog } from '@/types/database.types'

export function useWaterLogs(date: string) {
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [totalLiters, setTotalLiters] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getWaterByDate(date)
      setLogs(result.logs)
      setTotalLiters(result.totalLiters)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void load()
  }, [load])

  useEffect(() => {
    initialized.current = false
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const addWater = useCallback(async (liters: number) => {
    await logWater({ liters })
    await load()
  }, [load])

  const removeWater = useCallback(async (id: string) => {
    await deleteWaterLog(id)
    await load()
  }, [load])

  return { logs, totalLiters, loading, error, addWater, removeWater, reload: load }
}
