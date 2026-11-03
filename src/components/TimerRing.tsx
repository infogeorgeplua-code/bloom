import { cn } from '@/lib/cn'

/** Línea bajo el anillo (DS §3.24 v1.2) */
export type RingStatus =
  | { kind: 'remaining'; seconds: number } // "31 s restantes" (crema)
  | { kind: 'changing'; seconds: number } // últimos 3 s de un paso que avanza solo: "Cambia en 3 s" (P-06)
  | { kind: 'next'; seconds: number } // hueco entre ventanas: "Siguiente en 5 s"
  | { kind: 'inWindow' } // último paso dentro de la ventana: "En la ventana objetivo"
  | { kind: 'over'; text: string } // último paso pasada la ventana: "+0:12 sobre la meta" (P-05)

export interface TimerRingProps {
  /** Tiempo transcurrido del paso, en ms. Lo entrega el hook de la pantalla (rAF + timestamps). */
  elapsedMs: number
  /** Duración del paso, en ms */
  durationMs: number
  /**
   * grams: "Vierte hasta" + meta de gramos (num-hero).
   * time: "tiempo total" + tiempo (num-time), para pasos sin meta de gramos.
   */
  mode: 'grams' | 'time'
  /** Dato central ya formateado: "45" o "2:47" */
  primary: string
  status?: RingStatus | null
  /** Congela visualmente el anillo (el progreso no avanza porque el padre no actualiza elapsedMs) */
  paused?: boolean
  /** Diámetro CSS. Por defecto min(78vw, 300px) (DS §3.24 v1.2) */
  diameter?: string
  className?: string
}

const VIEW = 300
const C = VIEW / 2
// En Figma 05 el anillo de 300 px tiene el trazo a 24 px del borde: radio 126
const R = 126
const CIRC = 2 * Math.PI * R

/** Redondeado para que servidor y cliente generen exactamente el mismo SVG. */
const round = (n: number) => Math.round(n * 1000) / 1000

function statusText(status: RingStatus): string {
  switch (status.kind) {
    case 'remaining':
      return `${status.seconds} s restantes`
    case 'changing':
      return `Cambia en ${status.seconds} s`
    case 'next':
      return `Siguiente en ${status.seconds} s`
    case 'inWindow':
      return 'En la ventana objetivo'
    case 'over':
      return status.text
  }
}

/**
 * Anillo del paso con tiempo (DS §3.24 v1.2): sin ticks, instrucción sobre el número,
 * tiempo restante en crema debajo. Componente presentacional: no tiene reloj propio;
 * el tiempo viene de timestamps (tech §4), nunca de un setInterval acumulado.
 */
export function TimerRing({
  elapsedMs,
  durationMs,
  mode,
  primary,
  status = null,
  paused = false,
  diameter = 'min(78vw, 300px)',
  className,
}: TimerRingProps) {
  const ratio = durationMs > 0 ? Math.min(1, Math.max(0, elapsedMs / durationMs)) : 0

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        role="timer"
        aria-live="off"
        aria-label="Temporizador del paso"
        data-elapsed-ms={Math.round(elapsedMs)}
        data-paused={paused || undefined}
        className="relative aspect-square"
        style={{ width: diameter }}
      >
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 size-full" aria-hidden="true">
          <circle cx={C} cy={C} r={R} fill="none" className="stroke-track" strokeWidth={2} />
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            className="stroke-accent"
            style={{ strokeWidth: 'var(--stroke-progress)' }}
            strokeLinecap="round"
            strokeDasharray={round(CIRC)}
            strokeDashoffset={round(CIRC * (1 - ratio))}
            transform={`rotate(-90 ${C} ${C})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="t-caption text-fg-3">{mode === 'grams' ? 'Vierte hasta' : 'tiempo total'}</span>
          {mode === 'grams' ? (
            <span className="flex items-baseline gap-1.5 text-fg">
              <span className="t-num-hero">{primary}</span>
              <span className="t-title">g</span>
            </span>
          ) : (
            <span className="t-num-time text-fg">{primary}</span>
          )}
        </div>
      </div>
      {status ? (
        <p
          className={cn(
            'text-center',
            status.kind === 'inWindow' ? 't-caption text-success' : 't-title',
            (status.kind === 'remaining' || status.kind === 'changing' || status.kind === 'next') && 'tabular-nums text-accent',
            status.kind === 'over' && 'tabular-nums text-fg-2',
          )}
          data-status={status.kind}
        >
          {statusText(status)}
        </p>
      ) : null}
    </div>
  )
}
