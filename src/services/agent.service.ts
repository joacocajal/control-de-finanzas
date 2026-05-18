import { createClient } from '@/lib/supabase/client'
import type { AgentConversation, AgentMessage, AgentNotification } from '@/types/database.types'

// ─── Conversations ────────────────────────────────────────────

export async function getConversations(): Promise<AgentConversation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return (data ?? []) as AgentConversation[]
}

export async function createConversation(firstMessage: string): Promise<AgentConversation> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const title = firstMessage.slice(0, 60)
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({ user_id: user.id, title })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AgentConversation
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('agent_conversations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Messages ─────────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<AgentMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as AgentMessage[]
}

export async function insertUserMessage(conversationId: string, content: string): Promise<AgentMessage> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('agent_messages')
    .insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AgentMessage
}

export async function insertAssistantMessage(
  conversationId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<AgentMessage> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('agent_messages')
    .insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content, metadata: metadata ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AgentMessage
}

export async function callAgentWebhook(payload: {
  user_id: string
  conversation_id: string
  message: string
  history: { role: string; content: string }[]
}): Promise<{ response: string; metadata?: Record<string, unknown> }> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_AGENT
  if (!webhookUrl) throw new Error('NEXT_PUBLIC_N8N_WEBHOOK_AGENT no configurado')

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`El agente respondió ${res.status}`)
  const json = await res.json() as { response: string; metadata?: Record<string, unknown> }
  return json
}

// ─── Notifications ────────────────────────────────────────────

export async function getNotifications(limit = 10): Promise<AgentNotification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as AgentNotification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('agent_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('agent_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) throw new Error(error.message)
}
