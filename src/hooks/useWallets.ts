'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as WalletsService from '@/services/wallets.service'
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@/types/database.types'

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await WalletsService.getWallets()
      setWallets(data)
      if (!initialized.current) {
        initialized.current = true
        const def = data.find(w => w.is_default)
        if (def) setActiveWalletId(def.id)
      }
    } catch {
      // swallow — handled upstream
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const createWallet = useCallback(async (input: CreateWalletInput): Promise<Wallet> => {
    const w = await WalletsService.createWallet(input)
    setWallets(prev => [...prev, w])
    return w
  }, [])

  const updateWallet = useCallback(async (id: string, input: UpdateWalletInput): Promise<Wallet> => {
    const w = await WalletsService.updateWallet(id, input)
    setWallets(prev => prev.map(x => x.id === id ? w : x))
    return w
  }, [])

  const archiveWallet = useCallback(async (id: string): Promise<void> => {
    await WalletsService.archiveWallet(id)
    setWallets(prev => prev.filter(w => w.id !== id))
    if (activeWalletId === id) setActiveWalletId(null)
  }, [activeWalletId])

  const makeDefault = useCallback(async (id: string): Promise<void> => {
    await WalletsService.setDefaultWallet(id)
    setWallets(prev => prev.map(w => ({ ...w, is_default: w.id === id })))
  }, [])

  const defaultWallet = wallets.find(w => w.is_default) ?? null
  const activeWallet = wallets.find(w => w.id === activeWalletId) ?? null

  return {
    wallets,
    loading,
    activeWalletId,
    setActiveWalletId,
    activeWallet,
    defaultWallet,
    createWallet,
    updateWallet,
    archiveWallet,
    makeDefault,
    reload: load,
  }
}
