'use client'

import { useState, useRef, useEffect } from 'react'
import { DollarSign, Check, X, Loader2 } from 'lucide-react'

interface ExchangeRateIndicatorProps {
  arsToUsd: number | null
  isToday: boolean
  loading: boolean
  onSave: (rate: number) => Promise<void>
}

export function ExchangeRateIndicator({ arsToUsd, isToday, loading, onSave }: ExchangeRateIndicatorProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    if (open && arsToUsd) setInput(String(arsToUsd))
  }, [open, arsToUsd])

  async function handleSave() {
    const val = parseFloat(input.replace(/\./g, '').replace(',', '.'))
    if (isNaN(val) || val <= 0) { setError('Ingresá un valor válido'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(val)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const dotColor = !arsToUsd ? '#94a3b8' : isToday ? '#34d399' : '#fbbf24'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors"
        style={{
          border: '1px solid var(--line)',
          background: open ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
          color: 'var(--text-1)',
        }}
        title={isToday ? 'Cotización de hoy' : arsToUsd ? 'Cotización anterior — click para actualizar' : 'Sin cotización — click para ingresar'}
      >
        <DollarSign size={12} style={{ color: dotColor }} />
        <span className="text-[11px] num font-medium">
          {loading ? '...' : arsToUsd
            ? `USD $${new Intl.NumberFormat('es-AR').format(arsToUsd)}`
            : 'USD sin cotizar'
          }
        </span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 z-50 w-64 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          style={{ border: '1px solid var(--line)', background: 'rgba(10,13,20,0.97)', backdropFilter: 'blur(20px)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <p className="text-[12px] font-semibold" style={{ color: 'var(--text-0)' }}>Tipo de cambio</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>1 USD = ? ARS (dólar blue/MEP)</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] num font-bold" style={{ color: 'var(--text-2)' }}>$</span>
              <input
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value.replace(/[^\d.,]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && void handleSave()}
                placeholder="1.200"
                inputMode="decimal"
                className="w-full rounded-xl pl-7 pr-4 py-2.5 text-[14px] num font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-0)', outline: 'none' }}
              />
            </div>
            {error && <p className="text-[11px]" style={{ color: '#f87171' }}>{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)}
                className="p-2.5 rounded-xl transition-colors hover:bg-white/[0.06]"
                style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}>
                <X size={14} />
              </button>
              <button onClick={() => void handleSave()} disabled={saving || !input}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                {saving
                  ? <Loader2 size={14} className="animate-spin mx-auto" />
                  : <span className="flex items-center justify-center gap-1.5"><Check size={13} strokeWidth={2.5} />Guardar</span>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
