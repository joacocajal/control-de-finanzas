import { createClient } from '@/lib/supabase/client'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/database.types'

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('archived', false)
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

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Category
}

export async function archiveCategory(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('categories')
    .update({ archived: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adoptSuggestedCategories(names: string[]): Promise<Category[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const COLORS: Record<string, string> = {
    'Comida': '#f97316', 'Transporte': '#38bdf8', 'Suscripciones': '#8b5cf6',
    'Salud': '#f43f5e', 'Ocio': '#fbbf24', 'Educación': '#34d399',
    'Ropa': '#ec4899', 'Hogar': '#22c55e', 'Impuestos': '#94a3b8',
    'Insumos negocio': '#f97316', 'Marketing': '#3b82f6',
    'Software/Hosting': '#6366f1', 'Honorarios profesionales': '#a78bfa', 'Otros': '#64748b',
  }
  const ICONS: Record<string, string> = {
    'Comida': '🍔', 'Transporte': '🚗', 'Suscripciones': '📱', 'Salud': '❤️',
    'Ocio': '🎮', 'Educación': '📚', 'Ropa': '👕', 'Hogar': '🏠',
    'Impuestos': '📋', 'Insumos negocio': '📦', 'Marketing': '📣',
    'Software/Hosting': '💻', 'Honorarios profesionales': '👔', 'Otros': '📌',
  }

  const rows = names.map(name => ({
    user_id: user.id,
    name,
    color: COLORS[name] ?? '#64748b',
    icon: ICONS[name] ?? null,
    is_default: false,
  }))

  const { data, error } = await supabase
    .from('categories')
    .insert(rows)
    .select()
  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}
