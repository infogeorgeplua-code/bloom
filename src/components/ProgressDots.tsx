import { cn } from '@/lib/cn'

export interface ProgressDotsProps {
  /** Total de pasos, incluidos los de preparación (D-10) */
  total: number
  /** Paso actual, base 1 */
  current: number
  /** Centrado en Brew Mode con el tiempo corriendo (DS §3.23 v1.2) */
  align?: 'start' | 'center'
  className?: string
}

/** El dot actual usa --accent (lista cerrada DS §2.1). Acompañado de "PASO N DE M". */
export function ProgressDots({ total, current, align = 'start', className }: ProgressDotsProps) {
  const label = `Paso ${current} de ${total}`
  return (
    <div
      role="progressbar"
      aria-label="Progreso de la receta"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={label}
      className={cn('flex items-center gap-3', align === 'center' && 'justify-center', className)}
    >
      <div className="flex items-center gap-[6px]" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1
          return (
            <span
              key={n}
              className={cn(
                'block h-2 rounded-pill transition-[width,background-color] duration-(--dur-base) ease-(--ease-standard)',
                n < current && 'w-2 bg-fg',
                n === current && 'w-5 bg-accent',
                n > current && 'w-2 bg-track',
              )}
            />
          )
        })}
      </div>
      <span className="t-label text-fg-3" aria-hidden="true">
        Paso {current} de {total}
      </span>
    </div>
  )
}
