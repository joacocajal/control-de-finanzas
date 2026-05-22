'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Dumbbell,
  BookOpen,
  Bot,
  Mountain,
  X,
  LogOut,
  BookHeart,
  Swords,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard, accent: '#e7ecf3', exact: true },
  { href: '/finanzas', label: 'Finances', Icon: Wallet, accent: '#34d399', exact: false },
  { href: '/fitness', label: 'Fitness', Icon: Dumbbell, accent: '#8b5cf6', exact: false },
  { href: '/aprendizaje', label: 'Learning Hub', Icon: BookOpen, accent: '#f97316', exact: false },
  { href: '/diario', label: 'Diario', Icon: BookHeart, accent: '#818cf8', exact: false },
  { href: '/agente', label: 'Agente', Icon: Bot, accent: '#818cf8', exact: false },
  { href: '/progreso', label: 'Progreso', Icon: Swords, accent: '#fbbf24', exact: false },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  level?: number
  email?: string | null
}

export function Sidebar({ open = false, onClose, level = 1, email }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const initial = email?.[0]?.toUpperCase() ?? '?'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-30 flex flex-col',
        'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      style={{
        width: 232,
        background: 'rgba(7,9,15,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRight: '1px solid var(--line)',
      }}
    >
      {/* ── Logo ── */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', color: '#0a0d14' }}
          >
            <Mountain size={18} strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-[14px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>
              Ascend
            </div>
            <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
              Personal Dev OS
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden rounded-lg p-1.5 transition-colors hover:bg-white/[0.06]"
          style={{ color: 'var(--text-2)' }}
          aria-label="Cerrar menú"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 pt-4 space-y-1">
        <div
          className="text-[10px] num uppercase tracking-[0.2em] px-2 mb-2"
          style={{ color: 'var(--text-2)' }}
        >
          Realms
        </div>
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium',
                active && 'active'
              )}
              style={
                {
                  color: active ? 'var(--text-0)' : 'var(--text-1)',
                  '--nav-accent': item.accent,
                } as React.CSSProperties
              }
            >
              <item.Icon size={16} style={{ color: active ? item.accent : 'inherit' }} />
              <span>{item.label}</span>
              {active && (
                <span
                  className="ml-auto text-[10px] num px-1.5 py-0.5 rounded-md"
                  style={{ background: `${item.accent}1f`, color: item.accent }}
                >
                  •
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="px-3 pb-4 mt-4">
        <div
          className="rounded-2xl p-3 flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }}
        >
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-semibold"
              style={{ background: 'linear-gradient(135deg, #312e81, #6d28d9)', color: '#e9d5ff' }}
            >
              {initial}
            </div>
            <div className="absolute -bottom-1 -right-1">
              <div
                className="lvl-chip text-[9px] px-1.5 py-0.5 rounded-md"
                style={{ boxShadow: '0 0 10px rgba(251,191,36,0.5)' }}
              >
                LVL {level}
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--text-0)' }}>
              {email ?? '...'}
            </div>
            <div className="text-[10.5px] num truncate" style={{ color: 'var(--text-2)' }}>
              Ascendant
            </div>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
            style={{ color: 'var(--text-2)' }}
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
