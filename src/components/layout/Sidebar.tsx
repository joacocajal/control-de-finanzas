'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  const initial = email?.[0]?.toUpperCase() ?? '?'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-30 bg-[#09090f] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Mis Finanzas</p>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Personal Finance
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
          Menú
        </p>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-indigo-500/10 text-indigo-300'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          )
        })}

        {/* AI hint */}
        <div className="mt-4 mx-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/[0.08] to-indigo-500/[0.06] border border-violet-500/10">
            <Sparkles size={14} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-violet-300">Asistente IA</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Botón abajo a la derecha</p>
            </div>
          </div>
        </div>
      </nav>

      {/* User section */}
      <div className="mx-5 h-px bg-white/[0.06]" />
      <div className="px-3 py-4 space-y-0.5">
        {/* Email row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white">
            {initial}
          </div>
          <p className="text-xs text-gray-400 truncate flex-1 min-w-0">{email ?? '...'}</p>
        </div>

        {/* Logout */}
        <button
          onClick={() => void handleLogout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-all duration-150"
        >
          <LogOut size={15} className="shrink-0" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
