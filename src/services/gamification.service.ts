import { createClient } from '@/lib/supabase/client'
import type {
  ProfileGamificado,
  HabilidadStat,
  MisionDiaria,
  CreateMisionInput,
} from '@/types/database.types'

export async function getProfileGamificado(): Promise<ProfileGamificado | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, created_at, updated_at, nivel_global, xp_global, racha_dias, ultima_actividad')
    .eq('id', user.id)
    .single()

  return data as ProfileGamificado | null
}

export async function getHabilidades(): Promise<HabilidadStat[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('habilidades_stats')
    .select('*')
    .eq('perfil_id', user.id)
    .order('categoria')

  return (data ?? []) as HabilidadStat[]
}

export async function getMisionesHoy(): Promise<MisionDiaria[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const hoy = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('misiones_diarias')
    .select('*')
    .eq('perfil_id', user.id)
    .eq('fecha', hoy)
    .order('estado')
    .order('dificultad')

  return (data ?? []) as MisionDiaria[]
}

export async function completarMision(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('misiones_diarias')
    .update({ estado: 'completada' })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function crearMision(input: CreateMisionInput): Promise<MisionDiaria> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('misiones_diarias')
    .insert({
      ...input,
      perfil_id: user.id,
      xp_penalizacion: Math.floor(input.xp_recompensa / 2),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as MisionDiaria
}
