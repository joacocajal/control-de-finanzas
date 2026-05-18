'use client'

import { Droplets, Trash2 } from 'lucide-react'
import { useWaterLogs } from '@/hooks/useWaterLogs'
import { useFitnessGoals } from '@/hooks/useFitnessGoals'

const QUICK_AMOUNTS = [0.25, 0.33, 0.5, 0.75, 1]

function toToday() {
  return new Date().toISOString().slice(0, 10)
}

export function FitnessHidratacion() {
  const today = toToday()
  const { logs, totalLiters, addWater, removeWater } = useWaterLogs(today)
  const { goalsMap } = useFitnessGoals()

  const goal = goalsMap['daily_water_liters'] ?? 2
  const pct = Math.min(1, totalLiters / goal)

  const segments = Math.round(goal / 0.25)
  const filled = Math.round(totalLiters / 0.25)

  return (
    <div className="space-y-4">
      {/* Progress card */}
      <div className="glass p-6 text-center" style={{ borderRadius: 18 }}>
        <div className="text-[11px] num uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--text-2)' }}>
          Hidratación hoy
        </div>
        <div className="text-[52px] font-bold num leading-none mb-1" style={{ color: '#38bdf8' }}>
          {totalLiters.toFixed(2)}
        </div>
        <div className="text-[13px] num" style={{ color: 'var(--text-2)' }}>
          de {goal} L meta
        </div>

        {/* Segment bar */}
        <div className="flex gap-1 mt-5 justify-center flex-wrap">
          {Array.from({ length: Math.min(segments, 16) }).map((_, i) => (
            <div
              key={i}
              className="transition-all duration-300"
              style={{
                width: 20,
                height: 28,
                borderRadius: 6,
                background: i < filled
                  ? `linear-gradient(180deg, #38bdf8, #0ea5e9)`
                  : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>

        <div className="mt-3 text-[12px] num" style={{ color: pct >= 1 ? '#34d399' : 'var(--text-2)' }}>
          {pct >= 1 ? '¡Meta alcanzada!' : `Faltan ${(goal - totalLiters).toFixed(2)} L`}
        </div>
      </div>

      {/* Quick add */}
      <div className="glass p-4" style={{ borderRadius: 18 }}>
        <div className="text-[11px] num uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--text-2)' }}>
          Agregar rápido
        </div>
        <div className="grid grid-cols-5 gap-2">
          {QUICK_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => void addWater(amount)}
              className="py-2.5 rounded-xl text-[12px] font-semibold num transition-colors lift"
              style={{
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.2)',
                color: '#38bdf8',
              }}
            >
              +{amount < 1 ? `${amount * 1000}ml` : `${amount}L`}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      {logs.length > 0 && (
        <div className="glass p-4" style={{ borderRadius: 18 }}>
          <div className="text-[11px] num uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--text-2)' }}>
            Registros de hoy
          </div>
          <div className="space-y-2">
            {logs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}
              >
                <div className="flex items-center gap-2">
                  <Droplets size={14} style={{ color: '#38bdf8' }} />
                  <span className="text-[13px] num font-semibold" style={{ color: 'var(--text-0)' }}>
                    {log.liters >= 1 ? `${log.liters} L` : `${log.liters * 1000} ml`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                    {new Date(log.logged_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => void removeWater(log.id)}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                    style={{ color: 'var(--text-2)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
