import { CircleAlert, TriangleAlert } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/cn'

export type StockLevel = 'ok' | 'low' | 'critical' | 'depleted'

export interface StockMeterProps {
  /** Estado según D-09, calculado fuera (lib/inventory, fase 5) */
  level: StockLevel
  /** Gramos actuales, ya formateado: "145 g" */
  gramsText: string
  /** Preparaciones restantes: floor(stock / dosis) */
  preparations: number
  /** Segmentos llenos, 0–10 */
  fill: number
  size?: 'compact' | 'profile'
  /** Acción del estado agotado: "Marcar como terminado" */
  onMarkFinished?: () => void
  /** Oculta el texto visible (el Tile de Home muestra valor y caption propios). El texto queda en el aria-label. */
  hideMessage?: boolean
  /** Texto accesible propio cuando el medidor no lleva el copy de D-09 (Tile de Home) */
  ariaText?: string
  className?: string
}

const SEGMENTS = 10

const FILL_COLOR: Record<StockLevel, string> = {
  ok: 'bg-fg',
  low: 'bg-warning',
  critical: 'bg-danger',
  depleted: 'bg-danger',
}

/** Copy de D-09. Nunca se comunica el estado solo con color. */
function message(level: StockLevel, gramsText: string, n: number): string {
  const preps = n === 1 ? '1 preparación' : `${n} preparaciones`
  switch (level) {
    case 'ok':
      return `${gramsText} · ~${preps}`
    case 'low':
      return `Te queda poco: ~${preps}`
    case 'critical':
      return 'Alcanza para 1 preparación más'
    case 'depleted':
      return 'No alcanza para otra taza. ¿Lo marcamos como terminado?'
  }
}

export function StockMeter({
  level,
  gramsText,
  preparations,
  fill,
  size = 'profile',
  onMarkFinished,
  hideMessage = false,
  ariaText,
  className,
}: StockMeterProps) {
  const text = message(level, gramsText, preparations)
  const colorText = level === 'ok' ? 'text-fg' : level === 'low' ? 'text-warning' : 'text-danger'
  const Icon = level === 'low' ? TriangleAlert : level === 'ok' ? null : CircleAlert
  const filled = Math.max(0, Math.min(SEGMENTS, Math.round(fill)))

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <div
          role="img"
          aria-label={`Stock: ${filled} de ${SEGMENTS} segmentos. ${ariaText ?? text}`}
          className="flex gap-[3px]"
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                'rounded-[calc(var(--radius-xs)/2)]',
                size === 'compact' ? 'h-3 w-1.5' : 'h-5 w-2.5',
                i < filled ? FILL_COLOR[level] : 'bg-track',
              )}
            />
          ))}
        </div>
        {Icon ? <Icon size={size === 'compact' ? 16 : 20} strokeWidth={1.5} className={colorText} aria-hidden="true" /> : null}
      </div>
      {size === 'profile' && !hideMessage ? <p className={cn('t-body', colorText)}>{text}</p> : null}
      {level === 'depleted' && onMarkFinished ? (
        <Button variant="danger" size="md" onClick={onMarkFinished} className="self-start">
          Marcar como terminado
        </Button>
      ) : null}
    </div>
  )
}
