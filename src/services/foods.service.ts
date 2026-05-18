import { createClient } from '@/lib/supabase/client'
import type { Food, CreateFoodInput } from '@/types/database.types'

export async function searchFoods(query: string, limit = 20): Promise<Food[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .or(`is_global.eq.true,user_id.eq.${user.id}`)
    .ilike('name', `%${query}%`)
    .order('is_global', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as Food[]
}

export async function getFoodById(id: string): Promise<Food | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Food
}

export async function createCustomFood(input: CreateFoodInput): Promise<Food> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('foods')
    .insert({
      ...input,
      user_id: user.id,
      is_global: false,
      fiber_per_100g: input.fiber_per_100g ?? 0,
      serving_units: input.serving_units ?? [],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Food
}

export async function deleteCustomFood(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('foods').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function calcMacros(food: Food, grams: number) {
  const factor = grams / 100
  return {
    calories: Math.round(food.calories_per_100g * factor * 10) / 10,
    protein: Math.round(food.protein_per_100g * factor * 10) / 10,
    carbs: Math.round(food.carbs_per_100g * factor * 10) / 10,
    fat: Math.round(food.fat_per_100g * factor * 10) / 10,
  }
}
