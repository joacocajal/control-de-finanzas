'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bot,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  RotateCcw,
  ChevronRight,
  Menu,
  X,
  Database,
  Edit3,
  PlusCircle,
  MinusCircle,
  AlertCircle,
} from 'lucide-react'
import { useAgent } from '@/hooks/useAgent'
import * as AgentService from '@/services/agent.service'
import type { AgentActionsLog, AgentMessage } from '@/types/database.types'

const ACCENT = '#818cf8'

const SUGGESTIONS = [
  'Analiza mis finanzas de este mes',
  'Crea una misión de gym para hoy',
  'Cuánto gasté en comida esta semana',
  'Agrega un log de estudio de 1 hora',
]

// ─── Timeline item ─────────────────────────────────────────────

type TimelineItem =
  | { kind: 'message'; data: AgentMessage }
  | { kind: 'action'; data: AgentActionsLog }

function buildTimeline(messages: AgentMessage[], actions: AgentActionsLog[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...messages.map((m) => ({ kind: 'message' as const, data: m })),
    ...actions.map((a) => ({ kind: 'action' as const, data: a })),
  ]
  return items.sort((a, b) => a.data.created_at.localeCompare(b.data.created_at))
}

// ─── Action card ───────────────────────────────────────────────

const ACTION_ICONS = {
  insert: PlusCircle,
  update: Edit3,
  delete: MinusCircle,
}

const ACTION_COLORS = {
  insert: '#34d399',
  update: '#fbbf24',
  delete: '#f87171',
}

function ActionCard({
  action,
  onRevert,
}: {
  action: AgentActionsLog
  onRevert: (id: string) => Promise<void>
}) {
  const [reverting, setReverting] = useState(false)
  const Icon = ACTION_ICONS[action.action_type]
  const color = ACTION_COLORS[action.action_type]

  async function handleRevert() {
    setReverting(true)
    try {
      await onRevert(action.id)
    } finally {
      setReverting(false)
    }
  }

  const payloadStr = JSON.stringify(action.payload, null, 2)
  const isReverted = action.status === 'reverted'

  return (
    <div
      className="mx-auto my-1 max-w-[520px] rounded-xl border px-4 py-3 text-sm"
      style={{
        background: 'rgba(255,255,255,0.025)',
        borderColor: `${color}30`,
        opacity: isReverted ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}
        >
          <Icon size={11} style={{ color }} />
        </div>
        <span className="font-medium" style={{ color }}>
          {action.action_type.toUpperCase()}
        </span>
        <span style={{ color: 'var(--text-2)' }}>en</span>
        <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)' }}>
          {action.target_table}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <Database size={10} style={{ color: 'var(--text-2)' }} />
          <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>
            DB
          </span>
        </div>
      </div>

      {action.reasoning && (
        <p className="text-[12px] mb-2" style={{ color: 'var(--text-2)' }}>
          {action.reasoning}
        </p>
      )}

      <pre
        className="text-[11px] rounded-lg p-2 overflow-x-auto mb-2 font-mono"
        style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-1)' }}
      >
        {payloadStr.length > 300 ? payloadStr.slice(0, 300) + '\n...' : payloadStr}
      </pre>

      {isReverted ? (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-2)' }}>
          <RotateCcw size={11} />
          <span>Revertido</span>
        </div>
      ) : (
        <button
          onClick={() => void handleRevert()}
          disabled={reverting}
          className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg transition-colors"
          style={{
            background: reverting ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
            color: reverting ? 'var(--text-2)' : 'var(--text-1)',
            border: '1px solid var(--line)',
          }}
        >
          <RotateCcw size={11} className={reverting ? 'animate-spin' : ''} />
          {reverting ? 'Revirtiendo...' : 'Revertir'}
        </button>
      )}
    </div>
  )
}

// ─── Message bubble ────────────────────────────────────────────

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-sm text-[13.5px] leading-relaxed"
          style={{ background: ACCENT, color: '#fff' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-3 max-w-[85%]">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44` }}
      >
        <Bot size={13} style={{ color: ACCENT }} />
      </div>
      <div
        className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-[13.5px] leading-relaxed flex-1 min-w-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-[13px]">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold" style={{ color: ACCENT }}>{children}</strong>,
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-')
              if (isBlock) {
                return (
                  <pre className="my-2 p-3 rounded-lg overflow-x-auto text-[12px] font-mono" style={{ background: 'rgba(0,0,0,0.4)', color: '#a5b4fc' }}>
                    <code>{children}</code>
                  </pre>
                )
              }
              return (
                <code className="px-1 py-0.5 rounded text-[12px] font-mono" style={{ background: 'rgba(129,140,248,0.15)', color: ACCENT }}>
                  {children}
                </code>
              )
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 pl-3 my-2 italic" style={{ borderColor: ACCENT, color: 'var(--text-2)' }}>
                {children}
              </blockquote>
            ),
            h1: ({ children }) => <h1 className="text-[16px] font-bold mb-1 mt-2" style={{ color: 'var(--text-0)' }}>{children}</h1>,
            h2: ({ children }) => <h2 className="text-[14px] font-semibold mb-1 mt-2" style={{ color: 'var(--text-0)' }}>{children}</h2>,
            h3: ({ children }) => <h3 className="text-[13px] font-semibold mb-1 mt-1.5" style={{ color: 'var(--text-1)' }}>{children}</h3>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

// ─── Thinking indicator ────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 mb-3">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44` }}
      >
        <Bot size={13} style={{ color: ACCENT }} />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: ACCENT, animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Conversation list item ────────────────────────────────────

function ConvItem({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: { id: string; title: string | null; updated_at: string }
  active: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onSelect}
      className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
      style={{
        background: active ? `${ACCENT}18` : 'transparent',
        border: `1px solid ${active ? `${ACCENT}44` : 'transparent'}`,
      }}
    >
      <MessageSquare size={13} style={{ color: active ? ACCENT : 'var(--text-2)', flexShrink: 0 }} />
      <span
        className="flex-1 text-[12.5px] truncate"
        style={{ color: active ? 'var(--text-0)' : 'var(--text-1)' }}
      >
        {conv.title ?? 'Nueva conversación'}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
        style={{ color: 'var(--text-2)' }}
        aria-label="Eliminar"
      >
        <Trash2 size={11} />
      </button>
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────

export default function AgentePage() {
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

  const [input, setInput] = useState('')
  const [actions, setActions] = useState<AgentActionsLog[]>([])
  const [revertError, setRevertError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (activeConversation) {
      AgentService.getActionsLog(activeConversation.id)
        .then(setActions)
        .catch(() => setActions([]))
    } else {
      setActions([])
    }
  }, [activeConversation, messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, actions, thinking])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || thinking) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMobileSidebarOpen(false)
    await sendMessage(trimmed)
  }, [input, thinking, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void handleSend()
      }
    },
    [handleSend]
  )

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const handleRevert = useCallback(async (actionId: string) => {
    setRevertError(null)
    try {
      await AgentService.revertAction(actionId)
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: 'reverted' as const } : a))
      )
    } catch (e) {
      setRevertError(e instanceof Error ? e.message : 'Error al revertir')
    }
  }, [])

  const timeline = buildTimeline(messages, actions)
  const isEmpty = timeline.length === 0 && !thinking && !loadingMessages

  return (
    <div
      className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-5 sm:-mt-6 flex"
      style={{ height: 'calc(100dvh - 60px)' }}
    >
      {/* ── Sidebar overlay (mobile) ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Left sidebar ── */}
      <aside
        className="fixed lg:relative z-50 lg:z-auto h-full flex flex-col transition-transform duration-300"
        style={{
          width: 260,
          transform: mobileSidebarOpen ? 'translateX(0)' : undefined,
          background: 'rgba(7,9,15,0.65)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid var(--line)',
          ...(mobileSidebarOpen
            ? {}
            : { transform: 'translateX(-100%)' }),
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .agent-sidebar { transform: translateX(0) !important; }
          }
        `}</style>
        <div className="agent-sidebar h-full flex flex-col" style={{ transform: mobileSidebarOpen ? 'translateX(0)' : undefined }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
              Conversaciones
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { newConversation(); setMobileSidebarOpen(false) }}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                style={{ color: ACCENT }}
                title="Nueva conversación"
              >
                <Plus size={15} />
              </button>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06]"
                style={{ color: 'var(--text-2)' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {loadingConversations ? (
              <div className="px-3 py-2 text-[12px]" style={{ color: 'var(--text-2)' }}>
                Cargando...
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <MessageSquare size={24} className="mx-auto mb-2" style={{ color: 'var(--text-2)' }} />
                <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>
                  Sin conversaciones aún
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  active={activeConversation?.id === conv.id}
                  onSelect={() => {
                    void selectConversation(conv)
                    setMobileSidebarOpen(false)
                  }}
                  onDelete={(e) => {
                    e.stopPropagation()
                    void deleteConversation(conv.id)
                  }}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]" style={{ background: 'var(--bg-0)' }}>
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 sm:px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06]"
            style={{ color: 'var(--text-1)' }}
          >
            <Menu size={16} />
          </button>

          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44` }}
          >
            <Bot size={14} style={{ color: ACCENT }} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-0)' }}>
              {activeConversation?.title ?? 'Agente'}
            </h1>
            <p className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
              Ascend AI — conectado a tu data
            </p>
          </div>

          {activeConversation && (
            <button
              onClick={() => void deleteConversation(activeConversation.id)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--text-2)' }}
              title="Borrar conversación"
            >
              <Trash2 size={14} />
            </button>
          )}

          <button
            onClick={newConversation}
            className="hidden sm:flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl transition-colors hover:bg-white/[0.06]"
            style={{ color: ACCENT, border: `1px solid ${ACCENT}44` }}
          >
            <Plus size={13} />
            Nueva
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: ACCENT, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}33` }}
              >
                <Bot size={28} style={{ color: ACCENT }} />
              </div>
              <div>
                <h2 className="text-[18px] font-bold mb-1" style={{ color: 'var(--text-0)' }}>
                  ¿Qué necesitás hoy?
                </h2>
                <p className="text-[13px] max-w-[340px]" style={{ color: 'var(--text-2)' }}>
                  Puedo analizar tus finanzas, crear misiones, registrar entrenamientos y más.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-[420px]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textareaRef.current?.focus() }}
                    className="flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-xl transition-colors hover:bg-white/[0.06]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-1)' }}
                  >
                    <ChevronRight size={11} style={{ color: ACCENT }} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {timeline.map((item) =>
                item.kind === 'message' ? (
                  <MessageBubble key={item.data.id} message={item.data} />
                ) : (
                  <ActionCard
                    key={item.data.id}
                    action={item.data}
                    onRevert={handleRevert}
                  />
                )
              )}
              {thinking && <ThinkingIndicator />}
            </>
          )}

          {revertError && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] mb-3"
              style={{ background: '#7f1d1d33', border: '1px solid #f8717144', color: '#fca5a5' }}
            >
              <AlertCircle size={13} />
              {revertError}
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] mb-3"
              style={{ background: '#7f1d1d33', border: '1px solid #f8717144', color: '#fca5a5' }}
            >
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 sm:px-6 py-4" style={{ borderTop: '1px solid var(--line)' }}>
          <div
            className="flex items-end gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Preguntá o pedí algo..."
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-[13.5px] leading-relaxed"
              style={{
                color: 'var(--text-0)',
                maxHeight: 140,
                scrollbarWidth: 'none',
              }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || thinking}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: input.trim() && !thinking ? ACCENT : 'rgba(255,255,255,0.06)',
                color: input.trim() && !thinking ? '#fff' : 'var(--text-2)',
                cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: 'var(--text-2)' }}>
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  )
}
