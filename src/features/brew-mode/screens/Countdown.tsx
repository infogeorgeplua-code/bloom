import { Button } from '@/components'

/** Cuenta regresiva (DS §4.3.b′, Figma 04 · 8:211). Número en crema (DS §2.1). */
export function Countdown({ seconds, firstStep, onCancel }: { seconds: number; firstStep: string; onCancel: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pt-2 pb-6 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="t-label text-fg-3">Empieza en</p>
        <p className="t-num-countdown text-accent" aria-live="assertive" key={seconds}>
          {seconds}
        </p>
        <p className="t-body-lg max-w-72 text-fg-2">{firstStep}</p>
      </div>
      <Button variant="tertiary" size="md" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  )
}
