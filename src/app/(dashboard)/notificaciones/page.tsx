'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, AlertCircle, Lightbulb, Bell, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getNotifications, markNotificationRead } from '@/services/agent.service'
import type { AgentNotification } from '@/types/database.types'

const ACCENT = '#818cf8'
const PAGE_SIZE = 20

function notifIcon(type: string) {
  if (type === 'weekly_report') return <BarChart2 size={15} style={{ color: '#34d399' }} />
  if (type === 'alert')         return <AlertCircle size={15} style={{ color: '#f87171' }} />
  return                               <Lightbulb size={15} style={{ color: '#fbbf24' }} />
}

function relTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es })
  } catch { return '' }
}

export default function NotificacionesPage() {
  const [notifs, setNotifs] = useState<AgentNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const data = await getNotifications(PAGE_SIZE * (p + 1))
      setNotifs(data)
      setHasMore(data.length === PAGE_SIZE * (p + 1))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(0)
  }, [load])

  async function handleClick(n: AgentNotification) {
    if (!n.read_at) {
      await markNotificationRead(n.id)
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    }
    router.push(`/notificaciones/${n.id}`)
  }

  return (
    <div className="max-w-[680px] mx-auto py-2">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}33` }}
        >
          <Bell size={16} style={{ color: ACCENT }} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: 'var(--text-0)' }}>Notificaciones</h1>
          <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>Alertas, reportes e insights del agente</p>
        </div>
      </div>

      <div className="space-y-2">
        {loading && notifs.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          ))
        ) : notifs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }}
          >
            <Bell size={32} style={{ color: 'var(--text-2)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-2)' }}>
              Sin notificaciones todavía
            </p>
          </div>
        ) : (
          notifs.map((n) => {
            const unread = !n.read_at
            return (
              <button
                key={n.id}
                onClick={() => void handleClick(n)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors hover:bg-white/[0.03]"
                style={{
                  background: unread ? `${ACCENT}08` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${unread ? `${ACCENT}25` : 'var(--line)'}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)' }}
                >
                  {notifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13.5px] font-medium truncate"
                    style={{ color: unread ? 'var(--text-0)' : 'var(--text-1)' }}
                  >
                    {n.title}
                  </p>
                  <p className="text-[11.5px] truncate" style={{ color: 'var(--text-2)' }}>
                    {relTime(n.created_at)}
                    {!unread && ' · Leída'}
                  </p>
                </div>
                {unread && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
                  />
                )}
                <ArrowRight size={14} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
              </button>
            )
          })
        )}
      </div>

      {hasMore && !loading && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => { const next = page + 1; setPage(next); void load(next) }}
            className="text-[12px] px-4 py-2 rounded-xl transition-colors hover:bg-white/[0.06]"
            style={{ color: ACCENT, border: `1px solid ${ACCENT}33` }}
          >
            Cargar más
          </button>
        </div>
      )}
    </div>
  )
}
