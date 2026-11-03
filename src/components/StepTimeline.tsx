import { ListChecks, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface TimelineStep {
  id: string
  name: string
  /** prep = sin meta ni ventana, ícono list-checks */
  kind: 'prep' | 'timed'
  /** Ícono del paso con tiempo (Lucide) */
  icon?: LucideIcon
  /** Meta acumulada sin unidad: "140" (se muestra "140 g") */
  goal?: string
  /** Ventana de tiempo ya formateada: "0:45 – 1:30" */
  windowText?: string
}

export interface StepTimelineProps {
  steps: TimelineStep[]
  className?: string
}

/**
 * Resumen de pasos antes de empezar (DS §3.20; anatomía de Figma 02 `StepRow`):
 * filas de 56 px con divisor, ícono en círculo, nombre + ventana y meta a la derecha.
 * Figma no lleva barra vertical ni número de paso (P-22).
 */
export function StepTimeline({ steps, className }: StepTimelineProps) {
  return (
    <ol className={cn('m-0 list-none p-0', className)} aria-label="Pasos de la receta">
      {steps.map((step) => {
        const Icon = step.kind === 'prep' ? ListChecks : (step.icon ?? ListChecks)
        return (
          <li key={step.id} className="flex h-14 items-center gap-3 border-b border-line">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-fg-2">
              <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="t-body truncate font-medium text-fg">{step.name}</span>
              <span className="t-caption num text-fg-3">
                {step.kind === 'prep' ? 'Preparación' : step.windowText}
              </span>
            </span>
            {step.kind === 'timed' && step.goal ? (
              <span className="flex shrink-0 items-baseline gap-1">
                <span className="t-num-sm text-fg">{step.goal}</span>
                <span className="t-caption text-fg-2">g</span>
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
