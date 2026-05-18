'use client'

import { useState, useCallback, useRef } from 'react'
import { searchFoods, createCustomFood } from '@/services/foods.service'
import type { Food, CreateFoodInput } from '@/types/database.types'

export function useFoodSearch() {
  const [results, setResults] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchFoods(query, 20)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [])

  const clear = useCallback(() => setResults([]), [])

  return { results, loading, search, clear }
}

export function useCreateFood() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (input: CreateFoodInput): Promise<Food | null> => {
    setLoading(true)
    setError(null)
    try {
      return await createCustomFood(input)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear alimento')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}
