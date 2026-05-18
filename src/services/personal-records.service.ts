import { createClient } from '@/lib/supabase/client'
import type { PersonalRecord, CreatePersonalRecordInput, PRCategory } from '@/types/database.types'
import type { WorkoutSet } from '@/types/database.types'

export async function getPersonalRecords(category?: PRCategory): Promise<PersonalRecord[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let q = supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .order('achieved_at', { ascending: false })

  if (category) q = q.eq('category', category)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as PersonalRecord[]
}

export async function getPRByExercise(exerciseName: string): Promise<PersonalRecord | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_name', exerciseName)
    .order('value', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as PersonalRecord
}

export async function createPR(input: CreatePersonalRecordInput): Promise<PersonalRecord> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('personal_records')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PersonalRecord
}

export async function updatePR(id: string, input: Partial<CreatePersonalRecordInput>): Promise<PersonalRecord> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('personal_records')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PersonalRecord
}

export async function deletePR(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('personal_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// After a session finishes, detect new PRs from the sets logged
export async function detectNewPRs(sets: WorkoutSet[], category: PRCategory = 'gym'): Promise<PersonalRecord[]> {
  // Group by exercise_name, find max weight_kg per exercise
  const maxByExercise: Record<string, number> = {}
  for (const s of sets) {
    if (s.weight_kg && s.reps) {
      const current = maxByExercise[s.exercise_name] ?? 0
      if (s.weight_kg > current) maxByExercise[s.exercise_name] = s.weight_kg
    }
  }

  const newPRs: PersonalRecord[] = []

  for (const [exerciseName, value] of Object.entries(maxByExercise)) {
    const existing = await getPRByExercise(exerciseName)
    if (!existing || value > existing.value) {
      const pr = await createPR({
        category,
        exercise_name: exerciseName,
        value,
        unit: 'kg',
        achieved_at: new Date().toISOString().slice(0, 10),
      })
      newPRs.push(pr)
    }
  }

  return newPRs
}
