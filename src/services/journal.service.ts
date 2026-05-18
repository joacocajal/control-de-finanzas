import { createClient } from '@/lib/supabase/client'
import type { JournalEntry, UpsertJournalEntryInput, DailySnapshot } from '@/types/database.types'

export async function getMonthEntries(year: number, month: number): Promise<JournalEntry[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to   = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as JournalEntry[]
}

export async function getEntryByDate(date: string): Promise<JournalEntry | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', date)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as JournalEntry | null
}

export async function upsertEntry(date: string, input: UpsertJournalEntryInput): Promise<JournalEntry> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      { ...input, user_id: user.id, entry_date: date },
      { onConflict: 'user_id,entry_date' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as JournalEntry
}

export async function getDailySnapshot(date: string): Promise<DailySnapshot> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { workouts: [], calories: 0, protein: 0, money_spent: 0, skills_studied: [], water_liters: 0 }

  const dayStart = `${date}T00:00:00`
  const dayEnd   = `${date}T23:59:59`

  const [workoutsRes, foodRes, transRes, waterRes, studyRes] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('routine_name_snapshot, duration_minutes')
      .eq('user_id', user.id)
      .gte('started_at', dayStart)
      .lte('started_at', dayEnd)
      .not('finished_at', 'is', null),

    supabase
      .from('food_logs')
      .select('calories, protein')
      .eq('user_id', user.id)
      .gte('consumed_at', dayStart)
      .lte('consumed_at', dayEnd),

    supabase
      .from('transactions')
      .select('amount, amount_ars')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('transaction_date', date),

    supabase
      .from('water_logs')
      .select('liters')
      .eq('user_id', user.id)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd),

    supabase
      .from('aprendizaje_logs')
      .select('horas_estudio, aprendizaje_skills!inner(nombre_habilidad)')
      .eq('fecha', date),
  ])

  const workouts = (workoutsRes.data ?? []).map(w => ({
    name: w.routine_name_snapshot,
    duration_minutes: w.duration_minutes,
  }))

  const calories    = (foodRes.data ?? []).reduce((s, f) => s + (f.calories ?? 0), 0)
  const protein     = (foodRes.data ?? []).reduce((s, f) => s + (f.protein  ?? 0), 0)
  const money_spent = (transRes.data ?? []).reduce((s, t) => s + (t.amount_ars ?? t.amount ?? 0), 0)
  const water_liters = (waterRes.data ?? []).reduce((s, w) => s + (w.liters ?? 0), 0)

  const skills_studied = (studyRes.data ?? []).map(s => ({
    name: (s.aprendizaje_skills as unknown as { nombre_habilidad: string } | null)?.nombre_habilidad ?? '—',
    hours: s.horas_estudio,
  }))

  return { workouts, calories: Math.round(calories), protein: Math.round(protein), money_spent, skills_studied, water_liters }
}
