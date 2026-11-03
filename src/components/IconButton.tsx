import type { ButtonHTMLAttributes, Ref } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Obligatorio: un botón solo con ícono necesita nombre accesible */
  label: string
  icon: LucideIcon
  /** md 48 · xl 64 (Brew Mode) */
  size?: 'md' | 'xl'
  variant?: 'surface' | 'ghost'
  ref?: Ref<HTMLButtonElement>
}

export function IconButton({
  label,
  icon: Icon,
  size = 'md',
  variant = 'surface',
  className,
  type = 'button',
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'pressable inline-flex shrink-0 select-none items-center justify-center rounded-pill text-fg',
        size === 'md' ? 'size-12' : 'size-16',
        variant === 'surface'
          ? 'bg-surface-2 active:bg-surface-3'
          : 'bg-transparent active:bg-surface-2',
        // En Figma, el IconButton xl (pausa del Brew Mode) lleva borde 1 px --border-strong
        variant === 'surface' && size === 'xl' && 'border border-line-strong',
        'disabled:cursor-not-allowed disabled:text-fg-disabled',
        className,
      )}
      {...rest}
    >
      <Icon size={size === 'md' ? 24 : 28} strokeWidth={1.5} aria-hidden="true" />
    </button>
  )
}
