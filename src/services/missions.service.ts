import { createClient } from '@/lib/supabase/client'
import {
  calculateLevel,
  checkNewAchievements,
  XP_REWARDS,
} from '@/lib/missions/progression'
import type {
  DailyMission,
  RecurringMission,
  UserProgression,
  UserAchievement,
  CreateDailyMissionInput,
  CreateRecurringMissionInput,
  MissionDifficulty,
} from '@/types/database.types'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Misiones del día ─────────────────────────────────────────

export async function getTodayMissions(): Promise<DailyMission[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('user_id', user.id)
    .eq('mission_date', today())
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as DailyMission[]
}

export async function createCustomMission(input: CreateDailyMissionInput): Promise<DailyMission> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const xp = input.xp_reward ?? XP_REWARDS[input.difficulty]

  const { data, error } = await supabase
    .from('daily_missions')
    .insert({
      user_id: user.id,
      mission_date: input.mission_date ?? today(),
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      difficulty: input.difficulty,
      xp_reward: xp,
      source: input.source ?? 'user',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as DailyMission
}

export async function deleteMission(missionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('daily_missions')
    .delete()
    .eq('id', missionId)
  if (error) throw new Error(error.message)
}

// ─── Completar / descompletar ─────────────────────────────────

export async function completeMission(missionId: string): Promise<{
  progression: UserProgression
  newAchievements: string[]
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Marcar completada
  const { data: mission, error: mErr } = await supabase
    .from('daily_missions')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', missionId)
    .eq('user_id', user.id)
    .select()
    .single()
  if (mErr) throw new Error(mErr.message)

  const xpGained = (mission as DailyMission).xp_reward

  // Cargar progresión actual
  const { data: prog, error: pErr } = await supabase
    .from('user_progression')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (pErr) throw new Error(pErr.message)
  const p = prog as UserProgression

  // Calcular nuevos valores
  const newTotalXp   = p.total_xp + xpGained
  const newLevel     = calculateLevel(newTotalXp)
  const newCompleted = p.total_missions_completed + 1

  // Racha: contar misiones de hoy para ver si llegamos al 70%
  const { data: todayAll } = await supabase
    .from('daily_missions')
    .select('completed')
    .eq('user_id', user.id)
    .eq('mission_date', today())

  const total    = todayAll?.length ?? 0
  const done     = (todayAll?.filter(m => m.completed).length ?? 0)
  const pct      = total > 0 ? done / total : 0

  let newStreak       = p.current_streak
  let newLongest      = p.longest_streak
  let newStreakDate    = p.last_streak_date
  const todayStr      = today()

  if (pct >= 0.7 && p.last_streak_date !== todayStr) {
    newStreak    = p.current_streak + 1
    newLongest   = Math.max(newStreak, p.longest_streak)
    newStreakDate = todayStr
  }

  // Logros ya desbloqueados
  const { data: achData } = await supabase
    .from('user_achievements')
    .select('achievement_key')
    .eq('user_id', user.id)
  const unlocked = (achData ?? []).map((a: { achievement_key: string }) => a.achievement_key)

  const newKeys = checkNewAchievements(newCompleted, newStreak, newLevel, unlocked)

  // Actualizar progresión
  const { data: updatedProg, error: upErr } = await supabase
    .from('user_progression')
    .update({
      total_xp: newTotalXp,
      current_level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_streak_date: newStreakDate,
      total_missions_completed: newCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single()
  if (upErr) throw new Error(upErr.message)

  // Insertar logros nuevos
  if (newKeys.length > 0) {
    await supabase.from('user_achievements').insert(
      newKeys.map(k => ({ user_id: user.id, achievement_key: k }))
    )
  }

  return {
    progression: updatedProg as UserProgression,
    newAchievements: newKeys,
  }
}

export async function uncompleteMission(missionId: string): Promise<UserProgression> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Recuperar xp_reward antes de descompletar
  const { data: mission, error: mErr } = await supabase
    .from('daily_missions')
    .update({ completed: false, completed_at: null })
    .eq('id', missionId)
    .eq('user_id', user.id)
    .select()
    .single()
  if (mErr) throw new Error(mErr.message)

  const xpLost = (mission as DailyMission).xp_reward

  const { data: prog, error: pErr } = await supabase
    .from('user_progression')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (pErr) throw new Error(pErr.message)
  const p = prog as UserProgression

  const newTotalXp   = Math.max(0, p.total_xp - xpLost)
  const newCompleted = Math.max(0, p.total_missions_completed - 1)

  const { data: updated, error: upErr } = await supabase
    .from('user_progression')
    .update({
      total_xp: newTotalXp,
      current_level: calculateLevel(newTotalXp),
      total_missions_completed: newCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single()
  if (upErr) throw new Error(upErr.message)

  return updated as UserProgression
}

// ─── Progresión ───────────────────────────────────────────────

export async function getProgression(): Promise<UserProgression | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_progression')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)

  // Si aún no existe (usuario pre-migration), crearlo
  if (!data) {
    const { data: created, error: cErr } = await supabase
      .from('user_progression')
      .insert({ user_id: user.id })
      .select()
      .single()
    if (cErr) throw new Error(cErr.message)
    return created as UserProgression
  }

  return data as UserProgression
}

export async function getAchievements(): Promise<UserAchievement[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as UserAchievement[]
}

// ─── Modo estricto ────────────────────────────────────────────

export async function toggleStrictMode(): Promise<UserProgression> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: prog, error: pErr } = await supabase
    .from('user_progression')
    .select('strict_mode_enabled, strict_mode_pending_disable_at')
    .eq('user_id', user.id)
    .single()
  if (pErr) throw new Error(pErr.message)

  let patch: Partial<UserProgression>

  if (!prog.strict_mode_enabled) {
    // Activar directo
    patch = {
      strict_mode_enabled: true,
      strict_mode_pending_disable_at: null,
      updated_at: new Date().toISOString(),
    }
  } else {
    // Iniciar cooldown de 24hs — NO desactivar inmediatamente
    const disableAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    patch = {
      strict_mode_pending_disable_at: disableAt,
      updated_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('user_progression')
    .update(patch)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as UserProgression
}

export async function cancelStrictModeDisable(): Promise<UserProgression> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('user_progression')
    .update({ strict_mode_pending_disable_at: null, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as UserProgression
}

export async function checkAndDisableStrictMode(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('user_progression')
    .select('strict_mode_pending_disable_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data?.strict_mode_pending_disable_at) return

  const disableAt = new Date(data.strict_mode_pending_disable_at)
  if (new Date() >= disableAt) {
    await supabase
      .from('user_progression')
      .update({
        strict_mode_enabled: false,
        strict_mode_pending_disable_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
  }
}

export async function isStrictModeBlocking(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: prog } = await supabase
    .from('user_progression')
    .select('strict_mode_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!prog?.strict_mode_enabled) return false

  const { data: missions } = await supabase
    .from('daily_missions')
    .select('completed')
    .eq('user_id', user.id)
    .eq('mission_date', today())

  if (!missions || missions.length === 0) return false

  const allDone = missions.every(m => m.completed)
  return !allDone
}

// ─── Recurrentes ──────────────────────────────────────────────

export async function getRecurringMissions(): Promise<RecurringMission[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('recurring_missions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as RecurringMission[]
}

export async function createRecurringMission(input: CreateRecurringMissionInput): Promise<RecurringMission> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const xp = input.xp_reward ?? XP_REWARDS[input.difficulty]

  const { data, error } = await supabase
    .from('recurring_missions')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      difficulty: input.difficulty,
      xp_reward: xp,
      days_of_week: input.days_of_week ?? [1, 2, 3, 4, 5, 6, 7],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as RecurringMission
}

export async function updateRecurringMission(id: string, patch: Partial<Pick<RecurringMission, 'is_active' | 'days_of_week' | 'title' | 'description' | 'category' | 'difficulty'>>): Promise<RecurringMission> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_missions')
    .update({ ...patch, ...(patch.difficulty ? { xp_reward: XP_REWARDS[patch.difficulty as MissionDifficulty] } : {}) })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as RecurringMission
}

export async function deleteRecurringMission(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('recurring_missions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
