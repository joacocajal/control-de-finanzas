import { createClient } from '@/lib/supabase/client'
import type { Transaction, TransactionWithCategory, CreateTransactionInput } from '@/types/database.types'
import { getMonthRange } from '@/lib/utils/calculations'

export async function getTransactions(walletId?: string | null): Promise<TransactionWithCategory[]> {
  const supabase = createClient()
  const { start, end } = getMonthRange()

  let query = supabase
    .from('transactions')
    .select('*, categories(name, color, icon)')
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (walletId) query = query.eq('wallet_id', walletId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as TransactionWithCategory[]
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const payload: Record<string, unknown> = { ...input, user_id: user.id }
  if (!input.wallet_id) delete payload.wallet_id

  const rate = input.exchange_rate
  const isUSD = input.currency === 'USD'

  if (isUSD && rate && rate > 0) {
    payload.amount_ars = input.amount * rate
    payload.amount_usd = input.amount
  } else if (!isUSD && rate && rate > 0) {
    payload.amount_ars = input.amount
    payload.amount_usd = input.amount / rate
  } else {
    payload.amount_ars = input.amount
    payload.amount_usd = null
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
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
