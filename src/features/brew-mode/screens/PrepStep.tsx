import { ListChecks } from 'lucide-react'
import { Button, ProgressDots, RecipeParams, TopBar } from '@/components'
import { formatNumber } from '@/lib/format'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'

/** Paso de preparación (DS §4.3.b, Figma 03 · 8:171). Sin anillo ni tiempo total. */
export function PrepStep({
  recipe,
  prepIndex,
  onClose,
  onDone,
}: {
  recipe: RecipeVersion
  prepIndex: number
  onClose: () => void
  onDone: () => void
}) {
  const p = recipe.params
  const preps = p.steps.filter((s) => s.type === 'prep')
  const step = preps[prepIndex]!
  const isLastPrep = prepIndex === preps.length - 1
  const stepNumber = p.steps.indexOf(step) + 1

  return (
    <div className="flex min-h-dvh flex-col gap-3 px-5 pt-2 pb-6">
      <TopBar onClose={onClose} />
      <ProgressDots total={p.steps.length} current={stepNumber} />
      <h1 className="t-title-lg step-enter flex items-center gap-2.5 pt-2 text-fg" key={step.id}>
        <ListChecks size={28} strokeWidth={1.5} aria-hidden="true" />
        {step.name}
      </h1>
      <p className="t-body-lg text-fg">{step.instruction}</p>
      {prepIndex === 0 ? (
        <RecipeParams
          className="[&>div]:border-b [&>div]:border-line"
          rows={[
            { label: 'de café', value: formatNumber(p.doseG), unit: 'g' },
            ...(p.grind.clicks
              ? [{ label: `molienda ${p.grind.descriptor}`, value: formatNumber(p.grind.clicks), unit: 'clicks' }]
              : []),
            { label: 'temperatura del agua', value: formatNumber(p.tempC), unit: '°C' },
          ]}
        />
      ) : null}
      {prepIndex === 0 && p.grind.clicks ? (
        // S-15: los clicks son un punto de partida hasta que exista Setup (fase 3)
        <p className="t-caption text-fg-3">Clicks: punto de partida; ajusta a tu molino.</p>
      ) : null}
      <div className="flex-1" />
      {isLastPrep ? (
        <p className="t-caption text-center text-fg-2">Al tocar Listo empieza una cuenta de 3 segundos.</p>
      ) : null}
      <Button size="xl" fullWidth onClick={onDone}>
        Listo
      </Button>
    </div>
  )
}
