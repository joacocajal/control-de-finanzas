import { createClient } from '@/lib/supabase/client'
import type {
  WorkoutRoutine,
  WorkoutRoutineWithExercises,
  RoutineExercise,
  CreateWorkoutRoutineInput,
  CreateRoutineExerciseInput,
} from '@/types/database.types'

export async function getRoutines(): Promise<WorkoutRoutineWithExercises[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('workout_routines')
    .select(`
      *,
      routine_exercises ( * )
    `)
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as WorkoutRoutineWithExercises[]).map(r => ({
    ...r,
    routine_exercises: r.routine_exercises.sort((a, b) => a.order_index - b.order_index),
  }))
}

export async function getRoutineById(id: string): Promise<WorkoutRoutineWithExercises | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_routines')
    .select(`
      *,
      routine_exercises ( * )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  const r = data as unknown as WorkoutRoutineWithExercises
  r.routine_exercises = r.routine_exercises.sort((a, b) => a.order_index - b.order_index)
  return r
}

export async function createRoutine(input: CreateWorkoutRoutineInput): Promise<WorkoutRoutine> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('workout_routines')
    .insert({ ...input, user_id: user.id, category: input.category ?? 'gym' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WorkoutRoutine
}

export async function updateRoutine(id: string, input: Partial<CreateWorkoutRoutineInput>): Promise<WorkoutRoutine> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_routines')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WorkoutRoutine
}

export async function archiveRoutine(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('workout_routines')
    .update({ archived: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteRoutine(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('workout_routines').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addExercise(input: CreateRoutineExerciseInput): Promise<RoutineExercise> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({ ...input, order_index: input.order_index ?? 0 })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as RoutineExercise
}

export async function updateExercise(id: string, input: Partial<Omit<CreateRoutineExerciseInput, 'routine_id'>>): Promise<RoutineExercise> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('routine_exercises')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as RoutineExercise
}

export async function deleteExercise(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('routine_exercises').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
