'use client'

import { useState } from 'react'
import { ArrowLeft, Pencil, Archive, Star, Plus, Check, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useWalletContext } from '@/contexts/WalletContext'
import type { Wallet, WalletType } from '@/types/database.types'

const COLOR_PALETTE = [
  '#34d399', '#f97316', '#8b5cf6', '#38bdf8',
  '#fbbf24', '#f87171', '#22c55e', '#3b82f6',
  '#ec4899', '#64748b',
]

interface WalletFormState {
  name: string
  type: WalletType
  color: string
}

function WalletForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: WalletFormState
  onSave: (v: WalletFormState) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, name: form.name.trim() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 p-5" style={{ borderTop: '1px solid var(--line)' }}>
      {/* Name */}
      <div>
        <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>
          Nombre
        </label>
        <input
          autoFocus
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          maxLength={30}
          placeholder="Ej: Personal, LEVEL, Inversiones..."
          className="w-full rounded-xl px-4 py-2.5 text-[13px] transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--line)',
            color: 'var(--text-0)',
            outline: 'none',
          }}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>
          Tipo
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['personal', 'negocio'] as WalletType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(p => ({ ...p, type: t }))}
              className="py-2 rounded-xl text-[12px] font-medium transition-all capitalize"
              style={{
                background: form.type === t ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                color: form.type === t ? '#34d399' : 'var(--text-2)',
                border: `1px solid ${form.type === t ? 'rgba(52,211,153,0.3)' : 'var(--line)'}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-[10px] num uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-2)' }}>
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(c => (
            <button
              key={c}
              onClick={() => setForm(p => ({ ...p, color: c }))}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 relative"
              style={{ background: c }}
            >
              {form.color === c && (
                <Check size={12} className="absolute inset-0 m-auto text-black" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-[12px] px-3 py-2 rounded-xl" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors"
          style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}
        >
          Cancelar
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={saving || !form.name.trim()}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
        >
          {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function WalletCard({ wallet }: { wallet: Wallet }) {
  const { updateWallet, archiveWallet, makeDefault } = useWalletContext()
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)

  async function handleArchive() {
    if (!confirm(`¿Archivar "${wallet.name}"? Las transacciones existentes se conservan.`)) return
    setArchiving(true)
    try { await archiveWallet(wallet.id) }
    finally { setArchiving(false) }
  }

  return (
    <div className="glass rounded-2xl overflow-hidden lift" style={{ borderRadius: 16 }}>
      <div className="flex items-center gap-4 p-5">
        {/* Color avatar */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[15px] font-bold"
          style={{ background: `${wallet.color}20`, color: wallet.color }}
        >
          {wallet.name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-0)' }}>{wallet.name}</span>
            {wallet.is_default && (
              <span className="text-[9px] num uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                Default
              </span>
            )}
            <span className="text-[9px] num uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
              {wallet.type}
            </span>
          </div>
          <div
            className="w-20 h-1.5 rounded-full mt-2"
            style={{ background: `${wallet.color}30` }}
          >
            <div className="h-full rounded-full" style={{ width: '100%', background: wallet.color }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!wallet.is_default && (
            <button
              onClick={() => void makeDefault(wallet.id)}
              className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--text-2)' }}
              title="Marcar como default"
            >
              <Star size={14} />
            </button>
          )}
          <button
            onClick={() => setEditing(v => !v)}
            className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: editing ? '#34d399' : 'var(--text-2)' }}
            title="Editar"
          >
            {editing ? <X size={14} /> : <Pencil size={14} />}
          </button>
          {!wallet.is_default && (
            <button
              onClick={() => void handleArchive()}
              disabled={archiving}
              className="p-2 rounded-lg transition-colors hover:bg-rose-500/10"
              style={{ color: 'var(--text-2)' }}
              title="Archivar"
            >
              {archiving ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <WalletForm
          initial={{ name: wallet.name, type: wallet.type, color: wallet.color }}
          onSave={async (v) => {
            await updateWallet(wallet.id, v)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

export default function WalletsPage() {
  const { wallets, loading, createWallet } = useWalletContext()
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/finanzas"
          className="p-2 rounded-xl transition-colors hover:bg-white/[0.06]"
          style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
            Finances · Wallets
          </div>
          <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>
            Gestión de Wallets
          </h1>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: showForm ? 'rgba(255,255,255,0.08)' : 'rgba(52,211,153,0.2)', color: showForm ? 'var(--text-2)' : '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} strokeWidth={2.5} />}
            {showForm ? 'Cancelar' : 'Nueva wallet'}
          </button>
        </div>
      </div>

      {/* New wallet form */}
      {showForm && (
        <div className="glass mb-4" style={{ borderRadius: 16 }}>
          <div className="px-5 pt-5">
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-0)' }}>Nueva wallet</h2>
          </div>
          <WalletForm
            initial={{ name: '', type: 'personal', color: '#34d399' }}
            onSave={async (v) => {
              await createWallet(v)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Wallet list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl animate-shimmer" style={{ border: '1px solid var(--line)' }} />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="glass py-16 text-center" style={{ borderRadius: 16 }}>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>No hay wallets. Creá una arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map(w => <WalletCard key={w.id} wallet={w} />)}
        </div>
      )}
    </>
  )
}
