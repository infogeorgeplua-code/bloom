import { useEffect, useRef } from 'react'
import { Button, Orb } from '@/components'
import { formatDuration } from '@/lib/format'

/** Pausado (DS §4.3.d, Figma 07 · 9:259): overlay sobre el paso, el timer congelado. */
export function Paused({
  elapsedMs,
  stepLabel,
  onContinue,
  onNext,
  onRestart,
}: {
  elapsedMs: number
  /** "Primer vertido · paso 3 de 6" */
  stepLabel: string
  onContinue: () => void
  onNext: () => void
  onRestart: () => void
}) {
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus(), [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Brew pausado"
      className="absolute inset-0 z-30 flex flex-col items-center bg-bg/70 px-5 pt-2 pb-6 backdrop-blur-sm"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        {/* TODO(ds-pendiente): P-21 — Figma usa un orb de 180 px; el DS solo tiene 160 (md) */}
        <Orb variant="outline" size="md" label="Pausado" value={formatDuration(elapsedMs / 1000)} className="bg-bg" />
        <div className="rounded-pill bg-surface-2 px-6 py-2.5 text-center">
          <p className="t-body text-fg">El timer está congelado</p>
          <p className="t-body text-fg-2">{stepLabel}</p>
        </div>
      </div>
      <div className="flex w-full flex-col items-stretch gap-3">
        <Button ref={first} size="xl" fullWidth onClick={onContinue}>
          Continuar
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={onNext}>
          Siguiente paso
        </Button>
        <Button variant="tertiary" size="md" fullWidth onClick={onRestart}>
          Reiniciar paso
        </Button>
      </div>
    </div>
  )
}
