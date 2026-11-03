'use client'

import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { Stepper } from './Stepper'
import { cn } from '@/lib/cn'

export interface GaugeProps {
  min: number
  max: number
  value: number
  /** Arco de 180° o 270° (DS §3.9) */
  sweep?: 180 | 270
  /** Valor ya formateado, mostrado fuera del dial en num-lg */
  valueText?: string
  /** Nombre accesible */
  'aria-label': string
  className?: string
}

const CX = 100
const CY = 100
const R = 80

/** Ángulo (grados, 0 = arriba, sentido horario) del inicio del arco para cada barrido. */
const startAngle = (sweep: 180 | 270) => -sweep / 2

/** Redondeado para que servidor y cliente generen exactamente el mismo SVG (sin errores de hidratación). */
const round = (n: number) => Math.round(n * 1000) / 1000

function polar(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: round(CX + radius * Math.cos(rad)), y: round(CY + radius * Math.sin(rad)) }
}

function arcPath(sweep: 180 | 270) {
  const a0 = startAngle(sweep)
  const p0 = polar(a0, R)
  const p1 = polar(a0 + sweep, R)
  const large = sweep > 180 ? 1 : 0
  return `M ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y}`
}

function Dial({
  min,
  max,
  value,
  sweep,
}: {
  min: number
  max: number
  value: number
  sweep: 180 | 270
}) {
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)))
  const a0 = startAngle(sweep)
  const needleAngle = a0 + sweep * ratio
  const tip = polar(needleAngle, R - 8)
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const long = i % 5 === 0
    const angle = a0 + (sweep * i) / 10
    return { a: polar(angle, R + 4), b: polar(angle, R + (long ? 14 : 9)), key: i }
  })

  return (
    <svg
      viewBox={sweep === 180 ? '0 0 200 130' : '0 0 200 200'}
      className="block w-full"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={arcPath(sweep)}
        fill="none"
        className="stroke-fg-2"
        style={{ strokeWidth: 'var(--stroke-instrument)' }}
        strokeLinecap="round"
      />
      {ticks.map((t) => (
        <line
          key={t.key}
          x1={t.a.x}
          y1={t.a.y}
          x2={t.b.x}
          y2={t.b.y}
          className="stroke-fg-2"
          style={{ strokeWidth: 'var(--stroke-instrument)' }}
        />
      ))}
      <line
        x1={CX}
        y1={CY}
        x2={tip.x}
        y2={tip.y}
        className="stroke-fg"
        style={{ strokeWidth: 'var(--stroke-instrument)' }}
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r={6} className="fill-fg" />
    </svg>
  )
}

export function Gauge({
  min,
  max,
  value,
  sweep = 270,
  valueText,
  className,
  'aria-label': ariaLabel,
}: GaugeProps) {
  return (
    <figure className={cn('m-0 flex flex-col items-center gap-2', className)}>
      <div role="img" aria-label={`${ariaLabel}: ${valueText ?? value}`} className="w-full max-w-48">
        <Dial min={min} max={max} value={value} sweep={sweep} />
      </div>
      <figcaption className="t-num-lg text-fg">{valueText ?? String(value)}</figcaption>
    </figure>
  )
}

export interface DialInputProps extends Omit<GaugeProps, 'value'> {
  value: number
  onChange: (value: number) => void
  step?: number
  /** Formatea el valor (p. ej. formatTemp) */
  format?: (value: number) => string
}

/**
 * Gauge interactivo: la aguja se arrastra. Alternativa obligatoria con Stepper
 * (DS §3.9): role="slider", aria-valuemin/max/now y flechas ±step.
 */
export function DialInput({
  min,
  max,
  value,
  onChange,
  step = 1,
  sweep = 270,
  format,
  className,
  'aria-label': ariaLabel,
}: DialInputProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const text = format ? format(value) : String(value)

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max])
  const snap = useCallback(
    (v: number) => clamp(Math.round((v - min) / step) * step + min),
    [clamp, min, step],
  )

  const fromPointer = (e: PointerEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const scale = rect.width / 200
    const cx = rect.left + CX * scale
    const cy = rect.top + CY * scale
    let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90
    if (deg > 180) deg -= 360
    const a0 = startAngle(sweep)
    const ratio = Math.min(1, Math.max(0, (deg - a0) / sweep))
    onChange(snap(min + ratio * (max - min)))
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(clamp(value + step))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(clamp(value - step))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(min)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(max)
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          fromPointer(e)
        }}
        onPointerMove={(e) => {
          if (dragging.current) fromPointer(e)
        }}
        onPointerUp={() => {
          dragging.current = false
        }}
        onPointerCancel={() => {
          dragging.current = false
        }}
        className="w-full max-w-48 touch-none rounded-field"
      >
        <Dial min={min} max={max} value={value} sweep={sweep} />
      </div>
      <p className="t-num-lg text-fg">{text}</p>
      <Stepper
        aria-label={`${ariaLabel} (ajuste fino)`}
        value={value}
        min={min}
        max={max}
        step={step}
        display={text}
        onChange={(v) => onChange(clamp(v))}
      />
    </div>
  )
}
