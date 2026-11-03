import { Play, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

/** tile = 115 px dentro del tile "Este mes" (DS §3.6 v1.2) */
export type OrbSize = 'tile' | 'sm' | 'md' | 'lg'

export interface OrbProps {
  size?: OrbSize
  /** solid: foco de la vista (máximo uno por vista) · outline · action: CTA "Hacer café" */
  variant?: 'solid' | 'outline' | 'action'
  label?: string
  value?: string
  caption?: string
  /** Ícono en lugar de número (estado vacío, DS §4.6) */
  icon?: LucideIcon
  /** Obligatorio con variant="action" */
  'aria-label'?: string
  onClick?: () => void
  className?: string
}

const SIZE: Record<OrbSize, string> = {
  tile: 'size-[115px]',
  sm: 'size-24',
  md: 'size-40',
  lg: 'size-[220px]',
}

/**
 * Regla del DS: máximo un orb sólido por vista. Si hay dos datos héroe,
 * el segundo es `outline`. (No se puede forzar desde un componente aislado.)
 */
export function Orb({
  size = 'md',
  variant = 'solid',
  label,
  value,
  caption,
  icon: Icon,
  onClick,
  className,
  'aria-label': ariaLabel,
}: OrbProps) {
  const base = cn(
    'flex shrink-0 flex-col items-center justify-center rounded-pill text-center',
    SIZE[size],
    variant === 'outline'
      ? 'border-[length:var(--stroke-instrument)] border-fg-2 text-fg'
      : 'bg-orb text-fg-inverse',
    className,
  )

  if (variant === 'action') {
    return (
      <button
        type="button"
        aria-label={ariaLabel ?? 'Hacer café'}
        onClick={onClick}
        className={cn(base, 'pressable items-center')}
      >
        <Play size={size === 'sm' || size === 'tile' ? 28 : 40} strokeWidth={1.5} aria-hidden="true" />
      </button>
    )
  }

  const small = size === 'sm' || size === 'tile'
  return (
    <div className={base} role={ariaLabel ? 'group' : undefined} aria-label={ariaLabel}>
      {label ? <span className="t-label opacity-80">{label}</span> : null}
      {Icon ? <Icon size={small ? 28 : 40} strokeWidth={1.5} aria-hidden="true" /> : null}
      {value !== undefined ? <span className={small ? 't-num-lg' : 't-num-xl'}>{value}</span> : null}
      {caption ? <span className="t-caption opacity-80">{caption}</span> : null}
    </div>
  )
}
