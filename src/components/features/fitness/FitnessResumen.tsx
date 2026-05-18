'use client'

import { Droplets, Flame, Dumbbell, Apple } from 'lucide-react'
import { useFoodLogs } from '@/hooks/useFoodLogs'
import { useWaterLogs } from '@/hooks/useWaterLogs'
import { useWorkoutRoutines } from '@/hooks/useWorkoutRoutines'
import { useFitnessGoals } from '@/hooks/useFitnessGoals'

function toToday() {
  return new Date().toISOString().slice(0, 10)
}

function MacroRing({ value, goal, color, label, unit }: {
  value: number; goal?: number; color: string; label: string; unit: string
}) {
  const pct = goal ? Math.min(1, value / goal) : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg width={64} height={64} className="-rotate-90" viewBox="0 0 64 64">
          <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
          <circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div className="absolute text-center">
          <div className="text-[12px] font-bold num leading-none" style={{ color: 'var(--text-0)' }}>
            {Math.round(value)}
          </div>
        </div>
      </div>
      <div className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{label}</div>
      {goal && (
        <div className="text-[10px] num" style={{ color }}>/{goal}{unit}</div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)' }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        <span className="text-[11px] num uppercase tracking-[0.12em]" style={{ color: 'var(--text-2)' }}>{label}</span>
      </div>
      <div className="text-[24px] font-bold num leading-none" style={{ color: 'var(--text-0)' }}>{value}</div>
      {sub && <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>{sub}</div>}
    </div>
  )
}

export function FitnessResumen() {
  const today = toToday()
  const { macros, loading: macrosLoading } = useFoodLogs(today)
  const { totalLiters, loading: waterLoading } = useWaterLogs(today)
  const { routines } = useWorkoutRoutines()
  const { goalsMap } = useFitnessGoals()

  const calGoal = goalsMap['daily_calories']
  const protGoal = goalsMap['daily_protein']
  const carbGoal = goalsMap['daily_carbs']
  const fatGoal = goalsMap['daily_fat']
  const waterGoal = goalsMap['daily_water_liters'] ?? 2

  const date = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="text-[12px] capitalize" style={{ color: 'var(--text-2)' }}>{date}</div>

      {/* Macro rings */}
      <div className="glass p-5" style={{ borderRadius: 18 }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
            <Flame size={14} />
          </div>
          <h2 className="text-[15px] font-semibold display" style={{ color: 'var(--text-0)' }}>Nutrición de hoy</h2>
        </div>

        {macrosLoading ? (
          <div className="flex justify-around">
            {[1,2,3,4].map(i => <div key={i} className="w-16 h-20 rounded-xl animate-shimmer" />)}
          </div>
        ) : (
          <div className="flex justify-around">
            <MacroRing value={macros.calories} goal={calGoal} color="#f97316" label="Calorías" unit="kcal" />
            <MacroRing value={macros.protein}  goal={protGoal} color="#8b5cf6" label="Proteína" unit="g" />
            <MacroRing value={macros.carbs}    goal={carbGoal} color="#fbbf24" label="Carbos" unit="g" />
            <MacroRing value={macros.fat}      goal={fatGoal}  color="#f87171" label="Grasas" unit="g" />
          </div>
        )}
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Droplets size={14} />}
          label="Agua"
          value={`${totalLiters.toFixed(1)} L`}
          sub={waterLoading ? '…' : `meta: ${waterGoal} L`}
          color="#38bdf8"
        />
        <StatCard
          icon={<Apple size={14} />}
          label="Comidas"
          value={String(macros.logs.length)}
          sub="registros hoy"
          color="#34d399"
        />
        <StatCard
          icon={<Dumbbell size={14} />}
          label="Rutinas"
          value={String(routines.length)}
          sub="creadas"
          color="#8b5cf6"
        />
        <StatCard
          icon={<Flame size={14} />}
          label="Cal restantes"
          value={calGoal ? String(Math.max(0, calGoal - Math.round(macros.calories))) : '—'}
          sub={calGoal ? 'para la meta' : 'sin meta'}
          color="#f97316"
        />
      </div>
    </div>
  )
}
