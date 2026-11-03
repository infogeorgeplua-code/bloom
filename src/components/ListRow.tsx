import type { ReactNode } from 'react'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ListRowProps {
  /** Miniatura 56 px sobre --surface-photo (foto de la bolsa o ícono) */
  thumb?: ReactNode
  title: string
  /** Solo el proceso: "NATURAL ANAERÓBICO" (el origen vive en el perfil del café) */
  subtitle?: string
  /** Gramos sin unidad: "145" */
  grams?: string
  /** Stock bajo (< 50 g, D-09): gramos en --warning y ícono, nunca solo color */
  low?: boolean
  href?: string
  onClick?: () => void
  className?: string
}

/** Café en biblioteca (DS §3.15 v1.2). Alto 72, divisor inferior, sin StockMeter. */
export function ListRow({ thumb, title, subtitle, grams, low = false, href, onClick, className }: ListRowProps) {
  const classes = cn(
    'flex h-[72px] w-full items-center gap-3 border-b border-line py-2 text-left',
    (href || onClick) && 'pressable active:bg-surface-2',
    className,
  )

  const content = (
    <>
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-field bg-surface-photo text-fg-inverse-2">
        {thumb}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="t-body truncate font-medium text-fg">{title}</span>
        {subtitle ? <span className="t-label truncate text-fg-3">{subtitle}</span> : null}
      </span>
      {grams !== undefined ? (
        <span className={cn('flex shrink-0 items-baseline gap-1', low ? 'text-warning' : 'text-fg')}>
          {low ? (
            <TriangleAlert size={14} strokeWidth={1.5} className="self-center" aria-label="Stock bajo" role="img" />
          ) : null}
          {/* TODO(ds-pendiente): P-21 — Figma usa mono 14 px, sin token; se usa body (15 px) en mono */}
          <span className="t-body num">{grams}</span>
          <span className="t-caption text-fg-2">g</span>
        </span>
      ) : null}
      {href || onClick ? (
        <ChevronRight size={20} strokeWidth={1.5} className="shrink-0 text-fg-3" aria-hidden="true" />
      ) : null}
    </>
  )

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    )
  }
  return <div className={classes}>{content}</div>
}
