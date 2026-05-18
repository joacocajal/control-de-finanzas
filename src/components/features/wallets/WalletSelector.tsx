'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, LayoutGrid, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { useWalletContext } from '@/contexts/WalletContext'
import type { Wallet } from '@/types/database.types'

function WalletDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: color }}
    />
  )
}

function WalletBadge({ wallet }: { wallet: Wallet }) {
  return (
    <span
      className="text-[9px] num uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
      style={{
        background: wallet.type === 'negocio' ? 'rgba(251,191,36,0.12)' : 'rgba(148,163,184,0.1)',
        color: wallet.type === 'negocio' ? '#fbbf24' : 'var(--text-2)',
      }}
    >
      {wallet.type === 'negocio' ? 'Negocio' : 'Personal'}
    </span>
  )
}

export function WalletSelector() {
  const { wallets, activeWalletId, setActiveWalletId, activeWallet, loading } = useWalletContext()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const label = activeWallet ? activeWallet.name : 'Todas'

  if (loading) {
    return (
      <div className="h-8 w-28 rounded-xl animate-shimmer" style={{ border: '1px solid var(--line)' }} />
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors"
        style={{
          border: '1px solid var(--line)',
          background: open ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
          color: 'var(--text-0)',
        }}
      >
        {activeWallet
          ? <WalletDot color={activeWallet.color} size={7} />
          : <LayoutGrid size={12} style={{ color: 'var(--text-2)' }} />
        }
        <span className="text-[12px] font-medium num">{label}</span>
        <ChevronDown
          size={12}
          style={{ color: 'var(--text-2)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 min-w-[220px] rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          style={{ border: '1px solid var(--line)', background: 'rgba(10,13,20,0.97)', backdropFilter: 'blur(20px)' }}
        >
          {/* Todas */}
          <button
            onClick={() => { setActiveWalletId(null); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
            style={{ borderBottom: '1px solid var(--line)' }}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <LayoutGrid size={12} style={{ color: 'var(--text-2)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold" style={{ color: activeWalletId === null ? '#34d399' : 'var(--text-0)' }}>
                Todas
              </div>
              <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>Vista consolidada</div>
            </div>
            {activeWalletId === null && (
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#34d399' }} />
            )}
          </button>

          {/* Wallets */}
          <div className="py-1">
            {wallets.map(w => (
              <button
                key={w.id}
                onClick={() => { setActiveWalletId(w.id); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ background: `${w.color}20`, color: w.color }}
                >
                  {w.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: activeWalletId === w.id ? w.color : 'var(--text-0)' }}>
                    {w.name}
                  </div>
                  <WalletBadge wallet={w} />
                </div>
                {activeWalletId === w.id && (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: w.color }} />
                )}
              </button>
            ))}
          </div>

          {/* Footer actions */}
          <div className="p-2 flex gap-2" style={{ borderTop: '1px solid var(--line)' }}>
            <Link
              href="/finanzas/wallets"
              onClick={() => setOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium transition-colors hover:bg-white/[0.04]"
              style={{ color: 'var(--text-2)', border: '1px solid var(--line)' }}
            >
              <Settings size={11} />
              Gestionar
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function NewWalletButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all hover:scale-[1.02]"
      style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
    >
      <Plus size={13} strokeWidth={2.5} />
      Nueva wallet
    </button>
  )
}
