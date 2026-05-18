'use client'

import { useState, useCallback, useRef } from 'react'
import * as AgentService from '@/services/agent.service'
import type { AgentConversation, AgentMessage, AgentNotification } from '@/types/database.types'

export function useAgent() {
  const [conversations, setConversations] = useState<AgentConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<AgentConversation | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [thinking, setThinking] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true)
    try {
      const convs = await AgentService.getConversations()
      setConversations(convs)
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  const selectConversation = useCallback(async (conv: AgentConversation) => {
    setActiveConversation(conv)
    setLoadingMessages(true)
    try {
      const msgs = await AgentService.getMessages(conv.id)
      setMessages(msgs)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const newConversation = useCallback(() => {
    setActiveConversation(null)
    setMessages([])
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    await AgentService.deleteConversation(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversation?.id === id) newConversation()
  }, [activeConversation, newConversation])

  const sendMessage = useCallback(async (content: string) => {
    setError(null)

    // Get or create conversation
    let conv = activeConversation
    let convMessages = messages
    if (!conv) {
      conv = await AgentService.createConversation(content)
      setActiveConversation(conv)
      setConversations((prev) => [conv!, ...prev])
      convMessages = []
    }

    // Get userId if needed
    if (!userIdRef.current) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userIdRef.current = user?.id ?? null
    }

    // Insert user message
    const userMsg = await AgentService.insertUserMessage(conv.id, content)
    setMessages((prev) => [...prev, userMsg])

    // Call n8n webhook
    setThinking(true)
    try {
      const history = convMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const { response, metadata } = await AgentService.callAgentWebhook({
        user_id: userIdRef.current ?? '',
        conversation_id: conv.id,
        message: content,
        history,
      })

      const assistantMsg = await AgentService.insertAssistantMessage(conv.id, response, metadata)
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al contactar el agente')
    } finally {
      setThinking(false)
    }
  }, [activeConversation, messages])

  return {
    conversations,
    activeConversation,
    messages,
    thinking,
    loadingConversations,
    loadingMessages,
    error,
    loadConversations,
    selectConversation,
    newConversation,
    deleteConversation,
    sendMessage,
  }
}

export function useAgentNotifications() {
  const [notifications, setNotifications] = useState<AgentNotification[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await AgentService.getNotifications()
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    await AgentService.markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }, [])

  const markAllRead = useCallback(async () => {
    await AgentService.markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return { notifications, loading, unreadCount, load, markRead, markAllRead }
}
