import { createClient } from '@/lib/supabase/client'
import type { SuggestedSkill } from '@/types/database.types'

export async function getSuggestedSkills(): Promise<SuggestedSkill[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suggested_skills')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as SuggestedSkill[]
}
