import { createClient } from '@/lib/supabase/client'
import type { Habit, HabitLog, HabitWithLogs, CreateHabitInput } from '@/types/database.types'

/** Trae los hábitos activos del usuario con sus fechas cumplidas dentro del rango [from, to]. */
export async function getHabitsWithLogs(from: string, to: string): Promise<HabitWithLogs[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: habits, error: hErr }, { data: logs, error: lErr }] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id, log_date')
      .eq('user_id', user.id)
      .gte('log_date', from)
      .lte('log_date', to),
  ])

  if (hErr) throw new Error(hErr.message)
  if (lErr) throw new Error(lErr.message)

  const byHabit = new Map<string, Set<string>>()
  for (const log of (logs ?? []) as Pick<HabitLog, 'habit_id' | 'log_date'>[]) {
    if (!byHabit.has(log.habit_id)) byHabit.set(log.habit_id, new Set())
    byHabit.get(log.habit_id)!.add(log.log_date)
  }

  return ((habits ?? []) as Habit[]).map(h => ({
    ...h,
    done_dates: byHabit.get(h.id) ?? new Set<string>(),
  }))
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: input.name,
      emoji: input.emoji ?? '✅',
      color: input.color ?? '#34d399',
      order_index: input.order_index ?? 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Habit
}

export async function deleteHabit(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Marca/desmarca un hábito para una fecha. Devuelve el nuevo estado (true = cumplido). */
export async function toggleHabitLog(habitId: string, date: string, currentlyDone: boolean): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  if (currentlyDone) {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('log_date', date)
    if (error) throw new Error(error.message)
    return false
  }

  const { error } = await supabase
    .from('habit_logs')
    .upsert(
      { habit_id: habitId, user_id: user.id, log_date: date },
      { onConflict: 'habit_id,log_date' }
    )
  if (error) throw new Error(error.message)
  return true
}
