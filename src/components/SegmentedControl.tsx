'use client'

import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SegmentedControlProps {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  'aria-label': string
  className?: string
}

/** 2 a 3 segmentos (DS §3.3). Más de 3 → usar Chip en scroll horizontal. */
export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const count = options.length
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  const move = (from: number, dir: 1 | -1) => {
    for (let step = 1; step <= count; step++) {
      const next = (from + dir * step + count * 2) % count
      const opt = options[next]
      if (opt && !opt.disabled) {
        onChange(opt.value)
        refs.current[next]?.focus()
        return
      }
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      move(index, 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(index, -1)
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('relative flex h-12 rounded-pill bg-surface-2 p-1', className)}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-pill bg-inverse transition-transform duration-(--dur-fast) ease-(--ease-standard)"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((opt, i) => {
        const selected = i === activeIndex
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              't-button relative z-10 flex-1 rounded-pill transition-colors duration-(--dur-fast) ease-(--ease-standard)',
              selected ? 'text-fg-inverse' : 'text-fg-2',
              'disabled:cursor-not-allowed disabled:text-fg-disabled',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
