import { createClient } from '@/lib/supabase/client'
import type { FinancialGoal, CreateFinancialGoalInput, UpdateFinancialGoalInput } from '@/types/database.types'

export async function getFinancialGoals(): Promise<FinancialGoal[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as FinancialGoal[]
}

export async function createFinancialGoal(input: CreateFinancialGoalInput): Promise<FinancialGoal> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('financial_goals')
    .insert({ ...input, user_id: user.id, current_amount: input.current_amount ?? 0 })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as FinancialGoal
}

export async function updateFinancialGoal(id: string, patch: UpdateFinancialGoalInput): Promise<FinancialGoal> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('financial_goals')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as FinancialGoal
}

export async function addProgress(id: string, amount: number): Promise<FinancialGoal> {
  const supabase = createClient()

  // Read current, then add
  const { data: current } = await supabase
    .from('financial_goals')
    .select('current_amount, target_amount')
    .eq('id', id)
    .single()

  const newAmount = (current?.current_amount ?? 0) + amount
  const completed = newAmount >= (current?.target_amount ?? Infinity)

  const { data, error } = await supabase
    .from('financial_goals')
    .update({ current_amount: newAmount, completed })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as FinancialGoal
}

export async function toggleCompleted(id: string, completed: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('financial_goals')
    .update({ completed })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteFinancialGoal(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('financial_goals').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
