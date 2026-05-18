'use client'

import { useState, useCallback } from 'react'
import { getTemplates, getTemplateWithDays, adoptTemplate } from '@/services/routine-templates.service'
import type { RoutineTemplate, RoutineTemplateWithDays, WorkoutRoutine } from '@/types/database.types'

export function useRoutineTemplates() {
  const [templates, setTemplates] = useState<RoutineTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTemplates(await getTemplates())
    } finally {
      setLoading(false)
    }
  }, [])

  return { templates, loading, load }
}

export function useTemplateDetail() {
  const [template, setTemplate] = useState<RoutineTemplateWithDays | null>(null)
  const [loading, setLoading] = useState(false)
  const [adopting, setAdopting] = useState(false)

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true)
    try {
      setTemplate(await getTemplateWithDays(id))
    } finally {
      setLoading(false)
    }
  }, [])

  const adopt = useCallback(async (templateId: string): Promise<WorkoutRoutine[]> => {
    setAdopting(true)
    try {
      return await adoptTemplate(templateId)
    } finally {
      setAdopting(false)
    }
  }, [])

  return { template, loading, adopting, loadDetail, adopt }
}
