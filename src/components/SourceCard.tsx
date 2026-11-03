import { Star, ArrowUpRight } from 'lucide-react'
import { TrustBadge, type TrustStatus } from './TrustBadge'
import { cn } from '@/lib/cn'

export interface SourceCardProps {
  /** "Tetsu Kasuya · Método 4:6" */
  name: string
  /** "World Brewers Cup 2016" */
  context?: string
  /** "Adaptación: ratio 1:15 para tueste oscuro" */
  adaptation?: string
  /** Texto del enlace: "wcc.coffee" */
  linkText?: string
  href?: string
  /** Estado de confianza de la fuente (variante por defecto) */
  status?: TrustStatus
  /** Variante "historial": reemplaza el TrustBadge por una estrella de receta bloqueada */
  history?: boolean
  className?: string
}

/** Trazabilidad de receta (DS §3.18). */
export function SourceCard({
  name,
  context,
  adaptation,
  linkText,
  href,
  status = 'verificado',
  history = false,
  className,
}: SourceCardProps) {
  return (
    <section className={cn('flex flex-col gap-1 rounded-tile bg-surface-2 p-4', className)}>
      <div className="mb-1 flex items-center justify-between">
        <span className="t-label text-fg-3">{history ? 'HISTORIAL' : 'BASE'}</span>
        {history ? (
          <Star
            size={20}
            strokeWidth={1.5}
            className="fill-accent text-accent"
            aria-label="Receta bloqueada"
            role="img"
          />
        ) : (
          <TrustBadge status={status} />
        )}
      </div>
      <p className="t-body font-semibold text-fg">{name}</p>
      {context ? <p className="t-caption text-fg-2">{context}</p> : null}
      {adaptation ? <p className="t-caption text-fg-2">{adaptation}</p> : null}
      {href && linkText ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="t-caption mt-1 inline-flex items-center gap-1 self-start text-fg-2 underline"
        >
          {linkText}
          <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only-text">(se abre en una pestaña nueva)</span>
        </a>
      ) : null}
    </section>
  )
}
