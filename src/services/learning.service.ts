import { createClient } from '@/lib/supabase/client'
import type {
  AprendizajeSkill,
  AprendizajeLog,
  CreateAprendizajeSkillInput,
  CreateAprendizajeLogInput,
} from '@/types/database.types'

// ─── Skills ──────────────────────────────────────────────────

export async function getSkills(): Promise<AprendizajeSkill[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aprendizaje_skills')
    .select('*')
    .order('nombre_habilidad')
  if (error) throw new Error(error.message)
  return (data ?? []) as AprendizajeSkill[]
}

export async function crearSkill(
  input: CreateAprendizajeSkillInput & { suggested_skill_id?: string | null }
): Promise<AprendizajeSkill> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('aprendizaje_skills')
    .insert({ ...input, perfil_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AprendizajeSkill
}

export async function editarSkill(id: string, nombre_habilidad: string): Promise<AprendizajeSkill> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aprendizaje_skills')
    .update({ nombre_habilidad })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AprendizajeSkill
}

export async function eliminarSkill(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('aprendizaje_skills').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Logs de estudio ──────────────────────────────────────────

export async function registrarHorasEstudio(
  input: CreateAprendizajeLogInput,
): Promise<AprendizajeLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aprendizaje_logs')
    .insert({
      skill_id: input.skill_id,
      horas_estudio: input.horas_estudio,
      youtube_url: input.youtube_url ?? null,
      notas: input.notas ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AprendizajeLog
}

export async function getHistorialVideos(skillId: string): Promise<AprendizajeLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aprendizaje_logs')
    .select('*')
    .eq('skill_id', skillId)
    .not('youtube_url', 'is', null)
    .order('fecha', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as AprendizajeLog[]
}

export async function getLogsRecientes(limite = 20): Promise<AprendizajeLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aprendizaje_logs')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(limite)
  if (error) throw new Error(error.message)
  return (data ?? []) as AprendizajeLog[]
}

export async function eliminarLog(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('aprendizaje_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Stats derivadas ──────────────────────────────────────────

export async function getTotalHorasSkill(skillId: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aprendizaje_logs')
    .select('horas_estudio')
    .eq('skill_id', skillId)
  if (error) throw new Error(error.message)
  return (data ?? []).reduce((acc, l) => acc + (l.horas_estudio as number), 0)
}
