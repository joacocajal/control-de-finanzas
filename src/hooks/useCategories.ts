'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getCategories, createCategory, updateCategory, archiveCategory,
} from '@/services/category.service'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/database.types'

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
  error: string | null
  addCategory: (input: CreateCategoryInput) => Promise<Category>
  editCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>
  removeCategory: (id: string) => Promise<void>
  reload: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  const addCategory = useCallback(async (input: CreateCategoryInput): Promise<Category> => {
    const cat = await createCategory(input)
    setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
    return cat
  }, [])

  const editCategory = useCallback(async (id: string, input: UpdateCategoryInput): Promise<Category> => {
    const cat = await updateCategory(id, input)
    setCategories(prev => prev.map(c => c.id === id ? cat : c).sort((a, b) => a.name.localeCompare(b.name)))
    return cat
  }, [])

  const removeCategory = useCallback(async (id: string): Promise<void> => {
    await archiveCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categories, loading, error, addCategory, editCategory, removeCategory, reload }
}
