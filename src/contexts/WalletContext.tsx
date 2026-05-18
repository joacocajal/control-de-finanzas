'use client'

import { createContext, useContext } from 'react'
import { useWallets } from '@/hooks/useWallets'
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@/types/database.types'

interface WalletContextValue {
  wallets: Wallet[]
  loading: boolean
  activeWalletId: string | null
  setActiveWalletId: (id: string | null) => void
  activeWallet: Wallet | null
  defaultWallet: Wallet | null
  createWallet: (input: CreateWalletInput) => Promise<Wallet>
  updateWallet: (id: string, input: UpdateWalletInput) => Promise<Wallet>
  archiveWallet: (id: string) => Promise<void>
  makeDefault: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallets()
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWalletContext debe usarse dentro de WalletProvider')
  return ctx
}
