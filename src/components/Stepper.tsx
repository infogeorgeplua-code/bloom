'use client'

/* La pulsación larga necesita temporizadores mutables que solo se leen y escriben en
   manejadores de eventos y efectos, nunca durante el render. El lint del React Compiler
   no puede demostrarlo, por eso se desactiva solo en este archivo. */
/* eslint-disable react-hooks/immutability */

import { useCallback, useEffect, useState, type MouseEvent, type PointerEvent } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Texto a mostrar (ya formateado, p. ej. "15 g"). Por defecto, el número. */
  display?: string
  /** Nombre accesible del grupo, p. ej. "Gramos de café" */
  'aria-label': string
  className?: string
}

const LONG_PRESS_DELAY_MS = 400
const LONG_PRESS_REPEAT_MS = 120

interface PressState {
  value: number
  delay: ReturnType<typeof setTimeout> | null
  repeat: ReturnType<typeof setInterval> | null
}

/** Ajuste de gramos, tazas o stock manual. Long-press acelera (DS §3.5). */
export function Stepper({
  value,
  onChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  display,
  className,
  'aria-label': ariaLabel,
}: StepperProps) {
  // Estado mutable de la pulsación larga: un objeto estable, no un ref de React
  const [press] = useState<PressState>(() => ({ value, delay: null, repeat: null }))

  useEffect(() => {
    press.value = value
  }, [press, value])

  const stop = useCallback(() => {
    if (press.delay) clearTimeout(press.delay)
    if (press.repeat) clearInterval(press.repeat)
    press.delay = null
    press.repeat = null
  }, [press])

  useEffect(() => stop, [stop])

  const apply = useCallback(
    (dir: 1 | -1) => {
      const raw = Math.round((press.value + dir * step) * 1000) / 1000
      const next = Math.min(max, Math.max(min, raw))
      if (next !== press.value) {
        press.value = next
        onChange(next)
      }
    },
    [press, step, min, max, onChange],
  )

  const start = (dir: 1 | -1) => {
    stop()
    apply(dir)
    press.delay = setTimeout(() => {
      press.repeat = setInterval(() => apply(dir), LONG_PRESS_REPEAT_MS)
    }, LONG_PRESS_DELAY_MS)
  }

  const btn =
    'pressable inline-flex size-12 shrink-0 items-center justify-center rounded-pill text-fg disabled:cursor-not-allowed disabled:text-fg-disabled'

  const handlers = (dir: 1 | -1) => ({
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      start(dir)
    },
    onPointerUp: () => stop(),
    onPointerLeave: () => stop(),
    onPointerCancel: () => stop(),
    // Teclado: Enter/Espacio disparan click con detail 0 y sin pointerdown
    onClick: (e: MouseEvent) => {
      if (e.detail === 0) apply(dir)
    },
  })

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-14 items-center rounded-pill border border-line-strong px-1',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Disminuir"
        className={btn}
        disabled={value <= min}
        {...handlers(-1)}
      >
        <Minus size={24} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <output aria-live="polite" className="t-num-md min-w-20 select-none px-2 text-center text-fg">
        {display ?? String(value)}
      </output>
      <button
        type="button"
        aria-label="Aumentar"
        className={btn}
        disabled={value >= max}
        {...handlers(1)}
      >
        <Plus size={24} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  )
}
