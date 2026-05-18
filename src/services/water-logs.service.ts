import { createClient } from '@/lib/supabase/client'
import type { WaterLog, CreateWaterLogInput } from '@/types/database.types'

export async function getWaterByDate(date: string): Promise<{ logs: WaterLog[]; totalLiters: number }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { logs: [], totalLiters: 0 }

  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', dayStart)
    .lte('logged_at', dayEnd)
    .order('logged_at', { ascending: true })

  if (error) throw new Error(error.message)

  const logs = (data ?? []) as WaterLog[]
  const totalLiters = logs.reduce((sum, l) => sum + l.liters, 0)
  return { logs, totalLiters: Math.round(totalLiters * 100) / 100 }
}

export async function logWater(input: CreateWaterLogInput): Promise<WaterLog> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('water_logs')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WaterLog
}

export async function deleteWaterLog(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('water_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getWeeklyWater(weekStart: string): Promise<Array<{ date: string; liters: number }>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('water_logs')
    .select('logged_at, liters')
    .eq('user_id', user.id)
    .gte('logged_at', start.toISOString())
    .lte('logged_at', end.toISOString())

  if (error) throw new Error(error.message)

  const byDay: Record<string, number> = {}
  for (const row of data ?? []) {
    const d = row.logged_at.slice(0, 10)
    byDay[d] = (byDay[d] ?? 0) + row.liters
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    return { date: key, liters: Math.round((byDay[key] ?? 0) * 100) / 100 }
  })
}
