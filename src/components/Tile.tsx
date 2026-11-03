import type { ReactNode } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import { Orb } from './Orb'
import { StockMeter, type StockLevel } from './StockMeter'
import { cn } from '@/lib/cn'

interface TileBase {
  /** Máximo 2 líneas */
  label: string
  /** Estado del tile (DS §3.6) */
  variant?: 'static' | 'interactive' | 'alert'
  /** Solo con variant="alert" */
  tone?: 'warning' | 'danger'
  aspect?: '1x1' | '2x1'
  onClick?: () => void
  className?: string
}

/** Contenido genérico: label · visual · valor */
interface BasicContent {
  content?: 'basic'
  /** Valor numérico, máximo 6 caracteres; si no cabe es otro componente */
  value?: string
  unit?: string
  /** Dial, gauge, ícono o nada */
  visual?: ReactNode
}

/** Stock (Home): label · StockMeter 10 × 20 · valor + unidad · caption */
interface MeterContent {
  content: 'meter'
  value: string
  unit: string
  caption: string
  level: StockLevel
  /** Segmentos llenos, 0–10 */
  fill: number
}

/** Este mes (Home): label · Orb outline de 115 px con valor + caption */
interface OrbContent {
  content: 'orb'
  value: string
  caption: string
}

/** Uso por método (Home): label · valor + unidad · barra · caption con el porcentaje escrito */
interface BarContent {
  content: 'bar'
  value: string
  unit: string
  /** Relleno de la barra, 0–1 */
  share: number
  /** "60% del mes": el porcentaje siempre va escrito, no solo como barra */
  caption: string
}

export type TileProps = TileBase & (BasicContent | MeterContent | OrbContent | BarContent)

function Value({ value, unit, toneText }: { value: string; unit?: string; toneText?: string }) {
  return (
    <span className={cn('flex items-baseline gap-1', toneText ?? 'text-fg')}>
      <span className="t-num-lg">{value}</span>
      {unit ? <span className="t-caption text-fg-2">{unit}</span> : null}
    </span>
  )
}

export function Tile(props: TileProps) {
  const { label, variant = 'static', tone = 'warning', aspect = '1x1', onClick, className } = props
  const alert = variant === 'alert'
  const toneText = alert ? (tone === 'danger' ? 'text-danger' : 'text-warning') : undefined
  const ToneIcon = tone === 'danger' ? CircleAlert : TriangleAlert

  const classes = cn(
    'flex flex-col rounded-tile bg-surface-2 p-4 text-left',
    aspect === '1x1' ? 'aspect-square' : 'aspect-[2/1]',
    alert && cn('border', tone === 'danger' ? 'border-danger' : 'border-warning'),
    variant === 'interactive' && 'pressable w-full active:bg-surface-3',
    className,
  )

  const header = (
    <span className="flex items-start justify-between gap-2">
      <span className="t-label line-clamp-2 text-fg-3">{label}</span>
      {alert ? <ToneIcon size={16} strokeWidth={1.5} className={toneText} aria-hidden="true" /> : null}
    </span>
  )

  let body: ReactNode
  switch (props.content) {
    case 'meter':
      body = (
        <>
          {header}
          <StockMeter
            className="mt-4"
            level={props.level}
            gramsText={`${props.value} ${props.unit}`}
            preparations={0}
            fill={props.fill}
            hideMessage
            ariaText={`${props.value} ${props.unit}, ${props.caption}`}
          />
          <span className="mt-auto flex flex-col gap-2">
            <Value value={props.value} unit={props.unit} toneText={toneText} />
            <span className="t-caption text-fg-2">{props.caption}</span>
          </span>
        </>
      )
      break
    case 'orb':
      body = (
        <>
          {header}
          <span className="flex flex-1 items-center justify-center">
            <Orb variant="outline" size="tile" value={props.value} caption={props.caption} />
          </span>
        </>
      )
      break
    case 'bar':
      body = (
        <>
          {header}
          <span className="mt-4">
            <Value value={props.value} unit={props.unit} toneText={toneText} />
          </span>
          <span className="mt-auto flex flex-col gap-3">
            <span className="block h-2 w-full overflow-hidden rounded-[calc(var(--radius-xs)/2)] bg-track" aria-hidden="true">
              {/* Relleno en --text-1, no en crema: crema significa "ahora" (P-03) */}
              <span
                className="block h-full rounded-[calc(var(--radius-xs)/2)] bg-fg"
                style={{ width: `${Math.round(Math.min(1, Math.max(0, props.share)) * 100)}%` }}
              />
            </span>
            <span className="t-caption text-fg-2">{props.caption}</span>
          </span>
        </>
      )
      break
    default:
      body = (
        <>
          {header}
          {props.visual ? (
            <span className="flex flex-1 items-center justify-center">{props.visual}</span>
          ) : (
            <span className="flex-1" />
          )}
          {props.value !== undefined ? <Value value={props.value} unit={props.unit} toneText={toneText} /> : null}
        </>
      )
  }

  if (variant === 'interactive') {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    )
  }
  return <div className={classes}>{body}</div>
}
