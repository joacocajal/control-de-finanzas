'use client'

import { useState } from 'react'
import { Check, Loader2, Wallet } from 'lucide-react'
import { useWalletContext } from '@/contexts/WalletContext'
import type { WalletType } from '@/types/database.types'

interface Suggestion {
  name: string
  type: WalletType
  color: string
  disabled?: boolean
}

const SUGGESTIONS: Suggestion[] = [
  { name: 'Personal', type: 'personal', color: '#34d399', disabled: true },
  { name: 'LEVEL', type: 'negocio', color: '#f97316' },
  { name: 'Agencia IA', type: 'negocio', color: '#8b5cf6' },
  { name: 'Finca Cajal', type: 'negocio', color: '#22c55e' },
]

export function WalletOnboarding() {
  const { createWallet, setActiveWalletId } = useWalletContext()
  const [selected, setSelected] = useState<Set<string>>(new Set(['Personal']))
  const [saving, setSaving] = useState(false)

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      let defaultWallet = null
      for (const s of SUGGESTIONS) {
        if (!selected.has(s.name)) continue
        const w = await createWallet({
          name: s.name,
          type: s.type,
          color: s.color,
          is_default: s.name === 'Personal',
        })
        if (s.name === 'Personal') defaultWallet = w
      }
      if (defaultWallet) setActiveWalletId(defaultWallet.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{ border: '1px solid var(--line)', background: 'rgba(10,13,20,0.97)' }}
      >
        {/* Header */}
        <div className="px-6 pt-7 pb-5 text-center" style={{ borderBottom: '1px solid var(--line)' }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
          >
            <Wallet size={22} />
          </div>
          <h2 className="text-[17px] font-bold display" style={{ color: 'var(--text-0)' }}>
            Configurá tus wallets
          </h2>
          <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-2)' }}>
            Separamos tus finanzas por wallet. Elegí con cuáles querés arrancar.
          </p>
        </div>

        {/* Suggestions */}
        <div className="px-5 py-4 space-y-2">
          {SUGGESTIONS.map(s => {
            const on = selected.has(s.name)
            return (
              <button
                key={s.name}
                onClick={() => !s.disabled && toggle(s.name)}
                disabled={s.disabled}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  border: `1px solid ${on ? s.color + '40' : 'var(--line)'}`,
                  background: on ? `${s.color}0d` : 'rgba(255,255,255,0.02)',
                  cursor: s.disabled ? 'default' : 'pointer',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold"
                  style={{ background: `${s.color}20`, color: s.color }}
                >
                  {s.name[0]}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>
                    {s.name}
                  </div>
                  <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>
                    {s.type === 'negocio' ? 'Cuenta negocio' : 'Cuenta personal'}
                    {s.disabled && ' · Obligatorio'}
                  </div>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: on ? s.color : 'rgba(255,255,255,0.06)',
                    border: on ? 'none' : '1px solid var(--line)',
                  }}
                >
                  {on && <Check size={11} className="text-black" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div className="px-5 pb-6">
          <button
            onClick={() => void handleConfirm()}
            disabled={saving || selected.size === 0}
            className="w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#34d399,#059669)', boxShadow: '0 4px 20px rgba(52,211,153,0.25)' }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                Creando wallets...
              </span>
            ) : (
              `Comenzar con ${selected.size} wallet${selected.size !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
