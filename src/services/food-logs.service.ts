import { createClient } from '@/lib/supabase/client'
import type { FoodLog, FoodLogWithSource, CreateFoodLogInput, DailyMacroSummary, MealType } from '@/types/database.types'

export async function getFoodLogsByDate(date: string): Promise<FoodLogWithSource[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('food_logs')
    .select(`
      *,
      foods ( name, brand ),
      recipes ( name )
    `)
    .eq('user_id', user.id)
    .gte('consumed_at', dayStart)
    .lte('consumed_at', dayEnd)
    .order('consumed_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as FoodLogWithSource[]
}

export async function getDailyMacros(date: string): Promise<DailyMacroSummary> {
  const logs = await getFoodLogsByDate(date)

  return logs.reduce<DailyMacroSummary>(
    (acc, log) => {
      acc.calories += log.calories
      acc.protein += log.protein
      acc.carbs += log.carbs
      acc.fat += log.fat
      acc.logs.push(log)
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, logs: [] }
  )
}

export async function logFood(input: CreateFoodLogInput): Promise<FoodLog> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('food_logs')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as FoodLog
}

export async function deleteFoodLog(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('food_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export const MEAL_ORDER: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack']

export function groupByMeal(logs: FoodLogWithSource[]): Record<MealType, FoodLogWithSource[]> {
  const groups = {} as Record<MealType, FoodLogWithSource[]>
  for (const meal of MEAL_ORDER) groups[meal] = []
  for (const log of logs) groups[log.meal_type].push(log)
  return groups
}
