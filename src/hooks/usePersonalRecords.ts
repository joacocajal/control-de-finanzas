'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getPersonalRecords,
  createPR,
  updatePR,
  deletePR,
} from '@/services/personal-records.service'
import type { PersonalRecord, CreatePersonalRecordInput, PRCategory } from '@/types/database.types'

export function usePersonalRecords(category?: PRCategory) {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecords(await getPersonalRecords(category))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void load()
  }, [load])

  const create = useCallback(async (input: CreatePersonalRecordInput) => {
    await createPR(input)
    await load()
  }, [load])

  const update = useCallback(async (id: string, input: Partial<CreatePersonalRecordInput>) => {
    await updatePR(id, input)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deletePR(id)
    await load()
  }, [load])

  return { records, loading, error, create, update, remove, reload: load }
}
