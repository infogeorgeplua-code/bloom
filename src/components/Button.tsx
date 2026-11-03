import type { ButtonHTMLAttributes, Ref } from 'react'
import { LoaderCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
export type ButtonSize = 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** md 48 · lg 56 (CTA) · xl 64 (Brew Mode) */
  size?: ButtonSize
  icon?: LucideIcon
  /** Dato en Geist Mono 500 al final del botón */
  datum?: string
  /** Mantiene el texto para no cambiar el ancho (DS §3.1) */
  loading?: boolean
  fullWidth?: boolean
  ref?: Ref<HTMLButtonElement>
}

const SIZE: Record<ButtonSize, string> = {
  md: 'h-12',
  lg: 'h-14',
  xl: 'h-16',
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-inverse text-fg-inverse active:bg-[var(--ink-200)] disabled:bg-surface-3 disabled:text-fg-disabled',
  secondary:
    'border border-line-strong bg-transparent text-fg active:bg-surface-3 disabled:border-line disabled:text-fg-disabled',
  tertiary: 'bg-transparent text-fg-2 active:text-fg disabled:text-fg-disabled',
  danger:
    'border border-danger bg-transparent text-danger active:bg-surface-3 disabled:border-line disabled:text-fg-disabled',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  datum,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        't-button pressable inline-flex select-none items-center justify-center gap-2 rounded-pill px-6',
        'disabled:cursor-not-allowed',
        SIZE[size],
        VARIANT[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <LoaderCircle size={20} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
      {datum ? <span className="num font-medium">{datum}</span> : null}
    </button>
  )
}
