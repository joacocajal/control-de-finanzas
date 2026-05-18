'use client'

import { useState, useCallback } from 'react'
import * as MilestoneService from '@/services/skill-milestones.service'
import type { SkillMilestone, CreateSkillMilestoneInput } from '@/types/database.types'

export function useSkillMilestones() {
  const [milestones, setMilestones] = useState<SkillMilestone[]>([])
  const [loading, setLoading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<{ title: string; description: string }[]>([])

  const load = useCallback(async (skillId: string) => {
    setLoading(true)
    try {
      const data = await MilestoneService.getMilestones(skillId)
      setMilestones(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (input: CreateSkillMilestoneInput): Promise<SkillMilestone> => {
    const m = await MilestoneService.createMilestone(input)
    setMilestones((prev) => [...prev, m].sort((a, b) => a.order_index - b.order_index))
    return m
  }, [])

  const adoptSuggestions = useCallback(async (
    skillId: string,
    selected: { title: string; description: string }[]
  ): Promise<void> => {
    const baseOrder = milestones.length
    const toInsert = selected.map((s, i) => ({
      title: s.title,
      description: s.description || null,
      order_index: baseOrder + i,
      created_by: 'ai' as const,
    }))
    const created = await MilestoneService.createMilestoneBatch(skillId, toInsert)
    setMilestones((prev) => [...prev, ...created].sort((a, b) => a.order_index - b.order_index))
    setSuggestions([])
  }, [milestones.length])

  const toggle = useCallback(async (id: string, completed: boolean): Promise<void> => {
    const updated = await MilestoneService.toggleMilestone(id, completed)
    setMilestones((prev) => prev.map((m) => (m.id === id ? updated : m)))
  }, [])

  const reorder = useCallback(async (ordered: SkillMilestone[]): Promise<void> => {
    const updates = ordered.map((m, i) => ({ id: m.id, order_index: i }))
    setMilestones(ordered.map((m, i) => ({ ...m, order_index: i })))
    await MilestoneService.reorderMilestones(updates)
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    await MilestoneService.deleteMilestone(id)
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const suggestWithAI = useCallback(async (payload: {
    skill_name: string
    skill_description?: string | null
    skill_category?: string | null
    existing_milestones: string[]
    user_level?: string
    user_id: string
  }) => {
    setSuggesting(true)
    try {
      const result = await MilestoneService.suggestMilestonesFromN8n(payload)
      setSuggestions(result)
    } finally {
      setSuggesting(false)
    }
  }, [])

  const clearSuggestions = useCallback(() => setSuggestions([]), [])

  return {
    milestones,
    loading,
    suggesting,
    suggestions,
    load,
    create,
    adoptSuggestions,
    toggle,
    reorder,
    remove,
    suggestWithAI,
    clearSuggestions,
  }
}
