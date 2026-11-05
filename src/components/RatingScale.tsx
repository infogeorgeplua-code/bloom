'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export type RatingLevel = 1 | 2 | 3 | 4 | 5

export interface RatingScaleProps {
  value: RatingLevel | null
  /** Al seleccionar avanza solo: no hay botón "Enviar" (DS §3.25) */
  onChange: (level: RatingLevel) => void
  className?: string
}

/** Copy de los 5 niveles (product §10.1, D-11) */
export const RATING_LABEL: Record<RatingLevel, string> = {
  1: 'No me gustó',
  2: 'Le falta algo',
  3: 'Quedó bien',
  4: 'Muy rica',
  5: 'De campeonato',
}

const LEVELS = ([1, 2, 3, 4, 5] as const).map((level) => ({ level, label: RATING_LABEL[level] }))

/** Pregunta de cierre "¿Qué tal esta receta?" — lista vertical, sin números visibles (D-11). */
export function RatingScale({ value, onChange, className }: RatingScaleProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const select = (index: number) => {
    const clamped = Math.min(LEVELS.length - 1, Math.max(0, index))
    const target = LEVELS[clamped]
    if (!target) return
    onChange(target.level)
    refs.current[clamped]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      select(index + 1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      select(index - 1)
    }
  }

  const tabStop = value ? value - 1 : 0

  return (
    <div
      role="radiogroup"
      aria-label="¿Qué tal esta receta?"
      className={cn('flex flex-col gap-2', className)}
    >
      {LEVELS.map(({ level, label }, i) => {
        const selected = value === level
        return (
          <button
            key={level}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(level)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              't-body-lg pressable flex h-14 w-full items-center gap-3 rounded-pill px-5 text-left',
              selected ? 'bg-inverse text-fg-inverse' : 'bg-surface-2 text-fg',
            )}
          >
            {level === 5 ? (
              <Star size={20} strokeWidth={1.5} className="fill-accent text-accent" aria-hidden="true" />
            ) : null}
            <span className="flex-1">{label}</span>
            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 items-center justify-center rounded-pill border',
                selected ? 'border-fg-inverse' : 'border-line-strong',
              )}
            >
              {selected ? <span className="size-2.5 rounded-pill bg-fg-inverse" /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
