'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

// ─── useAnimatedNumber ────────────────────────────────────────
export function useAnimatedNumber(target: number, duration = 800): number {
  const [val, setVal] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    let raf: number
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ─── XPBar ────────────────────────────────────────────────────
interface XPBarProps {
  value: number
  max: number
  height?: number
  animated?: boolean
}

export function XPBar({ value, max, height = 6, animated = true }: XPBarProps) {
  const pct = Math.max(0, Math.min(1, value / (max || 1))) * 100
  return (
    <div className="xp-track relative" style={{ height }}>
      <div
        className={`xp-fill relative overflow-hidden${animated ? ' xp-shimmer' : ''}`}
        style={{ width: `${pct}%`, height: '100%' }}
      />
    </div>
  )
}

// ─── ProgressRing ─────────────────────────────────────────────
interface ProgressRingProps {
  size?: number
  stroke?: number
  value?: number
  color?: string
  glow?: string
  children?: React.ReactNode
}

export function ProgressRing({
  size = 140,
  stroke = 10,
  value = 0.6,
  color = '#34d399',
  glow,
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const animated = useAnimatedNumber(value, 900)
  const offset = c * (1 - Math.max(0, Math.min(1, animated)))
  const gradId = `ring-g-${color.replace('#', '')}-${size}`
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="transparent" strokeWidth={stroke}
          className="ring-track"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="transparent"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="ring-fill"
          style={{ filter: glow ? `drop-shadow(0 0 8px ${glow})` : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

// ─── LevelBadge ──────────────────────────────────────────────
interface LevelBadgeProps {
  level?: number
  size?: number
}

export function LevelBadge({ level = 1, size = 44 }: LevelBadgeProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="hex absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }}
      />
      <div className="hex absolute" style={{ inset: 2, background: '#0b0f18' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="num uppercase"
          style={{ color: '#fbbf24', letterSpacing: '0.18em', lineHeight: 1, fontSize: Math.round(size * 0.18) }}
        >
          LVL
        </span>
        <span
          className="num font-bold leading-none"
          style={{ color: '#fff', fontSize: Math.round(size * 0.34), marginTop: 1 }}
        >
          {level}
        </span>
      </div>
    </div>
  )
}

// ─── AscendChip ──────────────────────────────────────────────
interface AscendChipProps {
  children: React.ReactNode
  color?: string
  className?: string
}

export function AscendChip({ children, color = '#aab3c2', className = '' }: AscendChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md num ${className}`}
      style={{
        color,
        background: `${color}14`,
        border: `1px solid ${color}26`,
      }}
    >
      {children}
    </span>
  )
}

// ─── Sparkline ───────────────────────────────────────────────
interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  fill?: boolean
}

export function Sparkline({ data, color = '#34d399', height = 36, fill = true, width = 140 }: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const step = width / (data.length - 1)
    return data.map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / span) * (height - 4) - 2
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    }).join(' ')
  }, [data, width, height])

  const area = useMemo(() => {
    if (!path) return ''
    return `${path} L ${width} ${height} L 0 ${height} Z`
  }, [path, width, height])

  const gid = `spark-${color.replace('#', '')}-${width}`
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && path && <path d={area} fill={`url(#${gid})`} />}
      {path && (
        <path d={path} stroke={color} strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}
