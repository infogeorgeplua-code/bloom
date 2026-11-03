import { Pause } from 'lucide-react'
import { Button, IconButton, InfoList, ProgressDots, TimerRing, TopBar } from '@/components'
import { formatDuration, formatRange } from '@/lib/format'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { STEP_ICON } from '../icons'
import type { TimedView } from '../step-view'

/**
 * Paso con tiempo (D-16, Figma 05 · 9:158) y último paso (D-17, Figma 08 · 9:324).
 * Jerarquía: meta de gramos > tiempo restante > nombre > propósito > técnica > después.
 */
export function TimedStep({
  recipe,
  view,
  elapsedMs,
  paused,
  onExit,
  onPause,
  onFinish,
}: {
  recipe: RecipeVersion
  view: TimedView
  elapsedMs: number
  paused: boolean
  onExit: () => void
  onPause: () => void
  onFinish: () => void
}) {
  const p = recipe.params
  const Icon = STEP_ICON[view.step.icon]

  return (
    <div className="flex min-h-dvh flex-col gap-3 px-5 pt-2 pb-6" aria-hidden={paused || undefined}>
      <TopBar
        variant="brew"
        windowText={formatRange(p.totalMinS, p.totalMaxS)}
        elapsedText={formatDuration(elapsedMs / 1000)}
        onExit={onExit}
      />
      <ProgressDots total={p.steps.length} current={view.index + 1} align="center" />
      <div key={view.step.id} className="step-enter flex flex-col gap-3">
        <h1 className="t-title-lg flex items-center justify-center gap-2.5 pt-2 text-fg">
          <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
          {view.step.name}
        </h1>
        <TimerRing
          elapsedMs={view.ring.elapsedMs}
          durationMs={view.ring.durationMs}
          mode={view.ring.mode}
          primary={view.ring.primary}
          status={view.status}
          paused={paused}
        />
        <InfoList
          items={[
            { label: 'Propósito', value: view.step.purpose, emphasis: 'primary' },
            { label: 'Técnica', value: view.step.technique },
            { label: 'Después', value: view.after },
          ]}
        />
      </div>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-3">
        <IconButton label="Pausar" icon={Pause} size="xl" onClick={onPause} />
        {view.isLast ? (
          <Button size="xl" className="flex-1" onClick={onFinish}>
            Terminar brew
          </Button>
        ) : null}
      </div>
    </div>
  )
}
