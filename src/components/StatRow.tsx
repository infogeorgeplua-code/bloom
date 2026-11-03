import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Stat {
  icon: LucideIcon
  /** "Café", "Agua", "Temp." */
  label: string
  /** Número sin unidad: "15" */
  value: string
  /** "g", "°C" */
  unit?: string
}

export interface StatRowProps {
  stats: Stat[]
  className?: string
}

/**
 * Resumen del brew en 3 columnas con divisores (DS §3.28). En Figma 09 es una imagen
 * raster (P-08); aquí es código. Sobre el BrewSummarySheet toma los colores on-inverse
 * a través de `.inverse-scope`.
 */
export function StatRow({ stats, className }: StatRowProps) {
  return (
    <dl className={cn('m-0 grid divide-x divide-line', className)} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map(({ icon: Icon, label, value, unit }) => (
        <div key={label} className="flex flex-col items-center gap-2 px-2">
          <dt className="t-caption flex items-center gap-1 text-fg-2">
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
            {label}
          </dt>
          <dd className="m-0 flex items-baseline gap-1 text-fg">
            <span className="t-num-md">{value}</span>
            {unit ? <span className="t-caption text-fg-2">{unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
