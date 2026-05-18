'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { MobileTopBar } from './MobileTopBar'
import { FinanceProvider } from '@/contexts/FinanceContext'
import { useGamification } from '@/hooks/useGamification'
import { createClient } from '@/lib/supabase/client'

const FloatingChat = dynamic(
  () => import('@/components/features/ai-chat/FloatingChat').then((m) => ({ default: m.FloatingChat })),
  { ssr: false, loading: () => null }
)

const AgentChat = dynamic(
  () => import('@/components/features/ai-chat/AgentChat').then((m) => ({ default: m.AgentChat })),
  { ssr: false, loading: () => null }
)

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const { profile } = useGamification()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  const nivel = profile?.nivel_global ?? 1

  return (
    <FinanceProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
        {/* Fixed sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          level={nivel}
          email={email}
        />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main area (shifted right on desktop for sidebar) */}
        <div className="lg:pl-[232px] flex flex-col min-h-dvh">
          <MobileTopBar
            onMenuClick={() => setSidebarOpen(true)}
            profile={profile}
          />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="max-w-[1280px] mx-auto">
              {children}
            </div>
          </main>
        </div>

        <FloatingChat />
        <AgentChat />
      </div>
    </FinanceProvider>
  )
}
