'use client'

import { Menu, Mountain, Flame } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { NotificationBell } from './NotificationBell'
import type { ProfileGamificado } from '@/types/database.types'

const REALM_MAP: Record<string, { label: string; accent: string }> = {
  '/': { label: 'Dashboard', accent: '#e7ecf3' },
  '/finanzas': { label: 'Finances', accent: '#34d399' },
  '/fitness': { label: 'Fitness', accent: '#8b5cf6' },
  '/focus': { label: 'Focus', accent: '#f43f5e' },
  '/habitos': { label: 'Hábitos', accent: '#34d399' },
  '/aprendizaje': { label: 'Learning Hub', accent: '#f97316' },
  '/diario': { label: 'Diario', accent: '#818cf8' },
  '/agente': { label: 'Agente', accent: '#818cf8' },
  '/notificaciones': { label: 'Notificaciones', accent: '#818cf8' },
}

interface MobileTopBarProps {
  onMenuClick: () => void
  profile?: ProfileGamificado | null
}

export function MobileTopBar({ onMenuClick, profile }: MobileTopBarProps) {
  const pathname = usePathname()
  const realmKey = Object.keys(REALM_MAP)
    .filter((k) => (k === '/' ? pathname === '/' : pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0] ?? '/'
  const realm = REALM_MAP[realmKey]

  const streak = profile?.racha_dias ?? 0

  return (
    <header
      className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 pt-3 pb-3"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile: hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--line)',
            color: 'var(--text-1)',
          }}
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        {/* Mobile: logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', color: '#0a0d14' }}
          >
            <Mountain size={14} strokeWidth={2.25} />
          </div>
          <span className="text-[14px] font-bold display" style={{ color: 'var(--text-0)' }}>Ascend</span>
        </div>

        {/* Desktop: realm breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${realm.accent}1f`, color: realm.accent }}
          >
            <Mountain size={15} />
          </div>
          <div className="min-w-0">
            <div
              className="text-[10px] num uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-2)' }}
            >
              Realm
            </div>
            <div
              className="text-[14px] font-semibold display truncate"
              style={{ color: 'var(--text-0)' }}
            >
              {realm.label}
            </div>
          </div>
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Streak indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(249,115,22,0.12), rgba(249,115,22,0.04))',
              border: '1px solid rgba(249,115,22,0.25)',
            }}
          >
            <Flame size={14} className="flame" style={{ color: '#f97316' }} />
            <div className="leading-none">
              <div className="num text-[13px] font-bold" style={{ color: '#fb923c' }}>{streak}</div>
              <div
                className="hidden sm:block text-[9px] num uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-2)' }}
              >
                días
              </div>
            </div>
          </div>

          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
