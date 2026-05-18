import { createClient } from '@/lib/supabase/client'
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@/types/database.types'

export async function getWallets(): Promise<Wallet[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('archived', false)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Wallet[]
}

export async function createWallet(input: CreateWalletInput): Promise<Wallet> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data, error } = await supabase
    .from('wallets')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Wallet
}

export async function updateWallet(id: string, input: UpdateWalletInput): Promise<Wallet> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wallets')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Wallet
}

export async function setDefaultWallet(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  await supabase.from('wallets').update({ is_default: false }).eq('user_id', user.id)
  const { error } = await supabase.from('wallets').update({ is_default: true }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function archiveWallet(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('wallets').update({ archived: true }).eq('id', id)
  if (error) throw new Error(error.message)
}
