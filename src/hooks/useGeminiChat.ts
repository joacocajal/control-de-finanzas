'use client'

import { useState, useCallback } from 'react'
import type { UIMessage, GeminiContent, ChatAttachment } from '@/types/gemini.types'
import type { AIChatContext } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/formatters'

interface UseGeminiChatReturn {
  messages: UIMessage[]
  streaming: boolean
  sendMessage: (text: string, attachments?: ChatAttachment[]) => Promise<void>
  clearMessages: () => void
}

function buildWelcomeMessage(context: AIChatContext): string {
  return `¡Hola! 👋 Soy tu coach de productividad y finanzas. Este mes tu balance es **${formatCurrency(context.balance)}** — ingresos ${formatCurrency(context.totalIncome)}, gastos ${formatCurrency(context.totalExpenses)}.\n\nPodés preguntarme cualquier cosa, mandarme una captura de Tiempo en Pantalla 📱 para auditar tus hábitos, o grabar un audio 🎙 con tu consulta.`
}

export function useGeminiChat(context: AIChatContext): UseGeminiChatReturn {
  const [messages, setMessages] = useState<UIMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: buildWelcomeMessage(context),
    },
  ])
  const [history, setHistory] = useState<GeminiContent[]>([])
  const [streaming, setStreaming] = useState(false)

  const sendMessage = useCallback(
    async (text: string, attachments: ChatAttachment[] = []) => {
      if (streaming) return

      const userMsg: UIMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        attachments,
      }
      const assistantId = `a-${Date.now() + 1}`
      const assistantMsg: UIMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setStreaming(true)

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            attachments: attachments.map(({ type, mimeType, data }) => ({
              type,
              mimeType,
              data,
            })),
            context,
            history,
          }),
        })

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => 'Error desconocido')
          throw new Error(errText)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          )
        }

        // Commit completed turn to history
        const userParts = [
          { text: text || '' },
          ...attachments.map((a) => ({
            inline_data: { mime_type: a.mimeType, data: a.data },
          })),
        ]
        setHistory((prev) => [
          ...prev,
          { role: 'user' as const, parts: userParts },
          { role: 'model' as const, parts: [{ text: fullResponse }] },
        ])

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        )
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : '⚠️ Error al conectar con el asistente.'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `⚠️ ${msg}`, isStreaming: false }
              : m
          )
        )
      } finally {
        setStreaming(false)
      }
    },
    [streaming, history, context]
  )

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: buildWelcomeMessage(context),
      },
    ])
    setHistory([])
  }, [context])

  return { messages, streaming, sendMessage, clearMessages }
}
