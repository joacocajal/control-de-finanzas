import { createClient } from '@/lib/supabase/client'
import type { SkillMilestone, CreateSkillMilestoneInput } from '@/types/database.types'

export async function getMilestones(skillId: string): Promise<SkillMilestone[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('skill_milestones')
    .select('*')
    .eq('user_id', user.id)
    .eq('skill_id', skillId)
    .order('order_index')

  if (error) throw new Error(error.message)
  return (data ?? []) as SkillMilestone[]
}

export async function createMilestone(input: CreateSkillMilestoneInput): Promise<SkillMilestone> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('skill_milestones')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SkillMilestone
}

export async function createMilestoneBatch(
  skillId: string,
  milestones: { title: string; description?: string | null; order_index: number; created_by: 'user' | 'ai' }[]
): Promise<SkillMilestone[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('skill_milestones')
    .insert(milestones.map((m) => ({ ...m, skill_id: skillId, user_id: user.id })))
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []) as SkillMilestone[]
}

export async function toggleMilestone(id: string, completed: boolean): Promise<SkillMilestone> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('skill_milestones')
    .update({ completed })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SkillMilestone
}

export async function reorderMilestones(updates: { id: string; order_index: number }[]): Promise<void> {
  const supabase = createClient()
  await Promise.all(
    updates.map(({ id, order_index }) =>
      supabase.from('skill_milestones').update({ order_index }).eq('id', id)
    )
  )
}

export async function deleteMilestone(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('skill_milestones').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function suggestMilestonesFromN8n(payload: {
  skill_name: string
  skill_description?: string | null
  skill_category?: string | null
  existing_milestones: string[]
  user_level?: string
  user_id: string
}): Promise<{ title: string; description: string }[]> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_MILESTONES
  if (!webhookUrl) throw new Error('NEXT_PUBLIC_N8N_WEBHOOK_MILESTONES no configurado')

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': payload.user_id,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`n8n respondió ${res.status}`)
  const json = await res.json() as { milestones?: { title: string; description: string }[] }
  return json.milestones ?? []
}
