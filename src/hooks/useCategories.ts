'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCategories, createCategory } from '@/services/category.service'
import type { Category, CreateCategoryInput } from '@/types/database.types'

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
  error: string | null
  addCategory: (input: CreateCategoryInput) => Promise<Category>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Error al cargar categorías')
      )
      .finally(() => setLoading(false))
  }, [])

  const addCategory = useCallback(async (input: CreateCategoryInput): Promise<Category> => {
    const cat = await createCategory(input)
    setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
    return cat
  }, [])

  return { categories, loading, error, addCategory }
}
