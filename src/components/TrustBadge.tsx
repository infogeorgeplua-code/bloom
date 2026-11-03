'use client'

import { useId, useState } from 'react'
import { BadgeCheck, Eye } from 'lucide-react'
import { cn } from '@/lib/cn'

export type TrustStatus = 'observado' | 'verificado' | 'inferido'

export interface TrustBadgeProps {
  status: TrustStatus
  /** inline = solo ícono de 14 px junto al dato, con tooltip al tocar */
  inline?: boolean
  className?: string
}

const COPY: Record<TrustStatus, string> = {
  observado: 'Observado',
  verificado: 'Verificado',
  inferido: 'Inferido',
}

const TONE: Record<TrustStatus, string> = {
  observado: 'text-fg-2 border-line border-solid',
  verificado: 'text-success border-success/40 border-solid',
  inferido: 'text-warning border-warning border-dashed',
}

function Glyph({ status, size }: { status: TrustStatus; size: number }) {
  if (status === 'observado') return <Eye size={size} strokeWidth={1.5} aria-hidden="true" />
  if (status === 'verificado') return <BadgeCheck size={size} strokeWidth={1.5} aria-hidden="true" />
  return (
    <span aria-hidden="true" className="leading-none" style={{ fontSize: size }}>
      ≈
    </span>
  )
}

/** Sistema de confianza (DS §3.17). El estado nunca se comunica solo con color. */
export function TrustBadge({ status, inline = false, className }: TrustBadgeProps) {
  const [open, setOpen] = useState(false)
  const tipId = useId()

  if (!inline) {
    return (
      <span
        className={cn(
          't-label inline-flex h-6 items-center gap-1 rounded-pill border px-2',
          TONE[status],
          className,
        )}
      >
        <Glyph status={status} size={14} />
        {COPY[status]}
      </span>
    )
  }

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={COPY[status]}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        className={cn('inline-flex size-6 items-center justify-center rounded-pill', TONE[status].split(' ')[0])}
      >
        <Glyph status={status} size={14} />
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="t-caption absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-chip bg-surface-3 px-2 py-1 text-fg"
        >
          {COPY[status]}
        </span>
      ) : null}
    </span>
  )
}
