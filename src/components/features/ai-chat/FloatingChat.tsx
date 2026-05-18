'use client'

import { useFinance } from '@/contexts/FinanceContext'
import { AIAssistant } from './AIAssistant'

export function FloatingChat() {
  const { aiContext } = useFinance()
  return <AIAssistant context={aiContext} mode="floating" />
}
