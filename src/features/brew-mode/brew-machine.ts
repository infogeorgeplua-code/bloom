/**
 * Máquina de estados del brew (SDD §3.3–3.4, §5.1). Función pura: sin I/O, sin Date.now().
 * El tiempo entra por el evento o por ctx.nowEpochMs; los efectos se devuelven como datos.
 */
import type { RecipeParams, RecipeStep } from '@/lib/schemas/recipe-seed'
import type { ActiveBrewRecord, BrewSessionRecord } from '@/lib/offline-db'
import { elapsedMs } from './brew-clock'

export const COUNTDOWN_MS = 3000
export const WARN_BEFORE_MS = 3000
export const RESUME_GRACE_MS = 10 * 60_000
export const RESUME_PAUSED_MAX_MS = 30 * 60_000
export const RESUME_PREP_MAX_MS = 30 * 60_000

export type BrewStatus =
  | 'idle'
  | 'preview'
  | 'prep'
  | 'countdown'
  | 'running'
  | 'paused'
  | 'finished'
  | 'abandoned'

export interface BrewState {
  status: BrewStatus
  versionId: string | null
  prepIndex: number
  countdownStartedAtEpochMs: number | null
  t0EpochMs: number | null
  pausedAtEpochMs: number | null
  totalPausedMs: number
  warnedStepIds: string[]
  /** Índice (en `steps`) del último paso con tiempo anunciado */
  lastStepIndex: number | null
  /** Tiempo total al terminar */
  finishedElapsedMs: number | null
  /** Brew guardado al terminar: la evaluación lo califica (fase 4) */
  sessionId: string | null
}

export type BrewEvent =
  | { type: 'LOAD'; versionId: string }
  | { type: 'START'; nowEpochMs: number }
  | { type: 'PREP_DONE'; nowEpochMs: number }
  | { type: 'CANCEL_COUNTDOWN' }
  | { type: 'TICK'; nowEpochMs: number }
  | { type: 'PAUSE'; nowEpochMs: number }
  | { type: 'RESUME'; nowEpochMs: number }
  /** sessionId: por si el paso actual es el último y "Siguiente paso" termina el brew */
  | { type: 'NEXT_STEP'; nowEpochMs: number; sessionId: string }
  | { type: 'RESTART_STEP'; nowEpochMs: number }
  | { type: 'FINISH'; nowEpochMs: number; sessionId: string }
  | { type: 'ABANDON' }

export type HapticKind = 'step' | 'warn3s' | 'finish' | 'pause' | 'prepDone'

export type BrewEffect =
  | { type: 'haptic'; kind: HapticKind }
  | { type: 'announce'; text: string }
  | { type: 'persist' }
  | { type: 'clearPersisted' }
  | { type: 'saveSession'; session: BrewSessionRecord }
  | { type: 'wakeLock'; on: boolean }

export interface BrewContext {
  params: RecipeParams
  method: BrewSessionRecord['method']
}

export const initialState = (): BrewState => ({
  status: 'idle',
  versionId: null,
  prepIndex: 0,
  countdownStartedAtEpochMs: null,
  t0EpochMs: null,
  pausedAtEpochMs: null,
  totalPausedMs: 0,
  warnedStepIds: [],
  lastStepIndex: null,
  finishedElapsedMs: null,
  sessionId: null,
})

// ── Pasos ────────────────────────────────────────────────────────────────

export const prepSteps = (p: RecipeParams) => p.steps.filter((s) => s.type === 'prep')
export const timedSteps = (p: RecipeParams) => p.steps.filter((s) => s.type !== 'prep')

/** Paso activo en el tiempo (S-04) */
export type ActiveStep =
  | { kind: 'step'; index: number; step: RecipeStep; stepElapsedMs: number; stepDurationMs: number; untilEndMs: number }
  | { kind: 'hold'; index: number; step: RecipeStep; nextStartInMs: number }

/**
 * El paso i está activo desde su startS. Dentro de [startS, endS] corre su anillo; si hay un
 * hueco hasta el startS siguiente queda en espera ("hold"). El último paso nunca termina solo (D-17).
 * `index` es el índice dentro de `params.steps` (cuenta los prep para "Paso N de M").
 */
export function activeStepAt(params: RecipeParams, elapsed: number): ActiveStep {
  const steps = params.steps
  const firstTimed = steps.findIndex((s) => s.type !== 'prep')
  let idx = firstTimed
  for (let i = firstTimed; i < steps.length; i++) {
    const s = steps[i]!
    if ((s.startS ?? 0) * 1000 <= elapsed) idx = i
  }
  const step = steps[idx]!
  const start = (step.startS ?? 0) * 1000
  const end = (step.endS ?? 0) * 1000
  const next = steps[idx + 1]
  const isLast = !next
  if (elapsed <= end || isLast) {
    return {
      kind: 'step',
      index: idx,
      step,
      stepElapsedMs: elapsed - start,
      stepDurationMs: end - start,
      untilEndMs: Math.max(0, end - elapsed),
    }
  }
  return { kind: 'hold', index: idx, step, nextStartInMs: (next.startS ?? 0) * 1000 - elapsed }
}

export const isLastStep = (params: RecipeParams, index: number) => index === params.steps.length - 1

/** Milisegundos hasta que el paso cambia solo; null en el último paso (no cambia solo). */
export function msUntilChange(params: RecipeParams, elapsed: number): number | null {
  const a = activeStepAt(params, elapsed)
  const next = params.steps[a.index + 1]
  if (!next) return null
  return (next.startS ?? 0) * 1000 - elapsed
}

export function currentElapsed(s: BrewState, nowEpochMs: number): number {
  if (s.t0EpochMs === null) return 0
  if (s.status === 'finished') return s.finishedElapsedMs ?? 0
  return elapsedMs(
    { t0EpochMs: s.t0EpochMs, pausedAtEpochMs: s.pausedAtEpochMs, totalPausedMs: s.totalPausedMs },
    nowEpochMs,
  )
}

// ── Transiciones ─────────────────────────────────────────────────────────

const ACTIVE: BrewStatus[] = ['prep', 'countdown', 'running', 'paused']

function stepAnnouncement(step: RecipeStep): string {
  return step.targetG ? `${step.name}. Vierte agua hasta ${step.targetG} gramos.` : step.name
}

/** Rebasa el reloj para que elapsed valga `targetElapsed` sin reescribir el pasado (nota NEXT_STEP). */
function rebase(s: BrewState, nowEpochMs: number, targetElapsed: number): BrewState {
  const current = currentElapsed(s, nowEpochMs)
  return { ...s, totalPausedMs: s.totalPausedMs + (current - targetElapsed) }
}

function finish(s: BrewState, ctx: BrewContext, nowEpochMs: number, sessionId: string) {
  const elapsed = currentElapsed(s, nowEpochMs)
  const state: BrewState = { ...s, status: 'finished', pausedAtEpochMs: null, finishedElapsedMs: elapsed, sessionId }
  const session: BrewSessionRecord = {
    id: sessionId,
    versionId: s.versionId ?? '',
    method: ctx.method,
    coffeeId: null,
    bagId: null,
    startedAtEpochMs: s.t0EpochMs ?? nowEpochMs,
    finishedAtEpochMs: nowEpochMs,
    gramsUsed: ctx.params.doseG,
    durationS: Math.round(elapsed / 1000),
    outcome: 'completed',
    rating: null,
    symptoms: [],
    notes: null,
    syncState: 'local',
  }
  const effects: BrewEffect[] = [
    { type: 'haptic', kind: 'finish' },
    { type: 'saveSession', session },
    { type: 'clearPersisted' },
    { type: 'wakeLock', on: false },
    { type: 'announce', text: 'Tu café está listo.' },
  ]
  return { state, effects }
}

export function transition(
  s: BrewState,
  e: BrewEvent,
  ctx: BrewContext,
): { state: BrewState; effects: BrewEffect[] } {
  const none = { state: s, effects: [] as BrewEffect[] }
  const params = ctx.params
  const preps = prepSteps(params)

  switch (e.type) {
    case 'LOAD':
      return { state: { ...initialState(), status: 'preview', versionId: e.versionId }, effects: [] }

    case 'START': {
      if (s.status !== 'preview') return none
      if (preps.length === 0) {
        return {
          state: { ...s, status: 'countdown', countdownStartedAtEpochMs: e.nowEpochMs },
          effects: [{ type: 'wakeLock', on: true }, { type: 'persist' }],
        }
      }
      return {
        state: { ...s, status: 'prep', prepIndex: 0 },
        effects: [{ type: 'wakeLock', on: true }, { type: 'persist' }, { type: 'announce', text: preps[0]!.name }],
      }
    }

    case 'PREP_DONE': {
      if (s.status !== 'prep') return none
      const nextPrep = s.prepIndex + 1
      if (nextPrep < preps.length) {
        return {
          state: { ...s, prepIndex: nextPrep },
          effects: [{ type: 'haptic', kind: 'prepDone' }, { type: 'persist' }, { type: 'announce', text: preps[nextPrep]!.name }],
        }
      }
      return {
        state: { ...s, status: 'countdown', countdownStartedAtEpochMs: e.nowEpochMs },
        effects: [{ type: 'haptic', kind: 'prepDone' }, { type: 'persist' }, { type: 'announce', text: 'Empieza en 3' }],
      }
    }

    case 'CANCEL_COUNTDOWN': {
      if (s.status !== 'countdown') return none
      if (preps.length === 0) return { state: { ...s, status: 'preview', countdownStartedAtEpochMs: null }, effects: [{ type: 'clearPersisted' }] }
      return {
        state: { ...s, status: 'prep', prepIndex: preps.length - 1, countdownStartedAtEpochMs: null },
        effects: [{ type: 'persist' }],
      }
    }

    case 'TICK': {
      if (s.status === 'countdown' && s.countdownStartedAtEpochMs !== null) {
        if (e.nowEpochMs - s.countdownStartedAtEpochMs < COUNTDOWN_MS) return none
        const t0 = s.countdownStartedAtEpochMs + COUNTDOWN_MS
        const first = timedSteps(params)[0]!
        const index = params.steps.indexOf(first)
        return {
          state: { ...s, status: 'running', t0EpochMs: t0, countdownStartedAtEpochMs: null, lastStepIndex: index },
          effects: [{ type: 'haptic', kind: 'step' }, { type: 'persist' }, { type: 'announce', text: stepAnnouncement(first) }],
        }
      }
      if (s.status !== 'running') return none
      const elapsed = currentElapsed(s, e.nowEpochMs)
      const active = activeStepAt(params, elapsed)
      const effects: BrewEffect[] = []
      let state = s
      if (active.index !== s.lastStepIndex) {
        state = { ...state, lastStepIndex: active.index }
        effects.push({ type: 'haptic', kind: 'step' }, { type: 'persist' }, { type: 'announce', text: stepAnnouncement(active.step) })
      }
      const until = msUntilChange(params, elapsed)
      const stepId = active.step.id
      if (until !== null && until > 0 && until <= WARN_BEFORE_MS && !state.warnedStepIds.includes(stepId)) {
        state = { ...state, warnedStepIds: [...state.warnedStepIds, stepId] }
        effects.push({ type: 'haptic', kind: 'warn3s' }, { type: 'persist' })
      }
      return effects.length ? { state, effects } : none
    }

    case 'PAUSE':
      if (s.status !== 'running') return none
      return {
        state: { ...s, status: 'paused', pausedAtEpochMs: e.nowEpochMs },
        effects: [{ type: 'haptic', kind: 'pause' }, { type: 'persist' }, { type: 'announce', text: 'Pausado' }],
      }

    case 'RESUME':
      if (s.status !== 'paused' || s.pausedAtEpochMs === null) return none
      return {
        state: { ...s, status: 'running', totalPausedMs: s.totalPausedMs + (e.nowEpochMs - s.pausedAtEpochMs), pausedAtEpochMs: null },
        effects: [{ type: 'persist' }],
      }

    case 'NEXT_STEP': {
      if (s.status !== 'paused') return none
      const elapsed = currentElapsed(s, e.nowEpochMs)
      const active = activeStepAt(params, elapsed)
      const next = params.steps[active.index + 1]
      if (!next) return finishFromPause(s, ctx, e.nowEpochMs, e.sessionId)
      const resumed: BrewState = {
        ...s,
        status: 'running',
        totalPausedMs: s.totalPausedMs + (e.nowEpochMs - (s.pausedAtEpochMs ?? e.nowEpochMs)),
        pausedAtEpochMs: null,
      }
      return { state: rebase(resumed, e.nowEpochMs, (next.startS ?? 0) * 1000), effects: [{ type: 'persist' }] }
    }

    case 'RESTART_STEP': {
      if (s.status !== 'paused') return none
      const active = activeStepAt(params, currentElapsed(s, e.nowEpochMs))
      const resumed: BrewState = {
        ...s,
        status: 'running',
        totalPausedMs: s.totalPausedMs + (e.nowEpochMs - (s.pausedAtEpochMs ?? e.nowEpochMs)),
        pausedAtEpochMs: null,
        warnedStepIds: s.warnedStepIds.filter((id) => id !== active.step.id),
      }
      return { state: rebase(resumed, e.nowEpochMs, (active.step.startS ?? 0) * 1000), effects: [{ type: 'persist' }] }
    }

    case 'FINISH': {
      // Solo manual (D-17): "Terminar brew" en el último paso
      if (s.status !== 'running') return none
      const active = activeStepAt(params, currentElapsed(s, e.nowEpochMs))
      if (!isLastStep(params, active.index)) return none
      return finish(s, ctx, e.nowEpochMs, e.sessionId)
    }

    case 'ABANDON':
      if (!ACTIVE.includes(s.status) && s.status !== 'preview') return none
      return {
        state: { ...s, status: 'abandoned' },
        effects: [{ type: 'clearPersisted' }, { type: 'wakeLock', on: false }],
      }
  }

  function finishFromPause(st: BrewState, c: BrewContext, now: number, sessionId: string) {
    // El reloj queda en el tiempo de la pausa: no se cuenta el rato pausado
    const frozen: BrewState = { ...st, status: 'running' }
    return finish(frozen, c, st.pausedAtEpochMs ?? now, sessionId)
  }
}

// ── Persistencia y retomar (SDD §3.4) ────────────────────────────────────

export function toRecord(s: BrewState, updatedAtEpochMs: number): ActiveBrewRecord | null {
  if (!s.versionId || !(['prep', 'countdown', 'running', 'paused'] as BrewStatus[]).includes(s.status)) return null
  return {
    id: 'current',
    schemaVersion: 1,
    versionId: s.versionId,
    status: s.status as ActiveBrewRecord['status'],
    prepIndex: s.prepIndex,
    countdownStartedAtEpochMs: s.countdownStartedAtEpochMs,
    t0EpochMs: s.t0EpochMs,
    pausedAtEpochMs: s.pausedAtEpochMs,
    totalPausedMs: s.totalPausedMs,
    warnedStepIds: s.warnedStepIds,
    updatedAtEpochMs,
  }
}

export type RestoreResult =
  | { kind: 'offer'; resumeAtElapsedMs: number; state: BrewState }
  | { kind: 'expired'; endedAgoMs: number; state: BrewState }
  | { kind: 'discard' }

export function fromRecord(r: ActiveBrewRecord): BrewState {
  return {
    ...initialState(),
    status: r.status,
    versionId: r.versionId,
    prepIndex: r.prepIndex,
    countdownStartedAtEpochMs: r.countdownStartedAtEpochMs,
    t0EpochMs: r.t0EpochMs,
    pausedAtEpochMs: r.pausedAtEpochMs,
    totalPausedMs: r.totalPausedMs,
    warnedStepIds: r.warnedStepIds,
  }
}

/**
 * Al abrir la app con un brew a medias. `running` siguió en tiempo real (el agua no espera);
 * `paused` quedó congelado; prep y countdown se retoman en el mismo paso (el 3-2-1 reinicia).
 */
export function restore(r: ActiveBrewRecord, params: RecipeParams, nowEpochMs: number): RestoreResult {
  const state = fromRecord(r)
  const lastEnd = (params.steps[params.steps.length - 1]?.endS ?? 0) * 1000
  switch (r.status) {
    case 'running': {
      const elapsed = currentElapsed(state, nowEpochMs)
      if (elapsed <= lastEnd + RESUME_GRACE_MS) {
        const active = activeStepAt(params, elapsed)
        return { kind: 'offer', resumeAtElapsedMs: elapsed, state: { ...state, lastStepIndex: active.index } }
      }
      return { kind: 'expired', endedAgoMs: elapsed - lastEnd, state }
    }
    case 'paused': {
      if (nowEpochMs - r.updatedAtEpochMs > RESUME_PAUSED_MAX_MS) return { kind: 'discard' }
      const elapsed = currentElapsed(state, nowEpochMs)
      return { kind: 'offer', resumeAtElapsedMs: elapsed, state: { ...state, lastStepIndex: activeStepAt(params, elapsed).index } }
    }
    case 'countdown':
    case 'prep': {
      if (nowEpochMs - r.updatedAtEpochMs > RESUME_PREP_MAX_MS) return { kind: 'discard' }
      if (r.status === 'countdown') {
        return { kind: 'offer', resumeAtElapsedMs: 0, state: { ...state, countdownStartedAtEpochMs: nowEpochMs } }
      }
      return { kind: 'offer', resumeAtElapsedMs: 0, state }
    }
  }
}

/** "Guardar como terminado" de un brew expirado: lo cierra en el final de la ventana. */
export function finishExpired(s: BrewState, ctx: BrewContext, sessionId: string): BrewEffect[] {
  if (s.t0EpochMs === null) return [{ type: 'clearPersisted' }]
  const endAt = s.t0EpochMs + s.totalPausedMs + ctx.params.totalMaxS * 1000
  const session: BrewSessionRecord = {
    id: sessionId,
    versionId: s.versionId ?? '',
    method: ctx.method,
    coffeeId: null,
    bagId: null,
    startedAtEpochMs: s.t0EpochMs,
    finishedAtEpochMs: endAt,
    gramsUsed: ctx.params.doseG,
    durationS: ctx.params.totalMaxS,
    outcome: 'completed',
    rating: null,
    symptoms: [],
    notes: null,
    syncState: 'local',
  }
  return [{ type: 'saveSession', session }, { type: 'clearPersisted' }]
}
