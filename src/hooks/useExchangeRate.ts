'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLatestRate, saveRate } from '@/services/exchange-rates.service'
import { toISODate } from '@/lib/utils/formatters'
import type { ExchangeRate } from '@/types/database.types'

export function useExchangeRate() {
  const [rate, setRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getLatestRate()
      setRate(r)
    } catch {
      // silencioso — sin red se ignora
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const save = useCallback(async (ars_to_usd: number): Promise<void> => {
    const r = await saveRate(ars_to_usd)
    setRate(r)
  }, [])

  const isToday = rate?.date === toISODate()
  const arsToUsd = rate?.ars_to_usd ?? null

  return { rate, loading, isToday, arsToUsd, save, reload: load }
}
