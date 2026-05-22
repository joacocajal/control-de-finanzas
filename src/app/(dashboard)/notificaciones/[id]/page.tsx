'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BarChart2, AlertCircle, Lightbulb, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getNotifications, markNotificationRead } from '@/services/agent.service'
import type { AgentNotification } from '@/types/database.types'

const ACCENT = '#818cf8'

function notifIcon(type: string) {
  if (type === 'weekly_report') return <BarChart2 size={18} style={{ color: '#34d399' }} />
  if (type === 'alert')         return <AlertCircle size={18} style={{ color: '#f87171' }} />
  return                               <Lightbulb size={18} style={{ color: '#fbbf24' }} />
}

function notifColor(type: string) {
  if (type === 'weekly_report') return '#34d399'
  if (type === 'alert')         return '#f87171'
  return '#fbbf24'
}

function typeLabel(type: string) {
  if (type === 'weekly_report') return 'Reporte semanal'
  if (type === 'alert')         return 'Alerta'
  return 'Insight'
}

// ─── Metric cards from payload ────────────────────────────────

interface MetricCardProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}

function MetricCard({ label, value, trend, color }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : 'var(--text-2)'

  return (
    <div
      className="flex flex-col gap-1 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}
    >
      <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
        {label}
      </span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[20px] font-bold num" style={{ color: color ?? 'var(--text-0)' }}>
          {typeof value === 'number' ? value.toLocaleString('es-AR') : value}
        </span>
        {trend && <TrendIcon size={16} style={{ color: trendColor, flexShrink: 0 }} />}
      </div>
    </div>
  )
}

function PayloadMetrics({ payload }: { payload: Record<string, unknown> }) {
  const stats = (payload.stats ?? payload) as Record<string, unknown>

  const metricKeys = Object.entries(stats).filter(
    ([, v]) => typeof v === 'number' || typeof v === 'string'
  )

  if (metricKeys.length === 0) return null

  const LABELS: Record<string, { label: string; color?: string; trend?: 'up' | 'down' | 'neutral' }> = {
    total_income:   { label: 'Ingresos', color: '#34d399', trend: 'up' },
    total_expenses: { label: 'Gastos',   color: '#f87171', trend: 'down' },
    balance:        { label: 'Balance',  color: ACCENT },
    workouts_count: { label: 'Sesiones de gym', color: '#8b5cf6', trend: 'up' },
    study_hours:    { label: 'Horas de estudio', color: '#f97316', trend: 'up' },
    savings_rate:   { label: 'Tasa de ahorro %', color: '#34d399' },
    week_start:     { label: 'Inicio semana' },
    week_end:       { label: 'Fin semana' },
  }

  return (
    <div className="mt-6">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-2)' }}>
        Métricas de la semana
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {metricKeys.map(([key, val]) => {
          const meta = LABELS[key]
          if (!meta) return null
          return (
            <MetricCard
              key={key}
              label={meta.label}
              value={val as string | number}
              trend={meta.trend}
              color={meta.color}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────

export default function NotificacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [notif, setNotif] = useState<AgentNotification | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getNotifications(100)
      .then((all) => {
        const found = all.find((n) => n.id === id) ?? null
        setNotif(found)
        if (found && !found.read_at) {
          void markNotificationRead(found.id)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-[680px] mx-auto py-4">
        <div className="h-8 w-32 rounded-xl animate-pulse mb-6" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    )
  }

  if (!notif) {
    return (
      <div className="max-w-[680px] mx-auto py-8 text-center">
        <p style={{ color: 'var(--text-2)' }}>Notificación no encontrada.</p>
        <button
          onClick={() => router.push('/notificaciones')}
          className="mt-4 text-[13px]"
          style={{ color: ACCENT }}
        >
          ← Volver
        </button>
      </div>
    )
  }

  const accent = notifColor(notif.type)

  return (
    <div className="max-w-[680px] mx-auto py-2">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[12.5px] mb-5 transition-colors hover:opacity-80"
        style={{ color: 'var(--text-2)' }}
      >
        <ArrowLeft size={13} />
        Notificaciones
      </button>

      {/* Header card */}
      <div
        className="flex items-start gap-4 px-5 py-4 rounded-2xl mb-6"
        style={{ background: `${accent}0d`, border: `1px solid ${accent}30` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${accent}18`, border: `1px solid ${accent}44` }}
        >
          {notifIcon(notif.type)}
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: accent }}
          >
            {typeLabel(notif.type)}
          </span>
          <h1 className="text-[18px] font-bold mt-0.5 leading-tight" style={{ color: 'var(--text-0)' }}>
            {notif.title}
          </h1>
          <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-2)' }}>
            {format(new Date(notif.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
            {' · '}
            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
      </div>

      {/* Body markdown */}
      <div
        className="px-5 py-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }}
      >
        <div className="prose-ascend text-[14px] leading-relaxed" style={{ color: 'var(--text-1)' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              h2: ({ children }) => (
                <h2 className="text-[16px] font-bold mt-5 mb-2" style={{ color: 'var(--text-0)' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[14px] font-semibold mt-4 mb-1.5" style={{ color: 'var(--text-0)' }}>
                  {children}
                </h3>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-[13.5px]">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold" style={{ color: 'var(--text-0)' }}>
                  {children}
                </strong>
              ),
              hr: () => <hr className="my-4" style={{ borderColor: 'var(--line)' }} />,
              blockquote: ({ children }) => (
                <blockquote
                  className="border-l-2 pl-3 my-3 italic"
                  style={{ borderColor: accent, color: 'var(--text-2)' }}
                >
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code
                  className="px-1.5 py-0.5 rounded text-[12px] font-mono"
                  style={{ background: 'rgba(255,255,255,0.07)', color: accent }}
                >
                  {children}
                </code>
              ),
            }}
          >
            {notif.body}
          </ReactMarkdown>
        </div>
      </div>

      {/* Payload metrics (if any) */}
      {notif.payload && Object.keys(notif.payload).length > 0 && (
        <PayloadMetrics payload={notif.payload as Record<string, unknown>} />
      )}
    </div>
  )
}
