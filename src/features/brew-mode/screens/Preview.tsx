import { Sun } from 'lucide-react'
import { Banner, Button, StepTimeline, TopBar, type TimelineStep } from '@/components'
import { formatRange } from '@/lib/format'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { METHOD_LABEL } from '@/features/home/monthly-stats'
import { STEP_ICON } from '../icons'

/** Vista previa (DS §4.3.a, Figma 02 · 8:87) */
export function Preview({ recipe, onBack, onStart }: { recipe: RecipeVersion; onBack: () => void; onStart: () => void }) {
  const p = recipe.params
  const last = p.steps[p.steps.length - 1]!
  const steps: TimelineStep[] = p.steps.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.type === 'prep' ? 'prep' : 'timed',
    icon: STEP_ICON[s.icon],
    goal: s.targetG ? String(s.targetG) : undefined,
    // El último paso lo terminas tú: su ventana es la meta total (DS §4.3.a)
    windowText: s === last ? formatRange(p.totalMinS, p.totalMaxS) : formatRange(s.startS ?? 0, s.endS ?? 0),
  }))

  return (
    <div className="flex min-h-dvh flex-col gap-3 px-5 pt-2 pb-6">
      <TopBar onBack={onBack} meta={METHOD_LABEL[recipe.method]} />
      <section className="flex flex-col gap-0.5 pt-3">
        <p className="t-label text-fg-3">Tiempo objetivo</p>
        <p className="t-num-window text-fg">{formatRange(p.totalMinS, p.totalMaxS)}</p>
        <p className="t-caption text-fg-2">Desde el primer vertido hasta la última gota.</p>
      </section>
      {p.warnings.map((w) => (
        <Banner key={w} tone="warning">
          {w}
        </Banner>
      ))}
      <StepTimeline steps={steps} className="pt-3" />
      <div className="flex-1" />
      <p className="t-caption flex items-center gap-2 text-fg-2">
        <Sun size={18} strokeWidth={1.5} aria-hidden="true" />
        La pantalla se mantiene encendida mientras preparas.
      </p>
      <Button size="xl" fullWidth onClick={onStart}>
        Empezar
      </Button>
    </div>
  )
}
