/**
 * Derivados de presentación del paso con tiempo (DS §3.24, §3.26). Puro y testeado:
 * los componentes solo pintan lo que devuelve.
 */
import type { RingStatus } from '@/components'
import { formatDuration } from '@/lib/format'
import type { Method, RecipeParams, RecipeStep } from '@/lib/schemas/recipe-seed'
import { activeStepAt, isLastStep, msUntilChange, WARN_BEFORE_MS } from './brew-machine'

export interface TimedView {
  step: RecipeStep
  /** Índice en `params.steps` (base 0) */
  index: number
  isLast: boolean
  ring: { elapsedMs: number; durationMs: number; mode: 'grams' | 'time'; primary: string }
  status: RingStatus
  /** "Primer vertido → 140 g de agua"; null en el último paso */
  after: string | null
}

const targetSuffix = (method: Method) => (method === 'espresso' ? 'en taza' : 'de agua')

export function afterText(params: RecipeParams, index: number, method: Method): string | null {
  const next = params.steps[index + 1]
  if (!next) return null
  return next.targetG ? `${next.name} → ${next.targetG} g ${targetSuffix(method)}` : next.name
}

export function timedView(params: RecipeParams, elapsed: number, method: Method): TimedView {
  const a = activeStepAt(params, elapsed)
  const isLast = isLastStep(params, a.index)
  const step = a.step
  const durationMs = ((step.endS ?? 0) - (step.startS ?? 0)) * 1000
  const stepElapsed = a.kind === 'hold' ? durationMs : elapsed - (step.startS ?? 0) * 1000

  const ring = {
    elapsedMs: Math.min(stepElapsed, durationMs),
    durationMs,
    mode: step.targetG ? ('grams' as const) : ('time' as const),
    primary: step.targetG ? String(step.targetG) : formatDuration(elapsed / 1000),
  }

  let status: RingStatus
  if (isLast) {
    const min = params.totalMinS * 1000
    const max = params.totalMaxS * 1000
    if (elapsed < min) status = { kind: 'remaining', seconds: Math.ceil((min - elapsed) / 1000) }
    else if (elapsed <= max) status = { kind: 'inWindow' }
    // TODO(ds-pendiente): P-05 — copy del tiempo sobre la meta
    else status = { kind: 'over', text: `+${formatDuration((elapsed - max) / 1000)} sobre la meta` }
  } else {
    const until = msUntilChange(params, elapsed) ?? 0
    if (until > 0 && until <= WARN_BEFORE_MS) status = { kind: 'changing', seconds: Math.ceil(until / 1000) }
    else if (a.kind === 'hold') status = { kind: 'next', seconds: Math.ceil(a.nextStartInMs / 1000) }
    else status = { kind: 'remaining', seconds: Math.ceil(a.untilEndMs / 1000) }
  }

  return { step, index: a.index, isLast, ring, status, after: afterText(params, a.index, method) }
}

/** "Primer paso: vierte 45 g de agua a 92 °C" (Figma 04, copy corregido) */
export function firstStepText(params: RecipeParams, method: Method): string {
  const first = params.steps.find((s) => s.type !== 'prep')!
  const temp = `${params.tempC} °C`
  if (first.targetG && method !== 'espresso') return `Primer paso: vierte ${first.targetG} g de agua a ${temp}`
  return `Primer paso: ${first.name.toLowerCase()} a ${temp}`
}
