export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / 1000) + 1
}

export function xpToNextLevel(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp)
  return currentLevel * 1000 - totalXp
}

export function levelProgress(totalXp: number): number {
  const currentLevelStart = (calculateLevel(totalXp) - 1) * 1000
  return Math.min(100, ((totalXp - currentLevelStart) / 1000) * 100)
}

export const XP_REWARDS = {
  facil: 10,
  medio: 25,
  dificil: 50,
} as const

export const CATEGORY_ICONS: Record<string, string> = {
  fisico:  '💪',
  mental:  '🧠',
  hogar:   '🏠',
  negocio: '💼',
  custom:  '✨',
}

export const ACHIEVEMENTS = {
  first_mission: { title: '🌱 Primera misión',  desc: 'Completaste tu primera misión' },
  streak_3:      { title: '🔥 3 días de racha', desc: '3 días seguidos completando misiones' },
  streak_7:      { title: '🔥 7 días de racha', desc: 'Una semana entera' },
  streak_30:     { title: '🔥 30 días de racha', desc: 'Un mes completo' },
  level_5:       { title: '⭐ Nivel 5',          desc: 'Llegaste al nivel 5' },
  level_10:      { title: '⭐ Nivel 10',         desc: 'Llegaste al nivel 10' },
  missions_50:   { title: '💯 50 misiones',      desc: '50 misiones completadas en total' },
  missions_100:  { title: '💯 100 misiones',     desc: '100 misiones completadas' },
  missions_500:  { title: '💯 500 misiones',     desc: '500 misiones completadas' },
} as const

export type AchievementKey = keyof typeof ACHIEVEMENTS

export function checkNewAchievements(
  totalMissions: number,
  streak: number,
  level: number,
  alreadyUnlocked: string[]
): AchievementKey[] {
  const earned: AchievementKey[] = []
  const has = (k: AchievementKey) => alreadyUnlocked.includes(k)

  if (totalMissions >= 1   && !has('first_mission')) earned.push('first_mission')
  if (totalMissions >= 50  && !has('missions_50'))   earned.push('missions_50')
  if (totalMissions >= 100 && !has('missions_100'))  earned.push('missions_100')
  if (totalMissions >= 500 && !has('missions_500'))  earned.push('missions_500')
  if (streak >= 3  && !has('streak_3'))  earned.push('streak_3')
  if (streak >= 7  && !has('streak_7'))  earned.push('streak_7')
  if (streak >= 30 && !has('streak_30')) earned.push('streak_30')
  if (level >= 5   && !has('level_5'))   earned.push('level_5')
  if (level >= 10  && !has('level_10'))  earned.push('level_10')

  return earned
}
