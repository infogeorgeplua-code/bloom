import { TrustBadge, type TrustStatus } from './TrustBadge'
import { cn } from '@/lib/cn'

export interface ParamRow {
  /** "Café", "Agua", "Ratio", "Temperatura", "Molienda" */
  label: string
  /** Valor ya formateado con lib/format: "15 g"; o solo el número si se usa `unit` */
  value: string
  /** Unidad en caption junto al número (ParamRow de Figma 03): "g", "clicks", "°C" */
  unit?: string
  trust?: TrustStatus
  /** Solo en variant="diff": valor anterior (tachado) */
  before?: string
}

export interface RecipeParamsProps {
  rows: ParamRow[]
  /** list = vertical (DS §3.19) · row = fila horizontal del Home · diff = ajuste propuesto */
  variant?: 'list' | 'row' | 'diff'
  className?: string
}

export function RecipeParams({ rows, variant = 'list', className }: RecipeParamsProps) {
  if (variant === 'row') {
    return (
      <dl className={cn('m-0 flex flex-wrap justify-between gap-x-4 gap-y-2', className)}>
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt className="sr-only-text">{r.label}</dt>
            <dd className="t-num-md m-0 text-fg">{r.value}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <dl className={cn('m-0 divide-y divide-line', className)}>
      {rows.map((r) => {
        const changed = variant === 'diff' && r.before !== undefined
        return (
          <div key={r.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
            <dt className="t-body order-2 flex min-w-24 flex-1 items-center gap-2 text-fg-2">
              {r.label}
              {r.trust ? <TrustBadge status={r.trust} inline /> : null}
            </dt>
            <dd className="t-num-md order-1 m-0 flex min-w-20 shrink-0 items-baseline gap-2 text-fg">
              {changed ? (
                <>
                  <s className="text-fg-3">{r.before}</s>
                  <span aria-hidden="true">→</span>
                  <span className="sr-only-text">cambia a</span>
                </>
              ) : null}
              <span>{r.value}</span>
              {r.unit ? <span className="t-caption -ml-1 text-fg-2">{r.unit}</span> : null}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
