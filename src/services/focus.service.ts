import { createClient } from '@/lib/supabase/client'
import type { FocusSession, FocusStats } from '@/types/database.types'

/** Sesión activa (sin terminar), si existe. */
export async function getActiveFocus(): Promise<FocusSession | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as FocusSession | null
}

export async function startFocus(label: string | null): Promise<FocusSession> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({ user_id: user.id, label: label?.trim() || null })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as FocusSession
}

export async function endFocus(id: string, durationSeconds: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('focus_sessions')
    .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** Descarta una sesión activa (sin guardarla en el historial). */
export async function discardFocus(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('focus_sessions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getRecentFocus(limit = 20): Promise<FocusSession[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as FocusSession[]
}

export async function getFocusStats(): Promise<FocusStats> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { totalSessions: 0, totalSeconds: 0, avgSeconds: 0, todaySeconds: 0, bestSeconds: 0 }

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration_seconds, started_at')
    .eq('user_id', user.id)
    .not('ended_at', 'is', null)

  if (error) throw new Error(error.message)
  const rows = (data ?? []) as { duration_seconds: number | null; started_at: string }[]

  const today = new Date(); today.setHours(0, 0, 0, 0)
  let totalSeconds = 0, todaySeconds = 0, bestSeconds = 0
  for (const r of rows) {
    const d = r.duration_seconds ?? 0
    totalSeconds += d
    if (d > bestSeconds) bestSeconds = d
    if (new Date(r.started_at) >= today) todaySeconds += d
  }
  const totalSessions = rows.length
  return {
    totalSessions,
    totalSeconds,
    avgSeconds: totalSessions ? Math.round(totalSeconds / totalSessions) : 0,
    todaySeconds,
    bestSeconds,
  }
}
