import { createClient } from '@/lib/supabase/client'
import type { Transaction, TransactionWithCategory, CreateTransactionInput } from '@/types/database.types'
import { getMonthRange } from '@/lib/utils/calculations'

export async function getTransactions(): Promise<TransactionWithCategory[]> {
  const supabase = createClient()
  const { start, end } = getMonthRange()

  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name, color, icon)')
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TransactionWithCategory[]
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Transaction
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
