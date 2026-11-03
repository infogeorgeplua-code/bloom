'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Chip } from './Chip'
import { cn } from '@/lib/cn'

export interface ChipGridOption {
  value: string
  label: string
  disabled?: boolean
}

interface ChipGridBase {
  options: ChipGridOption[]
  /** 2 o 3 columnas (DS §3.4) */
  columns?: 2 | 3
  'aria-label': string
  className?: string
}

export interface ChipGridSingleProps extends ChipGridBase {
  multiple?: false
  value: string | null
  onChange: (value: string) => void
}

export interface ChipGridMultiProps extends ChipGridBase {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

export type ChipGridProps = ChipGridSingleProps | ChipGridMultiProps

/** Objetivo de taza (selección única) y síntomas post-brew (múltiple). */
export function ChipGrid(props: ChipGridProps) {
  const { options, columns = 2, className, 'aria-label': ariaLabel } = props
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const isSelected = (v: string) =>
    props.multiple ? props.value.includes(v) : props.value === v

  const toggle = (v: string) => {
    if (props.multiple) {
      props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v])
    } else {
      props.onChange(v)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (props.multiple) return
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!dir) return
    e.preventDefault()
    for (let step = 1; step <= options.length; step++) {
      const next = (index + dir * step + options.length * 2) % options.length
      const opt = options[next]
      if (opt && !opt.disabled) {
        props.onChange(opt.value)
        refs.current[next]?.focus()
        return
      }
    }
  }

  const firstSelected = options.findIndex((o) => isSelected(o.value))
  const tabStop = firstSelected >= 0 ? firstSelected : options.findIndex((o) => !o.disabled)

  return (
    <div
      role={props.multiple ? 'group' : 'radiogroup'}
      aria-label={ariaLabel}
      className={cn('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-3', className)}
    >
      {options.map((opt, i) => (
        <Chip
          key={opt.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          size="grid"
          semantics={props.multiple ? 'pressed' : 'radio'}
          selected={isSelected(opt.value)}
          disabled={opt.disabled}
          tabIndex={props.multiple ? 0 : i === tabStop ? 0 : -1}
          onClick={() => toggle(opt.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {opt.label}
        </Chip>
      ))}
    </div>
  )
}
