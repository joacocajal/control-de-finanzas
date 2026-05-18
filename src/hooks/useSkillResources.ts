'use client'

import { useState, useCallback } from 'react'
import * as ResourceService from '@/services/skill-resources.service'
import type { SkillResource, CreateSkillResourceInput, UpdateSkillResourceInput } from '@/types/database.types'

export function useSkillResources() {
  const [resources, setResources] = useState<SkillResource[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (skillId: string) => {
    setLoading(true)
    try {
      const data = await ResourceService.getResources(skillId)
      setResources(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (input: CreateSkillResourceInput): Promise<SkillResource> => {
    const resource = await ResourceService.createResource(input)
    setResources((prev) => [resource, ...prev])
    return resource
  }, [])

  const update = useCallback(async (id: string, input: UpdateSkillResourceInput): Promise<SkillResource> => {
    const updated = await ResourceService.updateResource(id, input)
    setResources((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }, [])

  const markConsumed = useCallback(async (id: string, rating: number, notes?: string): Promise<void> => {
    const updated = await ResourceService.markConsumed(id, rating, notes)
    setResources((prev) => prev.map((r) => (r.id === id ? updated : r)))
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    await ResourceService.deleteResource(id)
    setResources((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { resources, loading, load, create, update, markConsumed, remove }
}
