import { createClient } from '@/lib/supabase/client'
import { addXpToSkill } from '@/services/learning.service'
import type {
  LearningSession,
  CreateLearningSessionInput,
  FinishLearningSessionInput,
} from '@/types/database.types'

export async function startSession(input: CreateLearningSessionInput): Promise<LearningSession> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('learning_sessions')
    .insert({
      user_id: user.id,
      skill_id: input.skill_id,
      planned_minutes: input.planned_minutes,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as LearningSession
}

export async function updateWhatStudied(id: string, what_studied: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('learning_sessions')
    .update({ what_studied })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function finishSession(
  id: string,
  input: FinishLearningSessionInput,
): Promise<LearningSession> {
  const supabase = createClient()

  const { data: session, error: fetchErr } = await supabase
    .from('learning_sessions')
    .select('started_at, skill_id')
    .eq('id', id)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  const finished_at = new Date()
  const started = new Date(session.started_at as string)
  const duration_minutes = Math.round((finished_at.getTime() - started.getTime()) / 60000)

  const { data, error } = await supabase
    .from('learning_sessions')
    .update({
      finished_at: finished_at.toISOString(),
      duration_minutes,
      was_completed: input.was_completed,
      notes: input.notes ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  const xpGained = Math.round(duration_minutes * (input.was_completed ? 1.5 : 1))
  await addXpToSkill(session.skill_id as string, xpGained).catch(() => {})

  return data as LearningSession
}

export async function updateSession(
  id: string,
  input: { was_completed: boolean; notes?: string | null; skill_id?: string },
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('learning_sessions')
    .update({ was_completed: input.was_completed, notes: input.notes ?? null })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getRecentSessions(skillId: string, limit = 10): Promise<LearningSession[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('skill_id', skillId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as LearningSession[]
}

export async function getWeeklyHours(skillId: string): Promise<{ week_start: string; hours: number }[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

  const { data, error } = await supabase
    .from('learning_sessions')
    .select('started_at, duration_minutes')
    .eq('user_id', user.id)
    .eq('skill_id', skillId)
    .not('finished_at', 'is', null)
    .not('duration_minutes', 'is', null)
    .gte('started_at', twelveWeeksAgo.toISOString())
    .order('started_at')

  if (error) throw new Error(error.message)

  const byWeek: Record<string, number> = {}
  for (const row of data ?? []) {
    const d = new Date(row.started_at as string)
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const key = monday.toISOString().slice(0, 10)
    byWeek[key] = (byWeek[key] ?? 0) + ((row.duration_minutes as number) / 60)
  }

  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week_start, hours]) => ({ week_start, hours: Math.round(hours * 10) / 10 }))
}
