/**
 * Motor de ajuste determinista (fase 4, SDD §5.4, product §10.3): reglas R1–R8.
 * Puro: recibe versiones y brews evaluados, devuelve qué proponer. Sin LLM y sin I/O.
 */
import { clampTempC } from '@/features/recipes/engine-tables'
import { roastWindow, roundWater, scaleTargets } from '@/features/recipes/recipe-engine'
import type { GrinderSetup } from '@/lib/schemas/coffee'
import type { AdjustChange, AdjustMeta, AdjustVariable, RatingLevel, Symptom } from '@/lib/schemas/evaluation'
import type { Method, RecipeParams, RecipeVersion } from '@/lib/schemas/recipe-seed'
import {
  AGITATION_METHODS,
  AGITATION_TEXT,
  DIAGNOSIS,
  ESPRESSO_WATER_STEP_PCT,
  HALF_STEP_FACTOR,
  MAX_SYMPTOMS,
  MIN_BLOOM_S,
  REASON_TEXT,
  WATER_LIMITS_X_DOSE,
  type Candidate,
} from './adjust-tables'

export type AdjustVersion = RecipeVersion & { createdAtEpochMs: number }

export interface EvaluatedBrew {
  sessionId: string
  versionId: string
  rating: RatingLevel
  symptoms: Symptom[]
  finishedAtEpochMs: number
}

export interface AdjustContext {
  method: Method
  grinder: GrinderSetup | null
  /** Altitud donde preparas: techo de ebullición (P-14.1) */
  prepAltitudeM: number | null
}

export type AdjustOutcome =
  | { kind: 'lock_proposal'; versionId: string } // R2
  | { kind: 'keep'; hint: Symptom | null } // nivel 4 (R3 guarda la pista) o versión bloqueada
  | { kind: 'propose'; base: AdjustVersion; changes: AdjustChange[]; meta: AdjustMeta } // R3, R4, R5
  | { kind: 'revert'; revertedVersionId: string; base: AdjustVersion; changes: AdjustChange[]; meta: AdjustMeta | null } // R6
  | { kind: 'unlock_suggestion'; versionId: string; daysSinceRoast: number | null } // R7
  | { kind: 'no_symptom' } // R8
  | { kind: 'no_option'; symptoms: Symptom[] } // ninguna candidata aplica con tu equipo o los límites

// ── Utilidades ───────────────────────────────────────────────────────────

export function averageRating(versionId: string, brews: EvaluatedBrew[]): number | null {
  const own = brews.filter((b) => b.versionId === versionId)
  return own.length ? own.reduce((a, b) => a + b.rating, 0) / own.length : null
}

/**
 * R1 · Mejor punto de partida. Bloqueada si existe; si la versión más nueva aún no se probó
 * (una propuesta que aceptaste), esa; si no, la de mejor promedio; empate → la más reciente.
 * Las revertidas no compiten.
 */
export function bestStart(versions: AdjustVersion[], brews: EvaluatedBrew[]): AdjustVersion | null {
  const live = versions.filter((v) => v.status !== 'reverted')
  if (!live.length) return null
  // El número de versión crece dentro de la receta: ordena mejor que la fecha (el seed se reescribe)
  const newestFirst = [...live].sort((a, b) => b.number - a.number || b.createdAtEpochMs - a.createdAtEpochMs)
  const locked = newestFirst.find((v) => v.status === 'locked')
  if (locked) return locked
  const newest = newestFirst[0]!
  if (newest.parentVersionId && averageRating(newest.id, brews) === null) return newest
  let best = newest
  let bestAvg = averageRating(newest.id, brews) ?? -1
  for (const v of newestFirst) {
    const avg = averageRating(v.id, brews) ?? -1
    if (avg > bestAvg) {
      best = v
      bestAvg = avg
    }
  }
  return best
}

export function reasonFor(change: AdjustChange): string {
  const up =
    change.variable === 'agitation'
      ? change.after === AGITATION_TEXT.agitate_pour2
      : Number(change.after) > Number(change.before)
  return REASON_TEXT[`${change.variable}:${up ? 'up' : 'down'}`]
}

const firstTimed = (p: RecipeParams) => p.steps.findIndex((s) => s.type !== 'prep')
const pours = (p: RecipeParams) => p.steps.filter((s) => s.type === 'pour')

/**
 * Convierte una candidata en un cambio concreto sobre `params`, o null si no aplica:
 * método sin esa variable, sin molino, medio paso imposible o fuera de límites (SDD §5.4 punto 9).
 */
export function materialize(c: Candidate, half: boolean, params: RecipeParams, ctx: AdjustContext): AdjustChange | null {
  const k = half ? HALF_STEP_FACTOR : 1
  switch (c.variable) {
    case 'tempC': {
      const after = params.tempC + c.delta * k
      // Fuera del rango del método o sobre la ebullición local: no aplica
      if (clampTempC(after, ctx.method, ctx.prepAltitudeM).tempC !== after) return null
      return { variable: 'tempC', before: params.tempC, after, stepId: null }
    }
    case 'grindClicks': {
      const g = ctx.grinder
      const clicks = params.grind.clicks
      if (!g || clicks === null) return null
      const positions = c.delta * k * g.clicksPerStep
      if (!Number.isInteger(positions)) return null // medio paso imposible en este molino → candidata 2
      const after = clicks + positions
      if (after < g.minClicks || after > g.maxClicks) return null
      return { variable: 'grindClicks', before: clicks, after, stepId: null }
    }
    case 'waterG': {
      const delta =
        ctx.method === 'espresso'
          ? Math.sign(c.delta) * roundWater('espresso', (params.waterG * ESPRESSO_WATER_STEP_PCT * k) / 100)
          : c.delta * k
      const after = roundWater(ctx.method, params.waterG + delta)
      const [lo, hi] = WATER_LIMITS_X_DOSE[ctx.method]
      if (after < lo * params.doseG || after > hi * params.doseG) return null
      return { variable: 'waterG', before: params.waterG, after, stepId: null }
    }
    case 'bloomS': {
      const i = firstTimed(params)
      const bloom = params.steps[i]
      if (ctx.method === 'espresso' || !bloom || bloom.type !== 'pour' || bloom.startS === null || bloom.endS === null) return null
      const before = bloom.endS - bloom.startS
      const after = before + c.delta * k
      if (after < MIN_BLOOM_S) return null
      return { variable: 'bloomS', before, after, stepId: bloom.id }
    }
    case 'agitation': {
      if (!AGITATION_METHODS.includes(ctx.method)) return null
      const ps = pours(params)
      const step = c.mode === 'no_agitate_last' ? ps[ps.length - 1] : ps[2]
      if (!step) return null
      const before = step.technique ?? ''
      const already = c.mode === 'no_agitate_last' ? /sin agitar/i.test(before) : /agita/i.test(before) && !/sin agitar/i.test(before)
      if (already) return null
      return { variable: 'agitation', before, after: AGITATION_TEXT[c.mode], stepId: step.id }
    }
  }
}

/** Aplica los cambios a una copia de `params` (las metas de agua y ventanas se recalculan) */
export function applyChanges(params: RecipeParams, changes: AdjustChange[], method: Method): RecipeParams {
  let p: RecipeParams = { ...params, steps: [...params.steps] }
  for (const c of changes) {
    if (c.variable === 'tempC') p = { ...p, tempC: Number(c.after) }
    if (c.variable === 'grindClicks') p = { ...p, grind: { ...p.grind, clicks: Number(c.after) } }
    if (c.variable === 'waterG') {
      p = { ...p, waterG: Number(c.after), steps: scaleTargets(p.steps, p.waterG, Number(c.after), method) }
    }
    if (c.variable === 'bloomS') {
      const shift = Number(c.after) - Number(c.before)
      const i = p.steps.findIndex((s) => s.id === c.stepId)
      p = {
        ...p,
        totalMinS: p.totalMinS + shift,
        totalMaxS: p.totalMaxS + shift,
        steps: p.steps.map((s, k) => {
          if (k < i || s.startS === null || s.endS === null) return s
          if (k === i) return { ...s, endS: s.endS + shift }
          return { ...s, startS: s.startS + shift, endS: s.endS + shift }
        }),
      }
    }
    if (c.variable === 'agitation') {
      p = { ...p, steps: p.steps.map((s) => (s.id === c.stepId ? { ...s, technique: String(c.after) } : s)) }
    }
  }
  return p
}

/** Primera candidata del síntoma que aplica y no usa una variable excluida */
function pick(symptom: Symptom, half: boolean, params: RecipeParams, ctx: AdjustContext, exclude: Set<AdjustVariable>): AdjustChange | null {
  for (const c of DIAGNOSIS[symptom]) {
    if (exclude.has(c.variable)) continue
    const ch = materialize(c, half, params, ctx)
    if (ch) return ch
  }
  return null
}

/** El brew anterior de la misma versión (sin contar `latest`) */
function previousOf(latest: EvaluatedBrew, history: EvaluatedBrew[]): EvaluatedBrew | null {
  return (
    history
      .filter((b) => b.versionId === latest.versionId && b.sessionId !== latest.sessionId && b.finishedAtEpochMs <= latest.finishedAtEpochMs)
      .sort((a, b) => b.finishedAtEpochMs - a.finishedAtEpochMs)[0] ?? null
  )
}

export function proposeAdjustment(args: {
  current: AdjustVersion
  versions: AdjustVersion[]
  /** Brews evaluados de esta receta; incluye `latest` */
  history: EvaluatedBrew[]
  latest: EvaluatedBrew
  ctx: AdjustContext
  roastDateISO: string | null
  todayISO: string
}): AdjustOutcome {
  const { current, versions, history, latest, ctx } = args
  const r = latest.rating
  const symptoms = latest.symptoms.slice(0, r === 5 ? 0 : MAX_SYMPTOMS[r])

  // R2 + R7: una bloqueada no se ajusta sola
  if (current.status === 'locked') {
    const prev = previousOf(latest, history)
    if (r <= 3 && prev && prev.rating <= 3) {
      const days = args.roastDateISO ? roastWindow(args.roastDateISO, args.todayISO, ctx.method).days : null
      return { kind: 'unlock_suggestion', versionId: current.id, daysSinceRoast: days }
    }
    return { kind: 'keep', hint: null }
  }
  if (r === 5) return { kind: 'lock_proposal', versionId: current.id }

  // R6 · Revertir: la versión nueva salió peor que su padre
  const parent = current.parentVersionId ? versions.find((v) => v.id === current.parentVersionId) : undefined
  if (parent && parent.status !== 'reverted') {
    const ac = averageRating(current.id, history)
    const ap = averageRating(parent.id, history)
    if (ac !== null && ap !== null && ac < ap) {
      const meta = current.adjustMeta ?? null
      if (!meta) return { kind: 'revert', revertedVersionId: current.id, base: parent, changes: [], meta: null }
      const tried = new Set<AdjustVariable>(meta.tried)
      const half = meta.ratingLevel >= 3
      const changes: AdjustChange[] = []
      for (const s of meta.symptoms) {
        const ch = pick(s, half, parent.params, ctx, tried)
        if (ch) {
          changes.push(ch)
          tried.add(ch.variable)
        }
      }
      return {
        kind: 'revert',
        revertedVersionId: current.id,
        base: parent,
        changes,
        meta: changes.length
          ? { rule: 'R6', symptoms: meta.symptoms, ratingLevel: meta.ratingLevel, changes, tried: [...tried], fromSessionId: latest.sessionId }
          : null,
      }
    }
  }

  // R8 · nivel 1–3 sin síntoma: no se inventa un ajuste
  if (!symptoms.length) return r <= 3 ? { kind: 'no_symptom' } : { kind: 'keep', hint: null }

  const make = (rule: AdjustMeta['rule'], used: Symptom[], changes: AdjustChange[]): AdjustOutcome =>
    changes.length
      ? {
          kind: 'propose',
          base: current,
          changes,
          meta: { rule, symptoms: used, ratingLevel: r, changes, tried: changes.map((c) => c.variable), fromSessionId: latest.sessionId },
        }
      : { kind: 'no_option', symptoms: used }

  // R3 · Pista (nivel 4): la misma pista en 2 brews seguidos de esta versión → 1 cambio a medio paso
  if (r === 4) {
    const s = symptoms[0]!
    const prev = previousOf(latest, history)
    if (prev?.rating === 4 && prev.symptoms[0] === s) {
      const ch = pick(s, true, current.params, ctx, new Set())
      return make('R3', [s], ch ? [ch] : [])
    }
    return { kind: 'keep', hint: s }
  }

  // R4 · Ajuste fino (nivel 3): 1 cambio a medio paso
  if (r === 3) {
    const s = symptoms[0]!
    const ch = pick(s, true, current.params, ctx, new Set())
    return make('R4', [s], ch ? [ch] : [])
  }

  // R5 · Ajuste (nivel 1–2): una candidata por síntoma, máximo 2 variables, sin repetir variable
  const used = new Set<AdjustVariable>()
  const changes: AdjustChange[] = []
  const usedSymptoms: Symptom[] = []
  for (const s of symptoms) {
    const ch = pick(s, false, current.params, ctx, used)
    if (!ch) continue
    // Si el segundo síntoma pide la misma variable, usa su candidata 2 (o se descarta)
    changes.push(ch)
    used.add(ch.variable)
    usedSymptoms.push(s)
  }
  return make('R5', usedSymptoms.length ? usedSymptoms : symptoms, changes)
}

