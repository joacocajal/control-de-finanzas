'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { MobileTopBar } from './MobileTopBar'
import { FinanceProvider } from '@/contexts/FinanceContext'
import { useGamification } from '@/hooks/useGamification'
import { createClient } from '@/lib/supabase/client'
import { StrictModeGate } from './StrictModeGate'

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

  return (
    <FinanceProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
        {/* Fixed sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
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
              <StrictModeGate>
                {children}
              </StrictModeGate>
            </div>
          </main>
        </div>

      </div>
    </FinanceProvider>
  )
}
