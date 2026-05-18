import { createClient } from '@/lib/supabase/client'
import type {
  SkillResource,
  CreateSkillResourceInput,
  UpdateSkillResourceInput,
} from '@/types/database.types'

export async function getResources(skillId: string): Promise<SkillResource[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('skill_resources')
    .select('*')
    .eq('user_id', user.id)
    .eq('skill_id', skillId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as SkillResource[]
}

export async function createResource(input: CreateSkillResourceInput): Promise<SkillResource> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('skill_resources')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SkillResource
}

export async function updateResource(id: string, input: UpdateSkillResourceInput): Promise<SkillResource> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('skill_resources')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SkillResource
}

export async function markConsumed(id: string, rating: number, notes?: string): Promise<SkillResource> {
  return updateResource(id, {
    status: 'consumido',
    rating,
    notes: notes ?? null,
    finished_at: new Date().toISOString(),
  })
}

export async function deleteResource(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('skill_resources').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
