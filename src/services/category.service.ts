import { createClient } from '@/lib/supabase/client'
import type { Category, CreateCategoryInput } from '@/types/database.types'

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, user_id: user.id, is_default: false })
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No se recibió respuesta al crear la categoría')
  return data as Category
}
