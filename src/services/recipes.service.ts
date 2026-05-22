import { createClient } from '@/lib/supabase/client'
import type { Recipe, RecipeWithIngredients, CreateRecipeInput, CreateRecipeIngredientInput } from '@/types/database.types'
import { calcMacros } from './foods.service'

export async function getRecipes(): Promise<RecipeWithIngredients[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        *,
        foods (*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as RecipeWithIngredients[]
}

export async function getRecipeById(id: string): Promise<RecipeWithIngredients | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        *,
        foods (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as RecipeWithIngredients
}

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...input, user_id: user.id, servings: input.servings ?? 1 })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Recipe
}

export async function updateRecipe(id: string, input: Partial<CreateRecipeInput>): Promise<Recipe> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recipes')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Recipe
}

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createRecipeWithIngredients(
  input: CreateRecipeInput,
  ingredients: Array<Omit<CreateRecipeIngredientInput, 'recipe_id'>>
): Promise<Recipe> {
  const recipe = await createRecipe(input)
  if (ingredients.length > 0) {
    const supabase = createClient()
    const { error } = await supabase
      .from('recipe_ingredients')
      .insert(
        ingredients.map(ing => ({
          recipe_id: recipe.id,
          food_id: ing.food_id,
          grams: ing.grams,
          display_amount: ing.display_amount ?? null,
          display_unit: ing.display_unit ?? null,
        }))
      )
    if (error) {
      await supabase.from('recipes').delete().eq('id', recipe.id)
      throw new Error(error.message)
    }
  }
  return recipe
}

export async function addIngredient(input: CreateRecipeIngredientInput) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function removeIngredient(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('recipe_ingredients').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function calcRecipeMacros(recipe: RecipeWithIngredients) {
  let calories = 0, protein = 0, carbs = 0, fat = 0

  for (const ing of recipe.recipe_ingredients) {
    const m = calcMacros(ing.foods, ing.grams)
    calories += m.calories
    protein += m.protein
    carbs += m.carbs
    fat += m.fat
  }

  return {
    total: { calories, protein, carbs, fat },
    perServing: {
      calories: Math.round(calories / recipe.servings * 10) / 10,
      protein: Math.round(protein / recipe.servings * 10) / 10,
      carbs: Math.round(carbs / recipe.servings * 10) / 10,
      fat: Math.round(fat / recipe.servings * 10) / 10,
    },
  }
}
