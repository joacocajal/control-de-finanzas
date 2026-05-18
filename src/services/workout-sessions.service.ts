import { createClient } from '@/lib/supabase/client'
import type {
  WorkoutSession,
  WorkoutSet,
  WorkoutSessionWithSets,
  CreateWorkoutSessionInput,
  CreateWorkoutSetInput,
  WorkoutPreFeelingInput,
  WorkoutPostFeelingInput,
} from '@/types/database.types'

export async function startSession(
  input: CreateWorkoutSessionInput,
  preFeeling?: WorkoutPreFeelingInput
): Promise<WorkoutSession> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      ...input,
      user_id: user.id,
      energy_level: preFeeling?.energy_level ?? null,
      sleep_hours: preFeeling?.sleep_hours ?? null,
      muscle_soreness: preFeeling?.muscle_soreness ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WorkoutSession
}

export async function finishSession(
  id: string,
  postFeeling?: WorkoutPostFeelingInput | null
): Promise<WorkoutSession> {
  const supabase = createClient()
  const finishedAt = new Date().toISOString()

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('started_at')
    .eq('id', id)
    .single()

  const durationMinutes = session
    ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)
    : null

  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      finished_at: finishedAt,
      duration_minutes: durationMinutes,
      session_feeling: postFeeling?.session_feeling ?? null,
      post_session_notes: postFeeling?.post_session_notes ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WorkoutSession
}

export async function logSet(input: CreateWorkoutSetInput): Promise<WorkoutSet> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sets')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WorkoutSet
}

export async function updateSet(id: string, input: Partial<Omit<CreateWorkoutSetInput, 'session_id' | 'exercise_name' | 'set_number'>>): Promise<WorkoutSet> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sets')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WorkoutSet
}

export async function deleteSet(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('workout_sets').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getSessionWithSets(id: string): Promise<WorkoutSessionWithSets | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`*, workout_sets (*)`)
    .eq('id', id)
    .single()

  if (error) return null
  const s = data as unknown as WorkoutSessionWithSets
  s.workout_sets = s.workout_sets.sort((a, b) => a.set_number - b.set_number)
  return s
}

export async function getSessionHistory(limit = 20): Promise<WorkoutSessionWithSets[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`*, workout_sets (*)`)
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as WorkoutSessionWithSets[]
}

export async function getLastSessionForRoutine(routineId: string): Promise<WorkoutSessionWithSets | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`*, workout_sets (*)`)
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as unknown as WorkoutSessionWithSets
}
