'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import type { ChatMessage, AIChatContext } from '@/types/database.types'

interface ChatWidgetProps {
  context: AIChatContext
}

const SUGGESTED = [
  '¿Cuánto gasté este mes?',
  '¿Cómo puedo ahorrar más?',
  '¿En qué categoría gasto más?',
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-gray-500"
          style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

export function ChatWidget({ context }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `¡Hola! 👋 Soy tu asistente financiero. Este mes tenés un balance de **${formatCurrency(context.balance)}** con ingresos de ${formatCurrency(context.totalIncome)} y gastos de ${formatCurrency(context.totalExpenses)}. ¿En qué te puedo ayudar?`,
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text?: string) {
    const message = (text ?? input).trim()
    if (!message || streaming) return

    setInput('')
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: message }
    const assistantId = (Date.now() + 1).toString()

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      })

      if (!res.ok || !res.body) throw new Error('Error de conexión')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: '⚠️ No pude conectarme. Verificá tu API key de Gemini en `.env.local`.' }
            : m
        )
      )
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#09090f] border-l border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/20">
            <Bot size={16} className="text-white" />
          </div>
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Asistente Financiero</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Sparkles size={10} className="text-violet-400" />
            <p className="text-[10px] text-gray-500">Powered by Gemini</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2.5 animate-fade-up',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
                msg.role === 'user'
                  ? 'bg-indigo-600'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-600'
              )}
            >
              {msg.role === 'user' ? (
                <User size={13} className="text-white" />
              ) : (
                <Bot size={13} className="text-white" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-gray-800/80 text-gray-200 rounded-tl-sm border border-white/[0.04]'
              )}
            >
              {msg.content === '' && msg.role === 'assistant' ? (
                <TypingDots />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions (shown only at start) */}
      {messages.length <= 1 && !streaming && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => void handleSend(q)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-gray-400 hover:border-indigo-500/30 hover:text-indigo-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) void handleSend() }}
            placeholder="Preguntá sobre tus finanzas..."
            disabled={streaming}
            className="flex-1 rounded-xl border border-white/5 bg-gray-800/60 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || streaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md hover:shadow-indigo-500/20"
            aria-label="Enviar"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
