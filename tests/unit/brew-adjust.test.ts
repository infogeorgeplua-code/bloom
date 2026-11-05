import { describe, expect, it } from 'vitest'
import { DIAGNOSIS, SYMPTOMS, REASON_TEXT, AGITATION_TEXT } from '@/features/evaluation/adjust-tables'
import {
  applyChanges,
  averageRating,
  bestStart,
  materialize,
  proposeAdjustment,
  reasonFor,
  type AdjustContext,
  type AdjustVersion,
  type EvaluatedBrew,
} from '@/features/evaluation/brew-adjust'
import { baseRecipe } from '@/features/recipes/recipe-engine'
import type { GrinderSetup } from '@/lib/schemas/coffee'
import type { AdjustMeta, RatingLevel, Symptom } from '@/lib/schemas/evaluation'
import { RecipeParams, type Method } from '@/lib/schemas/recipe-seed'

const GRINDER: GrinderSetup = { presetId: 'test', name: 'Test', minClicks: 1, maxClicks: 38, clicksPerStep: 2, base: { v60: 18, aeropress: 14, espresso: 8 } }
const ctxFor = (method: Method, over: Partial<AdjustContext> = {}): AdjustContext => ({ method, grinder: GRINDER, prepAltitudeM: null, ...over })
const TODAY = '2026-11-04'

let clock = 1_000
function version(over: Partial<AdjustVersion> & { method?: Method } = {}): AdjustVersion {
  const method = over.method ?? 'v60'
  const base = baseRecipe(method)
  return {
    ...base,
    id: `v${clock}`,
    recipeId: 'c1:v60:equilibrado',
    number: 1,
    parentVersionId: null,
    status: 'active',
    source: 'engine',
    coffeeId: 'c1',
    createdAtEpochMs: clock++,
    ...over,
    params: { ...base.params, grind: { ...base.params.grind, clicks: GRINDER.base[method] }, ...over.params },
  }
}
let n = 0
const brew = (v: AdjustVersion, rating: RatingLevel, symptoms: Symptom[] = []): EvaluatedBrew => ({
  sessionId: `s${++n}`,
  versionId: v.id,
  rating,
  symptoms,
  finishedAtEpochMs: clock++,
})

function run(current: AdjustVersion, versions: AdjustVersion[], history: EvaluatedBrew[], ctx = ctxFor(current.method), roastDateISO: string | null = null) {
  return proposeAdjustment({ current, versions, history, latest: history.at(-1)!, ctx, roastDateISO, todayISO: TODAY })
}

/** Crea la versión nueva a partir de una propuesta, como al tocar "Usar Vn la próxima vez" */
function accept(base: AdjustVersion, changes: AdjustMeta['changes'], meta: AdjustMeta, number: number): AdjustVersion {
  return version({ number, parentVersionId: base.id, params: applyChanges(base.params, changes, base.method), adjustMeta: meta })
}

describe('Ejemplo de product §10.3 / SDD §9.2: V1 → V2 revertida → V3 ⭐', () => {
  it('reproduce la secuencia completa', () => {
    // Molino que admite medio paso: 1 paso = 2 posiciones → medio paso = 1 posición
    const v1 = version({ params: { tempC: 92 } as never })
    const history: EvaluatedBrew[] = []

    // 1 · V1 "Quedó bien" + falta dulzor → R4, medio paso de +1 °C
    history.push(brew(v1, 3, ['falta_dulzor']))
    const o1 = run(v1, [v1], history)
    expect(o1.kind).toBe('propose')
    if (o1.kind !== 'propose') return
    expect(o1.changes).toEqual([{ variable: 'tempC', before: 92, after: 92.5, stepId: null }])
    expect(o1.meta).toMatchObject({ rule: 'R4', ratingLevel: 3, tried: ['tempC'] })

    // 2 · V2 "Le falta algo" + muy amargo → peor que V1: revertir y probar la otra candidata de falta_dulzor
    const v2 = accept(v1, o1.changes, o1.meta, 2)
    expect(bestStart([v1, v2], history)?.id).toBe(v2.id) // la propuesta aceptada se prueba primero
    history.push(brew(v2, 2, ['muy_amargo']))
    const o2 = run(v2, [v1, v2], history)
    expect(o2.kind).toBe('revert')
    if (o2.kind !== 'revert') return
    expect(o2.revertedVersionId).toBe(v2.id)
    expect(o2.base.id).toBe(v1.id)
    expect(o2.changes).toEqual([{ variable: 'grindClicks', before: 18, after: 17, stepId: null }])
    expect(o2.meta).toMatchObject({ rule: 'R6', ratingLevel: 3, tried: ['tempC', 'grindClicks'] })

    // 3 · V3 (hija de V1) "Muy rica" sin síntoma → se mantiene
    const v2r = { ...v2, status: 'reverted' as const }
    const v3 = accept(v1, o2.changes, o2.meta!, 3)
    expect(v3.params.grind.clicks).toBe(17)
    expect(v3.params.tempC).toBe(92)
    history.push(brew(v3, 4))
    expect(run(v3, [v1, v2r, v3], history)).toEqual({ kind: 'keep', hint: null })

    // 4 · V3 "De campeonato" → propone bloquear; bloqueada, R1 la elige siempre
    history.push(brew(v3, 5))
    expect(run(v3, [v1, v2r, v3], history)).toEqual({ kind: 'lock_proposal', versionId: v3.id })
    const v3l = { ...v3, status: 'locked' as const }
    expect(bestStart([v1, v2r, v3l], history)?.id).toBe(v3.id)
    // V2 revertida no compite aunque sea la más reciente
    expect(bestStart([v1, { ...v2r, createdAtEpochMs: 1e12 }], history)?.id).toBe(v1.id)
    expect(averageRating(v3.id, history)).toBe(4.5)
  })
})

describe('DIAGNOSIS (product §10.2): cada fila, nivel 2 = paso completo', () => {
  const v = version({ params: { tempC: 92 } as never })
  for (const s of SYMPTOMS) {
    it(s, () => {
      const out = run(v, [v], [brew(v, 2, [s])])
      expect(out.kind).toBe('propose')
      if (out.kind !== 'propose') return
      const [c1, c2] = DIAGNOSIS[s]
      const expected = materialize(c1, false, v.params, ctxFor('v60')) ?? materialize(c2, false, v.params, ctxFor('v60'))
      expect(out.changes).toEqual([expected])
      expect(() => RecipeParams.parse(applyChanges(v.params, out.changes, 'v60'))).not.toThrow()
      expect(reasonFor(out.changes[0]!)).toBeTruthy()
    })
  }

  it('valores concretos sobre el V60 base (92 °C, 240 g, 18 clicks)', () => {
    const one = (s: Symptom) => {
      const o = run(v, [v], [brew(v, 2, [s])])
      return o.kind === 'propose' ? o.changes[0] : null
    }
    expect(one('muy_acido')).toMatchObject({ variable: 'tempC', after: 93 })
    expect(one('muy_amargo')).toMatchObject({ variable: 'tempC', after: 91 })
    expect(one('astringente')).toMatchObject({ variable: 'tempC', after: 90 })
    expect(one('vacio')).toMatchObject({ variable: 'grindClicks', after: 16 })
    expect(one('muy_intenso')).toMatchObject({ variable: 'waterG', after: 250 })
    expect(one('plano')).toMatchObject({ variable: 'bloomS', before: 40, after: 50, stepId: 'v60-bloom' })
    expect(one('falta_cuerpo')).toMatchObject({ variable: 'agitation', after: AGITATION_TEXT.agitate_pour2, stepId: 'v60-pour2' })
    // El vertido final del seed ya es "sin girar el dripper ni remover": la candidata 1 no aplica → −1 °C
    expect(one('seco_final')).toMatchObject({ variable: 'tempC', after: 91 })
  })

  it('bloom +10 s corre las ventanas siguientes y el tiempo total', () => {
    const p = applyChanges(v.params, [{ variable: 'bloomS', before: 40, after: 50, stepId: 'v60-bloom' }], 'v60')
    expect(p.steps.find((s) => s.id === 'v60-bloom')).toMatchObject({ startS: 0, endS: 50 })
    expect(p.steps.find((s) => s.id === 'v60-pour1')).toMatchObject({ startS: 55, endS: 80 })
    expect([p.totalMinS, p.totalMaxS]).toEqual([170, 190])
  })

  it('+10 g de agua reescala las metas acumuladas', () => {
    const p = applyChanges(v.params, [{ variable: 'waterG', before: 240, after: 250, stepId: null }], 'v60')
    expect(p.steps.map((s) => s.targetG).filter(Boolean).at(-1)).toBe(250)
  })

  it('cada texto del porqué existe y no promete sabores', () => {
    for (const t of Object.values(REASON_TEXT)) expect(t).not.toMatch(/azúcar|dulzor|sabe|delicios/i)
  })
})

describe('R4 · nivel 3: un cambio a medio paso', () => {
  const v = version()
  it.each([
    ['muy_acido', { variable: 'tempC', after: 92.5 }],
    ['astringente', { variable: 'tempC', after: 91 }],
    ['vacio', { variable: 'grindClicks', after: 17 }],
    ['muy_intenso', { variable: 'waterG', after: 245 }],
    ['plano', { variable: 'bloomS', after: 45 }],
  ] as const)('%s', (s, change) => {
    const o = run(v, [v], [brew(v, 3, [s])])
    expect(o.kind === 'propose' && o.changes).toEqual([expect.objectContaining(change)])
  })
  it('solo usa el primer síntoma', () => {
    const o = run(v, [v], [brew(v, 3, ['muy_acido', 'vacio'])])
    expect(o.kind === 'propose' && o.changes).toHaveLength(1)
  })
  it('molino sin medio paso (1 posición por paso): sustituye por la otra candidata o no propone', () => {
    const g1 = { ...GRINDER, clicksPerStep: 1 }
    const hot = version({ params: { tempC: 96 } as never })
    // muy_acido: +0,5 °C pasa el máximo del V60 (96) y ½ posición no existe
    expect(run(hot, [hot], [brew(hot, 3, ['muy_acido'])], ctxFor('v60', { grinder: g1 }))).toEqual({ kind: 'no_option', symptoms: ['muy_acido'] })
    // Con paso completo (nivel 2) sí hay 1 posición
    const o = run(hot, [hot], [brew(hot, 2, ['muy_acido'])], ctxFor('v60', { grinder: g1 }))
    expect(o.kind === 'propose' && o.changes[0]).toMatchObject({ variable: 'grindClicks', after: 17 })
  })
})

describe('R5 · nivel 1–2: paso completo, UN cambio por taza (P-26)', () => {
  const v = version()
  it('dos síntomas: se ajusta solo el primero', () => {
    const o = run(v, [v], [brew(v, 1, ['muy_amargo', 'muy_intenso'])])
    expect(o.kind === 'propose' && o.changes.map((c) => [c.variable, c.after])).toEqual([['tempC', 91]])
    expect(o.kind === 'propose' && o.meta.symptoms).toEqual(['muy_amargo'])
  })
  it('si el primer síntoma no tiene candidata posible, se usa el segundo', () => {
    const hot = version({ params: { tempC: 96, grind: { descriptor: 'fina', clicks: 1 } } as never })
    const o = run(hot, [hot], [brew(hot, 2, ['muy_acido', 'muy_intenso'])])
    expect(o.kind === 'propose' && o.changes.map((c) => [c.variable, c.after])).toEqual([['waterG', 250]])
    expect(o.kind === 'propose' && o.meta.symptoms).toEqual(['muy_intenso'])
  })
  it('un tercer síntoma se ignora', () => {
    const o = run(v, [v], [brew(v, 2, ['muy_amargo', 'muy_intenso', 'plano'])])
    expect(o.kind === 'propose' && o.changes).toHaveLength(1)
  })
})

describe('R3 · pista en nivel 4', () => {
  it('una pista se guarda; la misma en dos brews seguidos propone 1 cambio a medio paso', () => {
    const v = version()
    const h = [brew(v, 4, ['falta_dulzor'])]
    expect(run(v, [v], h)).toEqual({ kind: 'keep', hint: 'falta_dulzor' })
    h.push(brew(v, 4, ['falta_dulzor']))
    const o = run(v, [v], h)
    expect(o.kind === 'propose' && o.meta.rule).toBe('R3')
    expect(o.kind === 'propose' && o.changes).toEqual([{ variable: 'tempC', before: 92, after: 92.5, stepId: null }])
  })
  it('pistas distintas o un brew en medio con otra nota no cuentan', () => {
    const v = version()
    const h = [brew(v, 4, ['plano']), brew(v, 4, ['falta_dulzor'])]
    expect(run(v, [v], h)).toEqual({ kind: 'keep', hint: 'falta_dulzor' })
    const h2 = [brew(v, 4, ['plano']), brew(v, 3), brew(v, 4, ['plano'])]
    expect(run(v, [v], h2)).toEqual({ kind: 'keep', hint: 'plano' })
  })
  it('nivel 4 sin síntoma: se mantiene', () => {
    const v = version()
    expect(run(v, [v], [brew(v, 4)])).toEqual({ kind: 'keep', hint: null })
  })
})

describe('R2 / R7 · recetas bloqueadas', () => {
  const locked = version({ status: 'locked' })
  it('una bloqueada no se ajusta sola', () => {
    expect(run(locked, [locked], [brew(locked, 2, ['muy_amargo'])])).toEqual({ kind: 'keep', hint: null })
    expect(run(locked, [locked], [brew(locked, 5)])).toEqual({ kind: 'keep', hint: null })
  })
  it('≤ 3 dos veces seguidas: sugiere desbloquear con los días desde el tueste', () => {
    const h = [brew(locked, 3), brew(locked, 2, ['plano'])]
    expect(run(locked, [locked], h, ctxFor('v60'), '2026-10-01')).toEqual({ kind: 'unlock_suggestion', versionId: locked.id, daysSinceRoast: 34 })
    expect(run(locked, [locked], h)).toEqual({ kind: 'unlock_suggestion', versionId: locked.id, daysSinceRoast: null })
  })
  it('un ≤ 3 aislado entre buenas tazas no cuenta', () => {
    expect(run(locked, [locked], [brew(locked, 2), brew(locked, 5), brew(locked, 3)])).toEqual({ kind: 'keep', hint: null })
  })
})

describe('R8 · sin síntoma no se inventa un ajuste', () => {
  it.each([1, 2, 3] as const)('nivel %i', (r) => {
    const v = version()
    expect(run(v, [v], [brew(v, r)])).toEqual({ kind: 'no_symptom' })
  })
})

describe('R6 · revertir', () => {
  it('empate no es empeorar', () => {
    const v1 = version()
    const meta: AdjustMeta = { rule: 'R4', symptoms: ['falta_dulzor'], ratingLevel: 3, changes: [], tried: ['tempC'], fromSessionId: 'x' }
    const v2 = version({ number: 2, parentVersionId: v1.id, adjustMeta: meta })
    const o = run(v2, [v1, v2], [brew(v1, 3), brew(v2, 3, ['falta_dulzor'])])
    expect(o.kind).toBe('propose')
  })
  it('sin otra candidata: revierte sin proponer', () => {
    const v1 = version()
    const meta: AdjustMeta = { rule: 'R6', symptoms: ['falta_dulzor'], ratingLevel: 3, changes: [], tried: ['tempC', 'grindClicks'], fromSessionId: 'x' }
    const v3 = version({ number: 3, parentVersionId: v1.id, adjustMeta: meta })
    const o = run(v3, [v1, v3], [brew(v1, 3), brew(v3, 1)])
    expect(o).toMatchObject({ kind: 'revert', revertedVersionId: v3.id, changes: [], meta: null })
  })
  it('nivel 1–2 de origen: la otra candidata va a paso completo', () => {
    const v1 = version()
    const meta: AdjustMeta = { rule: 'R5', symptoms: ['muy_amargo'], ratingLevel: 2, changes: [], tried: ['tempC'], fromSessionId: 'x' }
    const v2 = version({ number: 2, parentVersionId: v1.id, adjustMeta: meta })
    const o = run(v2, [v1, v2], [brew(v1, 2, ['muy_amargo']), brew(v2, 1)])
    expect(o.kind === 'revert' && o.changes).toEqual([{ variable: 'grindClicks', before: 18, after: 20, stepId: null }])
  })
})

describe('Límites (SDD §5.4 punto 9) y equipo', () => {
  it('temperatura sobre el máximo del método → candidata 2', () => {
    const v = version({ params: { tempC: 96 } as never })
    const o = run(v, [v], [brew(v, 2, ['muy_acido'])])
    expect(o.kind === 'propose' && o.changes[0]?.variable).toBe('grindClicks')
  })
  it('en Quito (hierve a ~90,5 °C) no se sube la temperatura del V60', () => {
    const v = version({ params: { tempC: 90.5 } as never })
    const o = run(v, [v], [brew(v, 2, ['falta_dulzor'])], ctxFor('v60', { prepAltitudeM: 2850 }))
    expect(o.kind === 'propose' && o.changes[0]).toMatchObject({ variable: 'grindClicks', after: 16 })
  })
  it('molino en su posición más fina → no aplica más fino', () => {
    const v = version({ params: { tempC: 96, grind: { descriptor: 'fina', clicks: 1 } } as never })
    expect(run(v, [v], [brew(v, 2, ['muy_acido'])])).toEqual({ kind: 'no_option', symptoms: ['muy_acido'] })
  })
  it('sin molino configurado no se toca la molienda', () => {
    const v = version({ params: { tempC: 96, grind: { descriptor: 'media-fina', clicks: null } } as never })
    expect(run(v, [v], [brew(v, 2, ['muy_acido'])], ctxFor('v60', { grinder: null }))).toEqual({ kind: 'no_option', symptoms: ['muy_acido'] })
  })
  it('agua: nunca menos de 2 × dosis en filtrado', () => {
    const v = version({ params: { waterG: 35 } as never })
    expect(materialize({ variable: 'waterG', delta: -10 }, false, v.params, ctxFor('v60'))).toBeNull()
  })
})

describe('Espresso (P-27)', () => {
  const e = version({ method: 'espresso', recipeId: 'c1:espresso:equilibrado' })
  it('el paso de agua es el 10 % de la bebida en taza (medio paso 5 %)', () => {
    const full = run(e, [e], [brew(e, 2, ['muy_intenso'])])
    expect(full.kind === 'propose' && full.changes[0]).toMatchObject({ variable: 'waterG', before: 36, after: 39.6 })
    const half = run(e, [e], [brew(e, 3, ['muy_intenso'])])
    expect(half.kind === 'propose' && half.changes[0]).toMatchObject({ variable: 'waterG', after: 37.8 })
  })
  it('sin bloom ni agitación: usa la candidata 2', () => {
    const plano = run(e, [e], [brew(e, 2, ['plano'])], ctxFor('espresso'))
    expect(plano.kind === 'propose' && plano.changes[0]).toMatchObject({ variable: 'grindClicks', after: 6 })
    const cuerpo = run(e, [e], [brew(e, 2, ['falta_cuerpo'])], ctxFor('espresso'))
    expect(cuerpo.kind === 'propose' && cuerpo.changes[0]).toMatchObject({ variable: 'grindClicks', after: 10 })
  })
  it('sin techo de ebullición (caldera presurizada)', () => {
    const o = run(e, [e], [brew(e, 2, ['muy_acido'])], ctxFor('espresso', { prepAltitudeM: 2850 }))
    expect(o.kind === 'propose' && o.changes[0]).toMatchObject({ variable: 'tempC', after: 94 })
  })
  it('agua entre 1:1,5 y 1:3', () => {
    expect(materialize({ variable: 'waterG', delta: 10 }, false, { ...e.params, waterG: 52 }, ctxFor('espresso'))).toBeNull()
    expect(materialize({ variable: 'waterG', delta: -10 }, false, { ...e.params, waterG: 28 }, ctxFor('espresso'))).toBeNull()
  })
})

describe('R1 · bestStart', () => {
  it('la versión vigente (la más nueva no revertida), aunque otra tenga mejor promedio (P-26)', () => {
    const a = version()
    const b = version({ number: 2 })
    expect(bestStart([], [])).toBeNull()
    expect(bestStart([a, b], [brew(a, 4), brew(b, 3)])?.id).toBe(b.id)
    expect(bestStart([a, { ...b, status: 'reverted' }], [brew(a, 4), brew(b, 3)])?.id).toBe(a.id)
  })
  it('una V1 sin evaluar sigue siendo el punto de partida', () => {
    const a = version()
    expect(bestStart([a], [])?.id).toBe(a.id)
  })
})
