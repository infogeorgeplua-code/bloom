/**
 * Motor de recetas determinista (SDD §5.3, product §11) con las tablas P-14.1 (engine-tables.ts).
 * Parte de la receta base del método (seed, product §9), aplica el tueste del café y la regla del
 * objetivo (UNA variable, con su evidencia) y acota la temperatura por método y por la ebullición
 * a tu altitud. Sin LLM: todo número sale de aquí o del seed.
 */
import type { CoffeeRecord, RoastLevel, SetupRecord } from '@/lib/schemas/coffee'
import { ROAST_LABEL } from '@/lib/schemas/coffee'
import type { Method, RecipeParams, RecipeStep } from '@/lib/schemas/recipe-seed'
import { seedRecipes } from '@/lib/recipes'
import {
  ENGINE_VERSION,
  PREFERENCE_TO_OBJECTIVE,
  PRIORITY_TEXT,
  PRIORITY_TEXT_NO_CHANGE,
  RATIO_DEFINITION,
  ROAST_TEMP_ADJUST,
  ROAST_TEMP_EVIDENCE,
  ROAST_WINDOW_DAYS,
  clampTempC,
  ruleFor,
  type Evidence,
  type Objective,
  type Preference,
  type RoastWindowState,
  type TechnicalObjective,
} from './engine-tables'

export type EngineCoffee = Pick<CoffeeRecord, 'id' | 'roastLevel' | 'process' | 'altitudeM' | 'roastDateISO'>

export interface RecipeInput {
  method: Method
  objective: Objective
  /** Solo con 'para_alguien_mas' */
  preference?: Preference | null
  coffee: EngineCoffee | null
  setup: SetupRecord
  todayISO: string
  /** Por defecto ENABLE_HYPOTHESIS_RULES (apagado) */
  enableHypotheses?: boolean
}

export interface Change {
  variable: 'tempC' | 'ratio'
  /** "Tueste claro: +1 °C" */
  label: string
  evidence: Evidence | null
}

export interface RoastWindow {
  days: number
  state: RoastWindowState
}

export interface RecipeOutput {
  params: RecipeParams
  /** Objetivo técnico aplicado (resuelve "para alguien más") */
  technicalObjective: TechnicalObjective
  priority: string
  changes: Change[]
  roast: RoastWindow | null
  /** Evidencia de la regla del objetivo que se aplicó; null si no movió nada */
  objectiveEvidence: Evidence | null
  engineVersion: typeof ENGINE_VERSION
}

const fmtNum = (n: number) => String(Math.abs(n)).replace('.', ',')
const fmtSigned = (n: number) => `${n > 0 ? '+' : '−'}${fmtNum(n)}`

export function baseRecipe(method: Method) {
  const r = seedRecipes().find((x) => x.method === method && x.source === 'seed')
  if (!r) throw new Error(`No hay receta base para ${method}`)
  return r
}

export function resolveObjective(objective: Objective, preference: Preference | null | undefined): TechnicalObjective {
  if (objective !== 'para_alguien_mas') return objective
  return PREFERENCE_TO_OBJECTIVE[preference ?? 'sorprendeme']
}

/** Días desde el tueste y estado de la ventana orientativa (7–21 d filtrado, 14–30 d espresso) */
export function roastWindow(roastDateISO: string, todayISO: string, method: Method): RoastWindow {
  const day = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
  const days = Math.max(0, Math.round((day(todayISO) - day(roastDateISO)) / 86_400_000))
  const [from, to] = ROAST_WINDOW_DAYS[method === 'espresso' ? 'espresso' : 'filtrado']
  return { days, state: days < from ? 'reposo' : days > to ? 'fuera_de_ventana' : 'en_ventana' }
}

export const roastAdjust = (r: RoastLevel | null) => (r ? ROAST_TEMP_ADJUST[r] : 0)

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Clicks del molino para el método ± posiciones; null sin molino configurado */
export function grindFor(method: Method, steps: number, setup: SetupRecord): number | null {
  const g = setup.grinder
  if (!g) return null
  return clamp(g.base[method] + steps * g.clicksPerStep, g.minClicks, g.maxClicks)
}

/** Filtrado en gramos enteros; espresso (bebida en taza) con un decimal: 32,4 g */
export function roundWater(method: Method, g: number): number {
  return RATIO_DEFINITION[method] === 'bebida_en_taza_sobre_dosis' ? Math.round(g * 10) / 10 : Math.round(g)
}

/** Reescala las metas acumuladas al nuevo total de agua (siempre crecientes; la última = el total) */
export function scaleTargets(steps: RecipeStep[], fromWater: number, toWater: number, method: Method): RecipeStep[] {
  if (fromWater === toWater) return steps
  let last = 0
  return steps.map((s) => {
    if (s.targetG === null) return s
    const isLast = s.targetG === fromWater
    const scaled = isLast ? toWater : roundWater(method, (s.targetG * toWater) / fromWater)
    const t = Math.max(last + (method === 'espresso' ? 0.1 : 1), scaled)
    last = t
    return { ...s, targetG: t }
  })
}

export function generateRecipe(input: RecipeInput): RecipeOutput {
  const { method, coffee, setup, todayISO } = input
  const base = baseRecipe(method).params
  const technicalObjective = resolveObjective(input.objective, input.preference)
  const rule = ruleFor(technicalObjective, method, input.enableHypotheses)
  const changes: Change[] = []
  const warnings = [...base.warnings]

  // 1 · Temperatura: tueste (heurística) + objetivo si mueve °C, acotada por método y ebullición local
  let temp = base.tempC
  const roast = roastAdjust(coffee?.roastLevel ?? null)
  if (roast && coffee?.roastLevel) {
    temp += roast
    changes.push({ variable: 'tempC', label: `Tueste ${ROAST_LABEL[coffee.roastLevel].toLowerCase()}: ${fmtSigned(roast)} °C`, evidence: ROAST_TEMP_EVIDENCE })
  }
  if (rule.variable === 'tempC' && rule.delta) {
    temp += rule.delta
    changes.push({
      variable: 'tempC',
      label: `Objetivo: ${fmtSigned(rule.delta)} °C${rule.evidence === 'hipotesis' ? ' (experimento)' : ''}`,
      evidence: rule.evidence,
    })
  }
  const clamped = clampTempC(temp, method, setup.brewAltitudeM)
  if (clamped.cappedBy === 'ebullicion') {
    changes.push({ variable: 'tempC', label: `Tu altitud: tope ${fmtNum(clamped.tempC)} °C`, evidence: 'mecanica' })
  } else if (clamped.cappedBy) {
    changes.push({ variable: 'tempC', label: `Límite del método: ${fmtNum(clamped.tempC)} °C`, evidence: 'mecanica' })
  }
  if (clamped.warning) warnings.push(clamped.warning)

  // 2 · Ratio en % relativo (P-14.1 principio 3) → agua total y metas acumuladas
  let waterG = base.waterG
  let steps = base.steps
  if (rule.variable === 'ratioPct' && rule.delta) {
    waterG = roundWater(method, base.waterG * (1 + rule.delta / 100))
    steps = scaleTargets(base.steps, base.waterG, waterG, method)
    const what = method === 'espresso' ? 'bebida en taza' : 'agua por gramo'
    changes.push({
      variable: 'ratio',
      label: `Objetivo: ${rule.delta > 0 ? 'más' : 'menos'} ${what} (${fmtSigned(rule.delta)} %)`,
      evidence: rule.evidence,
    })
  }

  // Avisos de frescura: nunca mueven números ni bloquean el café
  const fresh = coffee?.roastDateISO ? roastWindow(coffee.roastDateISO, todayISO, method) : null
  if (fresh?.state === 'reposo') warnings.push(`Café muy fresco (${fresh.days} d desde el tueste): el bloom puede crecer más.`)
  if (fresh?.state === 'fuera_de_ventana') warnings.push(`Tostado hace ${fresh.days} d: fuera de la ventana orientativa.`)

  const moved = rule.variable !== null && rule.delta !== 0
  let priority: string
  if (technicalObjective === 'equilibrado') priority = roast ? PRIORITY_TEXT.equilibrado : 'Partimos de la receta base.'
  else priority = moved ? PRIORITY_TEXT[technicalObjective] : PRIORITY_TEXT_NO_CHANGE
  if (input.objective === 'para_alguien_mas') priority = `Para alguien más. ${priority}`

  return {
    params: {
      ...base,
      waterG,
      tempC: clamped.tempC,
      grind: { descriptor: base.grind.descriptor, clicks: grindFor(method, 0, setup) },
      steps,
      warnings,
    },
    technicalObjective,
    priority,
    changes,
    roast: fresh,
    objectiveEvidence: moved ? rule.evidence : null,
    engineVersion: ENGINE_VERSION,
  }
}

/** Identidad estable de una receta: café + método + objetivo (product §21) */
export function recipeIdFor(coffeeId: string | null, method: Method, objective: Objective): string {
  return `${coffeeId ?? 'sin-cafe'}:${method}:${objective}`
}

export const ENGINE_TRACEABILITY = {
  kind: 'regla_tecnica' as const,
  label: 'Regla técnica: receta base de Bloom ajustada a tu objetivo y a tu café',
  status: 'inferido' as const,
  url: null,
  year: null,
  championRef: null,
}
