import { createClient } from '@/lib/supabase/client'
import type {
  GymRutina,
  GymEjercicio,
  GymSerieLog,
  GymPR,
  CreateGymRutinaInput,
  CreateGymEjercicioInput,
  CreateGymSerieLogInput,
} from '@/types/database.types'

// ─── Rutinas ─────────────────────────────────────────────────

export async function getRutinas(): Promise<GymRutina[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gym_rutinas')
    .select('*')
    .order('creado_en', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as GymRutina[]
}

export async function crearRutina(input: CreateGymRutinaInput): Promise<GymRutina> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('gym_rutinas')
    .insert({ ...input, perfil_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as GymRutina
}

export async function eliminarRutina(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('gym_rutinas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Ejercicios ───────────────────────────────────────────────

export async function getEjerciciosByRutina(rutinaId: string): Promise<GymEjercicio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gym_ejercicios')
    .select('*')
    .eq('rutina_id', rutinaId)
  if (error) throw new Error(error.message)
  return (data ?? []) as GymEjercicio[]
}

export async function crearEjercicio(input: CreateGymEjercicioInput): Promise<GymEjercicio> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gym_ejercicios')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as GymEjercicio
}

export async function eliminarEjercicio(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('gym_ejercicios').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Series / Logs ────────────────────────────────────────────

export async function registrarSerieLog(input: CreateGymSerieLogInput): Promise<GymSerieLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gym_series_logs')
    .insert({ ...input, completado: true })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as GymSerieLog
}

export async function getSeriesHoy(ejercicioId: string): Promise<GymSerieLog[]> {
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('gym_series_logs')
    .select('*')
    .eq('ejercicio_id', ejercicioId)
    .eq('fecha', hoy)
    .order('numero_serie')
  if (error) throw new Error(error.message)
  return (data ?? []) as GymSerieLog[]
}

// ─── PRs ──────────────────────────────────────────────────────

export async function getPRs(): Promise<GymPR[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gym_prs')
    .select('*')
    .order('fecha', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as GymPR[]
}

export async function actualizarPR(tipoEjercicio: string, nuevoValor: number): Promise<GymPR> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Buscar PR existente para este ejercicio
  const { data: existing } = await supabase
    .from('gym_prs')
    .select('*')
    .eq('perfil_id', user.id)
    .eq('tipo_ejercicio', tipoEjercicio)
    .single()

  // Solo actualizar si el nuevo valor supera el récord actual
  if (existing && nuevoValor <= existing.valor_record) {
    return existing as GymPR
  }

  // Eliminar el anterior y registrar el nuevo (permite múltiples tipos)
  if (existing) {
    await supabase.from('gym_prs').delete().eq('id', existing.id)
  }

  const { data, error } = await supabase
    .from('gym_prs')
    .insert({ perfil_id: user.id, tipo_ejercicio: tipoEjercicio, valor_record: nuevoValor })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as GymPR
}
