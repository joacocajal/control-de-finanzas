'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle, X, Send, Bot, User, Mic, MicOff, Paperclip,
  Sparkles, Trash2, Volume2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGeminiChat } from '@/hooks/useGeminiChat'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import type { AIChatContext } from '@/types/database.types'
import type { ChatAttachment, UIMessage } from '@/types/gemini.types'

// ─── Markdown renderer ───────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, lineIdx) => {
    const segments = line.split(/\*\*(.+?)\*\*/g)
    return (
      <span key={lineIdx}>
        {segments.map((seg, segIdx) =>
          segIdx % 2 === 1 ? (
            <strong key={segIdx} className="font-semibold text-white/90">{seg}</strong>
          ) : seg
        )}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    )
  })
}

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

function MessageBubble({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex gap-2.5 animate-fade-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
        isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-violet-500 to-indigo-600'
      )}>
        {isUser ? <User size={13} className="text-white" /> : <Bot size={13} className="text-white" />}
      </div>

      <div className={cn(
        'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-gray-800/80 text-gray-200 rounded-tl-sm border border-white/[0.04]'
      )}>
        {msg.attachments?.map((a, i) => (
          <div key={i} className="mb-2">
            {a.type === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.previewUrl ?? `data:${a.mimeType};base64,${a.data}`}
                alt={a.name}
                className="max-w-full max-h-48 rounded-lg object-cover border border-white/10"
              />
            )}
            {a.type === 'audio' && (
              <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                <Volume2 size={13} className="text-indigo-300 shrink-0" />
                <span className="text-xs text-gray-300 truncate">{a.name}</span>
              </div>
            )}
          </div>
        ))}
        {msg.content === '' && msg.isStreaming ? (
          <TypingDots />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {renderMarkdown(msg.content)}
            {msg.isStreaming && (
              <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 animate-pulse bg-current opacity-70" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inner chat content — only mounts when opened ────────────────────────────

interface ChatContentProps {
  context: AIChatContext
  onClose?: () => void
  isFloating: boolean
}

function ChatContent({ context, onClose, isFloating }: ChatContentProps) {
  const [text, setText] = useState('')
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null)

  const { messages, streaming, sendMessage, clearMessages } = useGeminiChat(context)
  const { isRecording, audioBlob, audioDuration, error: audioError, startRecording, stopRecording, clearRecording } = useAudioRecorder()

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!audioBlob) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPendingAttachment({
        type: 'audio',
        name: `Audio ${audioDuration}s`,
        mimeType: audioBlob.type || 'audio/webm',
        data: dataUrl.split(',')[1],
        previewUrl: URL.createObjectURL(audioBlob),
      })
    }
    reader.readAsDataURL(audioBlob)
  }, [audioBlob, audioDuration])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if ((!trimmed && !pendingAttachment) || streaming) return
    const attachments = pendingAttachment ? [pendingAttachment] : []
    setText('')
    setPendingAttachment(null)
    clearRecording()
    await sendMessage(trimmed, attachments)
    inputRef.current?.focus()
  }, [text, pendingAttachment, streaming, sendMessage, clearRecording])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPendingAttachment({
        type: 'image',
        name: file.name,
        mimeType: file.type,
        data: dataUrl.split(',')[1],
        previewUrl: URL.createObjectURL(file),
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      setPendingAttachment(null)
      clearRecording()
      void startRecording()
    }
  }, [isRecording, stopRecording, startRecording, clearRecording])

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/20">
            <Bot size={16} className="text-white" />
          </div>
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Coach IA</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Sparkles size={10} className="text-violet-400" />
            <p className="text-[10px] text-gray-500">Productividad &amp; Finanzas · Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="rounded-lg p-2 text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
            aria-label="Limpiar conversación"
          >
            <Trash2 size={15} />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
              aria-label="Cerrar chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Pending attachment / recording */}
      {(isRecording || pendingAttachment) && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-gray-900 px-3 py-2.5">
            {isRecording ? (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-recording-pulse shrink-0" />
                <span className="flex-1 text-xs text-gray-300">Grabando... {audioDuration}s</span>
                <button onClick={stopRecording} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
                  Detener
                </button>
              </>
            ) : pendingAttachment?.type === 'image' ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingAttachment.previewUrl} alt="Preview" className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0" />
                <span className="flex-1 min-w-0 text-xs text-gray-400 truncate">{pendingAttachment.name}</span>
                <button onClick={() => setPendingAttachment(null)} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0" aria-label="Quitar imagen"><X size={14} /></button>
              </>
            ) : (
              <>
                <Volume2 size={14} className="text-indigo-400 shrink-0" />
                <span className="flex-1 min-w-0 text-xs text-gray-400 truncate">{pendingAttachment?.name}</span>
                <button onClick={() => { setPendingAttachment(null); clearRecording() }} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0" aria-label="Quitar audio"><X size={14} /></button>
              </>
            )}
          </div>
        </div>
      )}

      {audioError && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">{audioError}</p>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/[0.06] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={streaming || isRecording}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors disabled:opacity-30"
            aria-label="Adjuntar imagen"
          >
            <Paperclip size={15} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) void handleSend() }}
            placeholder={isRecording ? 'Grabando audio...' : 'Finanzas, Screen Time, lo que quieras...'}
            disabled={streaming || isRecording}
            className="flex-1 min-w-0 rounded-xl border border-white/5 bg-gray-800/60 px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 disabled:opacity-50 transition-colors"
          />

          <button
            onClick={handleMicClick}
            disabled={streaming}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-30',
              isRecording ? 'bg-rose-600 text-white animate-recording-pulse' : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.06]'
            )}
            aria-label={isRecording ? 'Detener grabación' : 'Grabar audio'}
          >
            {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          <button
            onClick={() => void handleSend()}
            disabled={(!text.trim() && !pendingAttachment) || streaming || isRecording}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md hover:shadow-indigo-500/20"
            aria-label="Enviar"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

interface AIAssistantProps {
  context: AIChatContext
  mode: 'floating' | 'embedded'
}

export function AIAssistant({ context, mode }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  // Mount content only after first open (saves hook init + DOM cost until needed)
  const [hasOpened, setHasOpened] = useState(mode === 'embedded')

  const handleOpen = useCallback(() => {
    setHasOpened(true)
    setOpen(true)
  }, [])

  const isFloating = mode === 'floating'

  if (!isFloating) {
    return (
      <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#09090f] overflow-hidden">
        <ChatContent context={context} isFloating={false} />
      </div>
    )
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Panel shell — always in DOM for CSS transition; content mounts after first open */}
      <div className={cn(
        'fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] flex flex-col',
        'bg-[#09090f] border-l border-white/[0.06] shadow-2xl shadow-black/50',
        'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {hasOpened ? (
          <ChatContent context={context} onClose={() => setOpen(false)} isFloating />
        ) : (
          // Placeholder while panel slides in for the first time
          <div className="flex-1 flex items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
              <Bot size={16} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* FAB — hidden while panel is open */}
      <button
        onClick={handleOpen}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl',
          'shadow-indigo-500/30 transition-all duration-200',
          'hover:scale-105 hover:shadow-indigo-500/40 active:scale-95',
          open && 'hidden'
        )}
        aria-label="Abrir asistente IA"
      >
        <MessageCircle size={20} />
      </button>
    </>
  )
}
