'use client'

import { useMemo, useRef, useState } from 'react'
import { RotateCw, Sparkles, ChevronLeft, Dumbbell } from 'lucide-react'
import { useWorkoutRoutines } from '@/hooks/useWorkoutRoutines'
import { musclesForExercise } from '@/constants/EXERCISES'
import {
  MUSCLE_PATHS, MUSCLE_LABELS, heatRGB, mix, rgbStr, heatGradient,
  computeVolume, computeIntensity,
  type MuscleGroup, type MusclePath, type RGB,
} from '@/lib/fitness/muscleMap'

const PALETTE = 'Azul'
const DEFAULT_SETS = 3 // series asumidas si la rutina no define target_sets

// ─── Una cara del cuerpo (front | back) ───────────────────────

function BodyFace({ which, intensity, selected, onSelect, glow }: {
  which: 'front' | 'back'
  intensity: Record<string, number>
  selected: MuscleGroup | null
  onSelect: (g: MuscleGroup) => void
  glow: boolean
}) {
  const P = MUSCLE_PATHS
  const list = P[which]
  const W = parseFloat(P.viewBox.split(' ')[2]) || 320
  const MIR = `matrix(-1,0,0,1,${W},0)`
  const skinParts: { d: string; t?: string }[] = [
    { d: P.BODY },         // silueta
    { d: P.ARM },          // brazo derecho
    { d: P.ARM, t: MIR },  // brazo izquierdo (espejado)
  ]

  const renderMuscle = (m: MusclePath) => {
    const t = intensity[m.group] || 0
    const base: RGB = heatRGB(t, PALETTE)
    const isSel = selected === m.group
    const lit = t > 0.02
    const gid = `url(#mg-${which}-${m.id})`
    const filter = glow && lit ? `drop-shadow(0 0 ${1 + t * 3.5}px ${rgbStr(mix(base, 0.15))})` : 'none'
    const op = selected && !isSel ? 0.22 : 1

    const body = (transform: string | null) => (
      <g transform={transform ?? undefined} key={transform || 'r'}>
        <path
          d={m.d} fill={gid}
          stroke={isSel ? '#cfeaff' : '#0a0d12'} strokeWidth={isSel ? 1.5 : 0.7}
          style={{ filter, cursor: 'pointer', transition: 'fill .35s ease, filter .35s, stroke .15s' }}
          onClick={(e) => { e.stopPropagation(); onSelect(m.group) }}
        />
        {m.fibers && m.fibers.map((fd, i) => (
          <path key={i} d={fd} fill="none" stroke={rgbStr(mix(base, -0.5))}
            strokeWidth="0.7" strokeLinecap="round" opacity="0.5" style={{ pointerEvents: 'none' }} />
        ))}
      </g>
    )

    return (
      <g key={m.id} style={{ opacity: op, transition: 'opacity .2s' }}>
        {body(null)}
        {m.paired && body(MIR)}
      </g>
    )
  }

  return (
    <svg viewBox={P.viewBox} preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={'skin-' + which} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#262b34" />
          <stop offset="48%" stopColor="#181c23" />
          <stop offset="100%" stopColor="#0d1016" />
        </linearGradient>
        {list.map(m => {
          const base = heatRGB(intensity[m.group] || 0, PALETTE)
          return (
            <radialGradient key={m.id} id={`mg-${which}-${m.id}`} cx="40%" cy="28%" r="72%">
              <stop offset="0%" stopColor={rgbStr(mix(base, 0.34))} />
              <stop offset="52%" stopColor={rgbStr(base)} />
              <stop offset="100%" stopColor={rgbStr(mix(base, -0.42))} />
            </radialGradient>
          )
        })}
      </defs>

      {/* piel */}
      <g>
        {skinParts.map((p, i) => (
          <path key={i} d={p.d} transform={p.t} fill={`url(#skin-${which})`}
            stroke="#0a0d12" strokeWidth="1" strokeLinejoin="round" />
        ))}
      </g>

      {/* músculos */}
      {list.map(renderMuscle)}
    </svg>
  )
}

// ─── Escenario 3D con girar + arrastre ────────────────────────

function BodyStage({ intensity, selected, onSelect, glow, rot, setRot }: {
  intensity: Record<string, number>
  selected: MuscleGroup | null
  onSelect: (g: MuscleGroup) => void
  glow: boolean
  rot: number
  setRot: (updater: number | ((r: number) => number)) => void
}) {
  const drag = useRef<{ x: number; startRot: number; moved: boolean } | null>(null)
  const norm = (((rot % 360) + 360) % 360)
  const showingBack = norm > 90 && norm < 270

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, startRot: rot, moved: false }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    if (Math.abs(dx) > 3) drag.current.moved = true
    setRot(drag.current.startRot + dx * 0.7)
  }
  const onUp = () => {
    if (!drag.current) return
    setRot((r) => Math.round(r / 180) * 180)
    drag.current = null
  }

  return (
    <div
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
      style={{
        perspective: 1400, cursor: 'grab', touchAction: 'none',
        // ancho responsive: chico en mobile, hasta 260px en desktop. El alto deriva del aspect-ratio.
        width: 'clamp(170px, 48vw, 260px)',
        aspectRatio: '320 / 660',
        margin: '0 auto',
      }}
    >
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg)`,
        transition: 'transform .12s linear',
      }}>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <BodyFace which="front" intensity={intensity} selected={selected} onSelect={onSelect} glow={glow} />
        </div>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <BodyFace which="back" intensity={intensity} selected={selected} onSelect={onSelect} glow={glow} />
        </div>
      </div>
      <div className="text-center text-[10px] num uppercase tracking-[0.3em] mt-1" style={{ color: 'var(--text-2)' }}>
        {showingBack ? 'Espalda' : 'Frente'}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────

export function MuscleMap() {
  const { routines, loading } = useWorkoutRoutines()
  const [routineId, setRoutineId] = useState<string | null>(null)
  const [selected, setSelected] = useState<MuscleGroup | null>(null)
  const [rot, setRot] = useState(0)
  const [glow, setGlow] = useState(true)

  // Rutina activa (default: la primera)
  const routine = useMemo(() => {
    if (routines.length === 0) return null
    return routines.find(r => r.id === routineId) ?? routines[0]
  }, [routines, routineId])

  // series por ejercicio
  const sets = useMemo(() => {
    const s: Record<string, number> = {}
    routine?.routine_exercises.forEach(ex => {
      s[ex.exercise_name] = (s[ex.exercise_name] || 0) + (ex.target_sets ?? DEFAULT_SETS)
    })
    return s
  }, [routine])

  const volume = useMemo(() => computeVolume(sets, musclesForExercise), [sets])
  const intensity = useMemo(() => computeIntensity(volume), [volume])
  const maxVol = useMemo(() => Math.max(...Object.values(volume), 0.0001), [volume])

  const workedSorted = useMemo(
    () => (Object.entries(volume) as [MuscleGroup, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
    [volume]
  )
  const totalSets = useMemo(() => Object.values(sets).reduce((a, b) => a + b, 0), [sets])
  const unmatched = useMemo(
    () => (routine?.routine_exercises ?? []).filter(ex => !musclesForExercise(ex.exercise_name)).length,
    [routine]
  )

  // Ejercicios que tocan el músculo seleccionado
  const selExercises = useMemo(() => {
    if (!selected || !routine) return []
    return routine.routine_exercises
      .map(ex => ({ ex, w: musclesForExercise(ex.exercise_name)?.[selected] ?? 0 }))
      .filter(x => x.w > 0)
      .sort((a, b) => b.w - a.w)
  }, [selected, routine])

  const flip = () => setRot(r => Math.round(r / 180) * 180 + 180)

  if (loading && routines.length === 0) {
    return <div className="h-80 rounded-2xl animate-shimmer" />
  }
  if (routines.length === 0) {
    return (
      <div className="text-center py-12 text-[13px]" style={{ color: 'var(--text-2)' }}>
        Creá una rutina con ejercicios y volvé acá para ver tu mapa muscular. 🧍
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selector de rutina */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] shrink-0" style={{ color: 'var(--text-2)' }}>Rutina:</span>
        <select
          value={routine?.id ?? ''}
          onChange={e => { setRoutineId(e.target.value); setSelected(null) }}
          className="flex-1 bg-transparent border rounded-xl px-3 py-2 text-[13px] font-medium"
          style={{ borderColor: 'var(--line)', color: 'var(--text-0)', outline: 'none', background: 'var(--bg-1)' }}
        >
          {routines.map(r => (
            <option key={r.id} value={r.id} style={{ background: 'var(--bg-1)' }}>
              {r.name} ({r.routine_exercises.length} ej.)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Cuerpo */}
        <div className="glass p-4 relative overflow-hidden" style={{ borderRadius: 18 }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(420px 420px at 50% 35%, rgba(46,146,255,0.08), transparent 70%)' }} />
          <BodyStage intensity={intensity} selected={selected} onSelect={setSelected} glow={glow} rot={rot} setRot={setRot} />

          <div className="flex items-center justify-center gap-2 mt-3 relative">
            <button onClick={flip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)', border: '1px solid var(--line)' }}>
              <RotateCw size={12} /> Girar
            </button>
            <button onClick={() => setGlow(g => !g)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
              style={{
                background: glow ? 'rgba(46,146,255,0.16)' : 'rgba(255,255,255,0.05)',
                color: glow ? '#58b6ff' : 'var(--text-2)',
                border: `1px solid ${glow ? 'rgba(46,146,255,0.35)' : 'var(--line)'}`,
              }}>
              <Sparkles size={12} /> Glow
            </button>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-2 justify-center mt-3 relative">
            <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>menos</span>
            <div style={{ width: 160, height: 7, borderRadius: 999, background: heatGradient(PALETTE) }} />
            <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>más volumen</span>
          </div>
          <p className="text-center text-[10px] mt-2 relative" style={{ color: 'var(--text-2)' }}>
            Arrastrá el cuerpo para girarlo · tocá un músculo para ver detalle
          </p>
        </div>

        {/* Panel */}
        <div className="glass p-4" style={{ borderRadius: 18 }}>
          {selected ? (
            <div className="space-y-3">
              <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#58b6ff' }}>
                <ChevronLeft size={13} /> volver
              </button>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: rgbStr(heatRGB(intensity[selected] || 0, PALETTE)), boxShadow: '0 0 12px currentColor', color: rgbStr(heatRGB(intensity[selected] || 0, PALETTE)) }} />
                <h3 className="text-[18px] font-bold display" style={{ color: 'var(--text-0)' }}>{MUSCLE_LABELS[selected]}</h3>
              </div>
              <div className="text-[12px] num" style={{ color: 'var(--text-2)' }}>
                Volumen: <span style={{ color: 'var(--text-0)' }}>{(volume[selected] || 0).toFixed(1)}</span> · {Math.round((intensity[selected] || 0) * 100)}% del pico
              </div>
              {selExercises.length === 0 ? (
                <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>Ningún ejercicio de esta rutina lo trabaja.</p>
              ) : (
                <div className="space-y-2">
                  {selExercises.map(({ ex, w }) => (
                    <div key={ex.id} className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                      <span className="text-[13px]" style={{ color: 'var(--text-0)' }}>{ex.exercise_name}</span>
                      <span className="text-[10px] num uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                        style={{ background: w >= 0.8 ? 'rgba(46,146,255,0.14)' : 'rgba(255,255,255,0.05)', color: w >= 0.8 ? '#58b6ff' : 'var(--text-2)' }}>
                        {w >= 0.8 ? 'principal' : 'secundario'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold display" style={{ color: 'var(--text-0)' }}>Volumen por músculo</h3>
                <span className="text-[11px] num" style={{ color: 'var(--text-2)' }}>{totalSets} series</span>
              </div>
              {workedSorted.length === 0 ? (
                <p className="text-[12px] py-6 text-center" style={{ color: 'var(--text-2)' }}>
                  Esta rutina no tiene ejercicios con datos musculares todavía.
                </p>
              ) : (
                <div className="space-y-2">
                  {workedSorted.map(([m, v]) => {
                    const t = intensity[m] || 0
                    return (
                      <button key={m} onClick={() => setSelected(m)}
                        className="w-full grid items-center gap-2 text-left" style={{ gridTemplateColumns: '96px 1fr 34px' }}>
                        <span className="text-[12px] truncate" style={{ color: 'var(--text-1)' }}>{MUSCLE_LABELS[m]}</span>
                        <span className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <span className="block h-full rounded-full" style={{ width: `${(v / maxVol) * 100}%`, background: rgbStr(heatRGB(t, PALETTE)), transition: 'width .35s ease' }} />
                        </span>
                        <span className="text-[11px] num text-right" style={{ color: 'var(--text-2)' }}>{v.toFixed(1)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {unmatched > 0 && (
                <p className="text-[11px] flex items-center gap-1.5 pt-1" style={{ color: 'var(--text-2)' }}>
                  <Dumbbell size={11} /> {unmatched} ejercicio{unmatched > 1 ? 's' : ''} sin datos musculares (no suma al mapa).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
