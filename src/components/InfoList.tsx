import { cn } from '@/lib/cn'

export interface InfoItem {
  /** Siempre el tipo de dato, nunca el nombre del paso: "Propósito", "Técnica", "Después" */
  label: string
  /** null o vacío = la fila no se renderiza (p. ej. el último paso no tiene "Después") */
  value: string | null | undefined
  /** primary = body-lg --text-1 (Propósito, lo que enseña); por defecto body --text-2 */
  emphasis?: 'primary' | 'default'
}

export interface InfoListProps {
  items: InfoItem[]
  className?: string
}

/** Lista de definición bajo el anillo del Brew Mode (DS §3.26, Figma 05). */
export function InfoList({ items, className }: InfoListProps) {
  const rows = items.filter((i) => i.value)
  if (!rows.length) return null
  return (
    <dl className={cn('m-0 flex flex-col', className)}>
      {rows.map((item, i) => (
        <div
          key={item.label}
          className={cn('flex items-baseline gap-3 py-3', i < rows.length - 1 && 'border-b border-line')}
        >
          {/* TODO(ds-pendiente): P-21 — DS/Figma fijan 52 px, pero "PROPÓSITO" en label 11 px no cabe: 72 px */}
          <dt className="t-label w-18 shrink-0 text-fg-3">{item.label}</dt>
          <dd
            className={cn(
              'm-0 min-w-0 flex-1',
              item.emphasis === 'primary' ? 't-body-lg text-fg' : 't-body text-fg-2',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
