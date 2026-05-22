'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { isStrictModeBlocking, completeMission, toggleStrictMode } from '@/services/missions.service'
import { getTodayMissions } from '@/services/missions.service'
import { CATEGORY_ICONS } from '@/lib/missions/progression'
import type { DailyMission } from '@/types/database.types'

// /progreso y /agente NUNCA se bloquean
const EXEMPT = ['/progreso', '/agente']

export function StrictModeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [blocking, setBlocking] = useState(false)
  const [checked, setChecked]   = useState(false)
  const [missions, setMissions] = useState<DailyMission[]>([])
  const [saving, setSaving]     = useState<string | null>(null)
  const [initDisable, setInitDisable] = useState(false)
  const [disabling, setDisabling]     = useState(false)

  const isExempt = EXEMPT.some(p => pathname.startsWith(p))

  const check = useCallback(async () => {
    if (isExempt) { setBlocking(false); setChecked(true); return }
    try {
      const blocked = await isStrictModeBlocking()
      setBlocking(blocked)
      if (blocked) {
        const ms = await getTodayMissions()
        setMissions(ms)
      }
    } catch {
      setBlocking(false)
    } finally {
      setChecked(true)
    }
  }, [isExempt])

  useEffect(() => { void check() }, [check])

  // Re-check cuando cambia el path (p.ej. vuelven de /progreso)
  useEffect(() => { setChecked(false); void check() }, [pathname, check])

  const handleComplete = async (id: string) => {
    setSaving(id)
    try {
      await completeMission(id)
      const ms = await getTodayMissions()
      setMissions(ms)
      const stillBlocking = await isStrictModeBlocking()
      setBlocking(stillBlocking)
    } finally {
      setSaving(null)
    }
  }

  const handleInitDisable = async () => {
    setDisabling(true)
    try {
      await toggleStrictMode()
      setInitDisable(false)
      await check()
    } finally {
      setDisabling(false)
    }
  }

  if (!checked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-2)' }} />
      </div>
    )
  }

  if (!blocking) return <>{children}</>

  const pending    = missions.filter(m => !m.completed)
  const total      = missions.length
  const done       = missions.filter(m => m.completed).length
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Lock size={24} style={{ color: '#ef4444' }} />
          </div>
          <h1 className="text-[20px] font-bold display" style={{ color: 'var(--text-0)' }}>
            Modo Estricto activo
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Para seguir usando Ascend, completá las misiones de hoy.
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="glass p-4 space-y-3" style={{ borderRadius: 18 }}>
          <div className="flex justify-between text-[11px] num" style={{ color: 'var(--text-2)' }}>
            <span>{done}/{total} completadas</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #fbbf24, #f97316)',
              }} />
          </div>

          {/* Misiones pendientes */}
          <div className="space-y-1.5 pt-1">
            {pending.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-1.5">
                <button
                  onClick={() => void handleComplete(m.id)}
                  disabled={saving === m.id}
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                  {saving === m.id && <Loader2 size={10} className="animate-spin" style={{ color: 'var(--text-2)' }} />}
                </button>
                <span className="text-[14px]">{CATEGORY_ICONS[m.category]}</span>
                <span className="flex-1 text-[13px]" style={{ color: 'var(--text-0)' }}>{m.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos permitidos */}
        <div className="flex gap-2">
          <a href="/agente"
            className="flex-1 py-2.5 rounded-xl text-[12px] font-medium text-center"
            style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
            Ir al Agente
          </a>
          <a href="/progreso"
            className="flex-1 py-2.5 rounded-xl text-[12px] font-medium text-center"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
            Ver Progreso
          </a>
        </div>

        {/* Desactivación */}
        <div className="text-center" style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
          {!initDisable ? (
            <button onClick={() => setInitDisable(true)}
              className="text-[12px] underline" style={{ color: 'var(--text-2)' }}>
              ¿Necesitás desactivarlo? Tarda 24hs
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                El modo estricto se desactivará en 24 horas.
              </p>
              <div className="flex gap-2">
                <button onClick={() => void handleInitDisable()} disabled={disabling}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {disabling ? 'Procesando...' : 'Iniciar desactivación'}
                </button>
                <button onClick={() => setInitDisable(false)}
                  className="py-2 px-3 rounded-xl text-[12px]"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
