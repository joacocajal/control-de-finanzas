import { createClient } from '@/lib/supabase/client'
import type {
  RoutineTemplate,
  RoutineTemplateExercise,
  RoutineTemplateDay,
  RoutineTemplateWithDays,
  WorkoutRoutine,
  WorkoutCategory,
} from '@/types/database.types'

export async function getTemplates(): Promise<RoutineTemplate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('routine_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as RoutineTemplate[]
}

export async function getTemplateWithDays(id: string): Promise<RoutineTemplateWithDays | null> {
  const supabase = createClient()

  const [{ data: tmpl, error: te }, { data: exs, error: ee }] = await Promise.all([
    supabase.from('routine_templates').select('*').eq('id', id).single(),
    supabase
      .from('routine_template_exercises')
      .select('*')
      .eq('template_id', id)
      .order('day_order')
      .order('exercise_order'),
  ])

  if (te || !tmpl) return null
  if (ee) return null

  const dayMap = new Map<string, RoutineTemplateDay>()
  for (const ex of exs ?? []) {
    const e = ex as RoutineTemplateExercise
    if (!dayMap.has(e.day_label)) {
      dayMap.set(e.day_label, { day_label: e.day_label, day_order: e.day_order, exercises: [] })
    }
    dayMap.get(e.day_label)!.exercises.push(e)
  }

  return {
    ...(tmpl as RoutineTemplate),
    days: Array.from(dayMap.values()).sort((a, b) => a.day_order - b.day_order),
  }
}

export async function adoptTemplate(templateId: string): Promise<WorkoutRoutine[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const tmpl = await getTemplateWithDays(templateId)
  if (!tmpl) throw new Error('Plantilla no encontrada')

  const created: WorkoutRoutine[] = []

  for (const day of tmpl.days) {
    const routineName = tmpl.days.length === 1
      ? tmpl.name
      : `${tmpl.name} — ${day.day_label}`

    const { data: routine, error: re } = await supabase
      .from('workout_routines')
      .insert({
        user_id: user.id,
        name: routineName,
        category: tmpl.category as WorkoutCategory,
        description: null,
        adopted_from_template_id: templateId,
      })
      .select()
      .single()
    if (re) throw new Error(re.message)

    if (day.exercises.length > 0) {
      const { error: ee } = await supabase
        .from('routine_exercises')
        .insert(
          day.exercises.map((ex, idx) => ({
            routine_id: (routine as WorkoutRoutine).id,
            exercise_name: ex.exercise_name,
            order_index: idx,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            notes: ex.notes,
          }))
        )
      if (ee) throw new Error(ee.message)
    }

    created.push(routine as WorkoutRoutine)
  }

  return created
}
