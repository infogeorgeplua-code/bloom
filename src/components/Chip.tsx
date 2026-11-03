import type { ButtonHTMLAttributes, Ref } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  icon?: LucideIcon
  /**
   * 'pressed' (default): botón de alternancia con aria-pressed (selección múltiple).
   * 'radio': role="radio" con aria-checked (selección única; lo usa ChipGrid).
   */
  semantics?: 'pressed' | 'radio'
  /** 'grid' = alto 48 con texto centrado (ChipGrid, DS §3.4) */
  size?: 'default' | 'grid'
  ref?: Ref<HTMLButtonElement>
}

export function Chip({
  selected = false,
  icon: Icon,
  semantics = 'pressed',
  size = 'default',
  className,
  children,
  type = 'button',
  ref,
  ...rest
}: ChipProps) {
  const a11y =
    semantics === 'radio'
      ? { role: 'radio' as const, 'aria-checked': selected }
      : { 'aria-pressed': selected }
  return (
    <button
      ref={ref}
      type={type}
      {...a11y}
      className={cn(
        't-body pressable inline-flex select-none items-center gap-2 rounded-chip px-4',
        size === 'grid' ? 'h-12 justify-center text-center' : 'h-10',
        selected ? 'bg-inverse text-fg-inverse' : 'bg-surface-2 text-fg-2',
        'disabled:cursor-not-allowed disabled:text-fg-disabled',
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={20} strokeWidth={1.5} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
