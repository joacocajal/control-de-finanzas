'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTransactions, createTransaction, deleteTransaction } from '@/services/transaction.service'
import type { TransactionWithCategory, CreateTransactionInput } from '@/types/database.types'

interface UseTransactionsReturn {
  transactions: TransactionWithCategory[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addTransaction: (input: CreateTransactionInput) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactions()
      setTransactions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addTransaction = useCallback(async (input: CreateTransactionInput) => {
    // Show immediately in the list (optimistic update)
    const tempId = `temp-${Date.now()}`
    const optimistic: TransactionWithCategory = {
      id: tempId,
      user_id: '',
      wallet_id: input.wallet_id ?? null,
      type: input.type,
      amount: input.amount,
      currency: input.currency ?? 'ARS',
      exchange_rate: input.exchange_rate ?? null,
      amount_ars: input.amount,
      amount_usd: null,
      category_id: input.category_id,
      description: input.description,
      transaction_date: input.transaction_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categories: null,
    }
    setTransactions((prev) => [optimistic, ...prev])

    // Critical path: if insert fails, roll back optimistic and surface the error
    try {
      await createTransaction(input)
    } catch (err) {
      setTransactions((prev) => prev.filter((t) => t.id !== tempId))
      throw err
    }

    // Best-effort refresh: replace optimistic with real data (with category join)
    // If this fails we keep the optimistic entry — the transaction IS saved
    try {
      const data = await getTransactions()
      setTransactions(data)
    } catch {
      // silent — optimistic entry stays until next page load
    }
  }, [])

  const removeTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    try {
      await deleteTransaction(id)
    } catch (err) {
      // Roll back if delete failed
      void refresh()
      throw err
    }
  }, [refresh])

  return { transactions, loading, error, refresh, addTransaction, removeTransaction }
}
