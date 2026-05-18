import { createClient } from '@/lib/supabase/client'
import type { FitnessGoal, FitnessGoalType, UpsertFitnessGoalInput } from '@/types/database.types'

export async function getFitnessGoals(): Promise<FitnessGoal[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('fitness_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)

  if (error) throw new Error(error.message)
  return (data ?? []) as FitnessGoal[]
}

export async function getGoalByType(type: FitnessGoalType): Promise<FitnessGoal | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('fitness_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('goal_type', type)
    .eq('active', true)
    .single()

  if (error) return null
  return data as FitnessGoal
}

export async function upsertGoal(input: UpsertFitnessGoalInput): Promise<FitnessGoal> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Deactivate existing goal of same type
  await supabase
    .from('fitness_goals')
    .update({ active: false })
    .eq('user_id', user.id)
    .eq('goal_type', input.goal_type)

  const { data, error } = await supabase
    .from('fitness_goals')
    .insert({ ...input, user_id: user.id, active: true })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as FitnessGoal
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('fitness_goals').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function goalsToMap(goals: FitnessGoal[]): Partial<Record<FitnessGoalType, number>> {
  return Object.fromEntries(goals.map(g => [g.goal_type, g.target_value]))
}
