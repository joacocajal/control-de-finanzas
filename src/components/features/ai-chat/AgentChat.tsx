'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Sparkles, X, Plus, Loader2, Send, Trash2,
  MessageSquare, ChevronLeft, AlertCircle,
} from 'lucide-react'
import { useAgent } from '@/hooks/useAgent'
import type { AgentConversation } from '@/types/database.types'

// ─── Constants ────────────────────────────────────────────────

const ACCENT = '#818cf8'

const QUICK_CHIPS = [
  '¿Cómo voy este mes en finanzas?',
  '¿Qué skill estoy más atrasado?',
  'Armame un menú alto en proteína',
  '¿Cuándo entrené piernas por última vez?',
  'Resumen de mi semana',
]

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// ─── Markdown renderer (simple) ───────────────────────────────

function MarkdownText({ content }: { content: string }) {
  const rendered = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/\n/g, '<br/>')

  return (
    <span
      className="text-[13px] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}

// ─── Message bubble ───────────────────────────────────────────

function MessageBubble({ role, content, time }: { role: string; content: string; time: string }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5"
          style={{ background: `${ACCENT}22`, color: ACCENT }}
        >
          <Sparkles size={13} />
        </div>
      )}
      <div style={{ maxWidth: '78%' }}>
        <div
          className="px-3.5 py-2.5 rounded-2xl"
          style={{
            background: isUser ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isUser ? `${ACCENT}40` : 'var(--line)'}`,
            borderBottomRightRadius: isUser ? 6 : undefined,
            borderBottomLeftRadius: !isUser ? 6 : undefined,
          }}
        >
          {isUser ? (
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-0)' }}>{content}</p>
          ) : (
            <div style={{ color: 'var(--text-0)' }}>
              <MarkdownText content={content} />
            </div>
          )}
        </div>
        <div className="text-[10px] num mt-1 px-1" style={{ color: 'var(--text-2)', textAlign: isUser ? 'right' : 'left' }}>
          {time}
        </div>
      </div>
    </div>
  )
}

// ─── Thinking indicator ───────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex items-start mb-3">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-2"
        style={{ background: `${ACCENT}22`, color: ACCENT }}
      >
        <Sparkles size={13} />
      </div>
      <div
        className="px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', borderBottomLeftRadius: 6 }}
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: ACCENT, animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <span className="text-[12px] ml-1" style={{ color: 'var(--text-2)' }}>Pensando...</span>
        </div>
      </div>
    </div>
  )
}

// ─── Conversation list ────────────────────────────────────────

function ConversationList({
  conversations,
  activeId,
  loading,
  onSelect,
  onDelete,
  onNew,
}: {
  conversations: AgentConversation[]
  activeId: string | null
  loading: boolean
  onSelect: (c: AgentConversation) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="text-[12px] font-semibold" style={{ color: 'var(--text-0)' }}>Conversaciones</div>
        <button
          onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
          style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
        >
          <Plus size={11} />Nueva
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-2)' }} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6 text-[12px]" style={{ color: 'var(--text-2)' }}>
            Sin conversaciones aún
          </div>
        ) : conversations.map((c) => (
          <div
            key={c.id}
            className="group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
            onClick={() => onSelect(c)}
            style={{
              background: activeId === c.id ? `${ACCENT}12` : 'transparent',
              border: `1px solid ${activeId === c.id ? `${ACCENT}30` : 'transparent'}`,
            }}
          >
            <MessageSquare size={13} className="shrink-0" style={{ color: activeId === c.id ? ACCENT : 'var(--text-2)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate" style={{ color: 'var(--text-0)' }}>
                {c.title ?? 'Nueva conversación'}
              </div>
              <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>
                {timeAgo(c.updated_at)}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-2)' }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main chat panel ──────────────────────────────────────────

export function AgentChat() {
  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
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
  } = useAgent()

  useEffect(() => {
    if (open) void loadConversations()
  }, [open, loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await sendMessage(text)
  }, [input, thinking, sendMessage])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Floating button — stacked above FloatingChat (which is at bottom-6) */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg"
        style={{
          background: open ? 'rgba(129,140,248,0.25)' : 'linear-gradient(135deg, #818cf8, #6366f1)',
          border: `1px solid ${open ? `${ACCENT}50` : 'transparent'}`,
          color: '#fff',
          boxShadow: open ? 'none' : '0 8px 32px rgba(99,102,241,0.4)',
        }}
        aria-label="Abrir Ascend AI"
      >
        {open ? <X size={20} /> : <Sparkles size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-40 flex shadow-2xl"
          style={{
            bottom: 152,
            right: 24,
            width: 'min(420px, calc(100vw - 48px))',
            height: 'min(600px, calc(100vh - 120px))',
            background: 'rgba(7,9,15,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--line)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {/* Sidebar history (desktop) */}
          {showHistory && (
            <div
              className="w-48 shrink-0 border-r flex flex-col"
              style={{ borderColor: 'var(--line)' }}
            >
              <ConversationList
                conversations={conversations}
                activeId={activeConversation?.id ?? null}
                loading={loadingConversations}
                onSelect={(c) => { void selectConversation(c); setShowHistory(false) }}
                onDelete={(id) => void deleteConversation(id)}
                onNew={() => { newConversation(); setShowHistory(false) }}
              />
            </div>
          )}

          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
              {showHistory && (
                <button onClick={() => setShowHistory(false)} style={{ color: 'var(--text-2)' }}>
                  <ChevronLeft size={16} />
                </button>
              )}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${ACCENT}22`, color: ACCENT }}
              >
                <Sparkles size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>Ascend AI</div>
                <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>
                  {activeConversation?.title ?? 'Nueva conversación'}
                </div>
              </div>
              <button
                onClick={() => setShowHistory((p) => !p)}
                className="px-2.5 py-1 rounded-lg text-[11px] transition-all"
                style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}
                title="Historial"
              >
                Historial
              </button>
              <button
                onClick={() => { newConversation(); setShowHistory(false) }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-2)' }}
                title="Nueva conversación"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-2)' }} />
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 pb-4">
                  <div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${ACCENT}18`, color: ACCENT }}
                    >
                      <Sparkles size={24} />
                    </div>
                    <div className="text-center">
                      <div className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>Ascend AI</div>
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-2)' }}>Tu asistente personal</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => void sendMessage(chip)}
                        className="px-3 py-1.5 rounded-xl text-[11px] text-left transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--line)',
                          color: 'var(--text-1)',
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      role={m.role}
                      content={m.content}
                      time={timeAgo(m.created_at)}
                    />
                  ))}
                  {thinking && <ThinkingIndicator />}
                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] mb-3" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertCircle size={13} />
                      {error}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribí tu mensaje... (Enter para enviar)"
                  rows={1}
                  disabled={thinking}
                  className="flex-1 bg-transparent text-[13px] resize-none outline-none leading-relaxed"
                  style={{ color: 'var(--text-0)', minHeight: 24, maxHeight: 120 }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || thinking}
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: input.trim() && !thinking ? ACCENT : 'rgba(255,255,255,0.06)',
                    color: input.trim() && !thinking ? '#fff' : 'var(--text-2)',
                  }}
                >
                  {thinking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              <div className="text-[10px] num mt-1.5 text-center" style={{ color: 'var(--text-2)' }}>
                Enter ↵ envía · Shift+Enter nueva línea
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
