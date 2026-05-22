'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BarChart2,
  AlertCircle,
  Lightbulb,
  CheckCheck,
  ArrowRight,
  BellOff,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAgentNotifications } from '@/hooks/useAgent'
import type { AgentNotification } from '@/types/database.types'

const ACCENT = '#818cf8'

function notifIcon(type: string) {
  if (type === 'weekly_report') return <BarChart2 size={13} style={{ color: '#34d399' }} />
  if (type === 'alert')         return <AlertCircle size={13} style={{ color: '#f87171' }} />
  return                               <Lightbulb size={13} style={{ color: '#fbbf24' }} />
}

function relTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es })
  } catch {
    return ''
  }
}

function NotifItem({
  n,
  onRead,
}: {
  n: AgentNotification
  onRead: (id: string) => void
}) {
  const router = useRouter()
  const unread = !n.read_at

  function handleClick() {
    if (unread) onRead(n.id)
    router.push(`/notificaciones/${n.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04] rounded-xl"
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)' }}
      >
        {notifIcon(n.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[12.5px] font-medium truncate"
          style={{ color: unread ? 'var(--text-0)' : 'var(--text-1)' }}
        >
          {n.title}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-2)' }}>
          {relTime(n.created_at)}
        </p>
      </div>
      {unread && (
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
          style={{ background: ACCENT }}
        />
      )}
    </button>
  )
}

export function NotificationBell() {
  const { notifications, unreadCount, load, markRead, markAllRead } = useAgentNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load on mount
  useEffect(() => {
    void load()
  }, [load])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) void load() }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06]"
        style={{
          background: open ? `${ACCENT}18` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? `${ACCENT}44` : 'var(--line)'}`,
          color: open ? ACCENT : 'var(--text-1)',
        }}
        aria-label="Notificaciones"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold num px-1"
            style={{ background: '#ef4444', color: '#fff', boxShadow: '0 0 8px #ef444488' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-[320px] rounded-2xl overflow-hidden z-50"
          style={{
            background: 'rgba(10,13,20,0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--line)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--line)' }}
          >
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-[11px] transition-colors hover:opacity-80"
                style={{ color: ACCENT }}
              >
                <CheckCheck size={12} />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto px-1 py-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <BellOff size={22} style={{ color: 'var(--text-2)' }} />
                <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                  Sin notificaciones
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <NotifItem
                  key={n.id}
                  n={n}
                  onRead={(id) => {
                    void markRead(id)
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--line)' }}>
            <button
              onClick={() => { setOpen(false); router.push('/notificaciones') }}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-[12px] transition-colors hover:bg-white/[0.04]"
              style={{ color: ACCENT }}
            >
              Ver todas
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
