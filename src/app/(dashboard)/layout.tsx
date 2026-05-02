import { Sidebar } from '@/components/layout/Sidebar'
import { FloatingChat } from '@/components/features/ai-chat/FloatingChat'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />
      <main className="pl-60 min-h-screen">
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
      <FloatingChat />
    </div>
  )
}
