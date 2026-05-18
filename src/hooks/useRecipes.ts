'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addIngredient,
  removeIngredient,
  calcRecipeMacros,
} from '@/services/recipes.service'
import type { RecipeWithIngredients, CreateRecipeInput, CreateRecipeIngredientInput } from '@/types/database.types'

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecipes(await getRecipes())
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

  const create = useCallback(async (input: CreateRecipeInput) => {
    await createRecipe(input)
    await load()
  }, [load])

  const update = useCallback(async (id: string, input: Partial<CreateRecipeInput>) => {
    await updateRecipe(id, input)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteRecipe(id)
    await load()
  }, [load])

  const addIng = useCallback(async (input: CreateRecipeIngredientInput) => {
    await addIngredient(input)
    await load()
  }, [load])

  const removeIng = useCallback(async (id: string) => {
    await removeIngredient(id)
    await load()
  }, [load])

  return {
    recipes, loading, error, reload: load,
    create, update, remove,
    addIng, removeIng,
    calcMacros: calcRecipeMacros,
  }
}
