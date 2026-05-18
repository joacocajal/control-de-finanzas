import { createClient } from '@/lib/supabase/client'
import { toISODate } from '@/lib/utils/formatters'
import type { ExchangeRate } from '@/types/database.types'

export async function getLatestRate(): Promise<ExchangeRate | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('source', 'manual')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as ExchangeRate | null
}

export async function saveRate(ars_to_usd: number): Promise<ExchangeRate> {
  const supabase = createClient()
  const date = toISODate()
  const { data, error } = await supabase
    .from('exchange_rates')
    .upsert({ date, ars_to_usd, source: 'manual' }, { onConflict: 'date,source' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ExchangeRate
}
