import { describe, expect, it } from 'vitest'
import {
  activeStepAt,
  currentElapsed,
  initialState,
  restore,
  toRecord,
  transition,
  type BrewContext,
  type BrewEffect,
  type BrewEvent,
  type BrewState,
} from '@/features/brew-mode/brew-machine'
import { seedRecipe } from '@/lib/recipes'

const v60 = seedRecipe('v60-base-v1')!
const esp = seedRecipe('espresso-base-v1')!
const ctxV60: BrewContext = { params: v60.params, method: 'v60' }
const ctxEsp: BrewContext = { params: esp.params, method: 'espresso' }

function run(ctx: BrewContext, events: BrewEvent[], from: BrewState = initialState()) {
  let state = from
  const effects: BrewEffect[] = []
  for (const e of events) {
    const r = transition(state, e, ctx)
    state = r.state
    effects.push(...r.effects)
  }
  return { state, effects }
}

const T = 1_700_000_000_000

/** Llega a running con t0 = T + 3000 */
function toRunning(ctx: BrewContext, versionId: string) {
  const preps = ctx.params.steps.filter((s) => s.type === 'prep').length
  const events: BrewEvent[] = [{ type: 'LOAD', versionId }, { type: 'START', nowEpochMs: T }]
  for (let i = 0; i < preps; i++) events.push({ type: 'PREP_DONE', nowEpochMs: T })
  events.push({ type: 'TICK', nowEpochMs: T + 3000 })
  return run(ctx, events)
}
const at = (s: number) => T + 3000 + s * 1000

describe('brew-machine', () => {
  it('preview → prep → countdown → running (t0 tras el 3-2-1)', () => {
    const { state, effects } = toRunning(ctxV60, v60.id)
    expect(state.status).toBe('running')
    expect(state.t0EpochMs).toBe(T + 3000)
    expect(effects).toContainEqual({ type: 'wakeLock', on: true })
    expect(effects).toContainEqual({ type: 'haptic', kind: 'prepDone' })
  })

  it('el countdown no termina antes de 3 s y "Cancelar" vuelve al último prep', () => {
    let { state } = run(ctxV60, [{ type: 'LOAD', versionId: v60.id }, { type: 'START', nowEpochMs: T }, { type: 'PREP_DONE', nowEpochMs: T }])
    expect(state.status).toBe('countdown')
    state = transition(state, { type: 'TICK', nowEpochMs: T + 2999 }, ctxV60).state
    expect(state.status).toBe('countdown')
    state = transition(state, { type: 'CANCEL_COUNTDOWN' }, ctxV60).state
    expect(state).toMatchObject({ status: 'prep', prepIndex: 0 })
  })

  it('espresso tiene dos prep: "Listo" avanza de uno a otro antes del countdown', () => {
    const { state } = run(ctxEsp, [{ type: 'LOAD', versionId: esp.id }, { type: 'START', nowEpochMs: T }, { type: 'PREP_DONE', nowEpochMs: T }])
    expect(state).toMatchObject({ status: 'prep', prepIndex: 1 })
  })

  it('"Listo" solo existe en prep: PREP_DONE con el reloj corriendo no hace nada', () => {
    const { state } = toRunning(ctxV60, v60.id)
    expect(transition(state, { type: 'PREP_DONE', nowEpochMs: at(5) }, ctxV60).state).toBe(state)
  })

  it('el paso activo se deriva del tiempo, con espera entre bloom y vertido 1 (S-04)', () => {
    const p = v60.params
    expect(activeStepAt(p, 10_000)).toMatchObject({ kind: 'step', step: { id: 'v60-bloom' } })
    expect(activeStepAt(p, 42_000)).toMatchObject({ kind: 'hold', step: { id: 'v60-bloom' }, nextStartInMs: 3000 })
    expect(activeStepAt(p, 45_000)).toMatchObject({ kind: 'step', step: { id: 'v60-pour1' } })
    expect(activeStepAt(p, 400_000)).toMatchObject({ kind: 'step', step: { id: 'v60-wait' } })
  })

  it('cambio de paso: vibra y anuncia; el aviso de 3 s sale una sola vez por paso', () => {
    let { state } = toRunning(ctxV60, v60.id)
    const warn1 = transition(state, { type: 'TICK', nowEpochMs: at(42) }, ctxV60)
    expect(warn1.effects).toContainEqual({ type: 'haptic', kind: 'warn3s' })
    state = warn1.state
    expect(transition(state, { type: 'TICK', nowEpochMs: at(43) }, ctxV60).effects).toEqual([])
    const change = transition(state, { type: 'TICK', nowEpochMs: at(45) }, ctxV60)
    expect(change.effects).toContainEqual({ type: 'haptic', kind: 'step' })
    expect(change.effects).toContainEqual({ type: 'announce', text: 'Primer vertido. Vierte agua hasta 140 gramos.' })
  })

  it('el último paso NO termina solo (D-17): el TICK nunca lleva a finished', () => {
    const { state } = toRunning(ctxV60, v60.id)
    const late = transition(state, { type: 'TICK', nowEpochMs: at(600) }, ctxV60).state
    expect(late.status).toBe('running')
  })

  it('"Terminar brew" solo en el último paso: guarda la BrewSession y borra el brew en curso', () => {
    const { state } = toRunning(ctxV60, v60.id)
    expect(transition(state, { type: 'FINISH', nowEpochMs: at(60), sessionId: 's1' }, ctxV60).state.status).toBe('running')
    const r = transition(state, { type: 'FINISH', nowEpochMs: at(172), sessionId: 's1' }, ctxV60)
    expect(r.state).toMatchObject({ status: 'finished', finishedElapsedMs: 172_000 })
    const save = r.effects.find((x) => x.type === 'saveSession')
    expect(save).toMatchObject({ session: { id: 's1', versionId: v60.id, method: 'v60', durationS: 172, gramsUsed: 15, rating: null, outcome: 'completed' } })
    expect(r.effects).toContainEqual({ type: 'clearPersisted' })
    expect(r.effects).toContainEqual({ type: 'haptic', kind: 'finish' })
  })

  it('pausa congela el reloj; continuar no cuenta el rato pausado', () => {
    let { state } = toRunning(ctxV60, v60.id)
    state = transition(state, { type: 'PAUSE', nowEpochMs: at(30) }, ctxV60).state
    expect(currentElapsed(state, at(90))).toBe(30_000)
    state = transition(state, { type: 'RESUME', nowEpochMs: at(90) }, ctxV60).state
    expect(currentElapsed(state, at(95))).toBe(35_000)
  })

  it('"Siguiente paso" y "Reiniciar paso" rebasan el reloj sin romper el invariante', () => {
    let { state } = toRunning(ctxV60, v60.id)
    state = transition(state, { type: 'PAUSE', nowEpochMs: at(20) }, ctxV60).state
    const next = transition(state, { type: 'NEXT_STEP', nowEpochMs: at(25), sessionId: 'x' }, ctxV60).state
    expect(next.status).toBe('running')
    expect(currentElapsed(next, at(25))).toBe(45_000)
    let again = transition(next, { type: 'PAUSE', nowEpochMs: at(30) }, ctxV60).state
    again = transition(again, { type: 'RESTART_STEP', nowEpochMs: at(31) }, ctxV60).state
    expect(currentElapsed(again, at(31))).toBe(45_000)
  })

  it('"Siguiente paso" en la pausa del último paso termina el brew', () => {
    let { state } = toRunning(ctxV60, v60.id)
    state = transition(state, { type: 'PAUSE', nowEpochMs: at(165) }, ctxV60).state
    const r = transition(state, { type: 'NEXT_STEP', nowEpochMs: at(200), sessionId: 's2' }, ctxV60)
    expect(r.state).toMatchObject({ status: 'finished', finishedElapsedMs: 165_000 })
  })

  it('abandonar borra el brew en curso y libera el wake lock', () => {
    const { state } = toRunning(ctxV60, v60.id)
    const r = transition(state, { type: 'ABANDON' }, ctxV60)
    expect(r.state.status).toBe('abandoned')
    expect(r.effects).toEqual([{ type: 'clearPersisted' }, { type: 'wakeLock', on: false }])
  })

  describe('persistencia y retomar (SDD §3.4)', () => {
    it('toRecord solo guarda estados activos', () => {
      const { state } = toRunning(ctxV60, v60.id)
      expect(toRecord(state, at(1))).toMatchObject({ id: 'current', status: 'running', t0EpochMs: T + 3000 })
      expect(toRecord(initialState(), at(1))).toBeNull()
    })

    it('running: el brew siguió en tiempo real y ofrece retomar en el paso correcto', () => {
      const { state } = toRunning(ctxV60, v60.id)
      const rec = toRecord(state, at(72))!
      const r = restore(rec, v60.params, at(72))
      expect(r).toMatchObject({ kind: 'offer', resumeAtElapsedMs: 72_000 })
      if (r.kind === 'offer') expect(activeStepAt(v60.params, r.resumeAtElapsedMs).step.id).toBe('v60-pour1')
    })

    it('running vencido (> fin + 10 min): no retoma, ofrece guardarlo', () => {
      const { state } = toRunning(ctxV60, v60.id)
      expect(restore(toRecord(state, at(10))!, v60.params, at(180 + 601)).kind).toBe('expired')
    })

    it('paused: el reloj sigue congelado', () => {
      let { state } = toRunning(ctxV60, v60.id)
      state = transition(state, { type: 'PAUSE', nowEpochMs: at(50) }, ctxV60).state
      const r = restore(toRecord(state, at(50))!, v60.params, at(50) + 5 * 60_000)
      expect(r).toMatchObject({ kind: 'offer', resumeAtElapsedMs: 50_000 })
    })

    it('prep: retoma en el mismo paso; countdown reinicia en 3', () => {
      const prep = run(ctxEsp, [{ type: 'LOAD', versionId: esp.id }, { type: 'START', nowEpochMs: T }, { type: 'PREP_DONE', nowEpochMs: T }]).state
      expect(restore(toRecord(prep, T)!, esp.params, T + 60_000)).toMatchObject({ kind: 'offer', state: { status: 'prep', prepIndex: 1 } })
      const cd = transition(prep, { type: 'PREP_DONE', nowEpochMs: T }, ctxEsp).state
      expect(restore(toRecord(cd, T)!, esp.params, T + 60_000)).toMatchObject({ state: { status: 'countdown', countdownStartedAtEpochMs: T + 60_000 } })
    })

    it('prep o pausa con más de 30 min sin tocar: se descarta', () => {
      const prep = run(ctxV60, [{ type: 'LOAD', versionId: v60.id }, { type: 'START', nowEpochMs: T }]).state
      expect(restore(toRecord(prep, T)!, v60.params, T + 31 * 60_000).kind).toBe('discard')
    })
  })
})
