/**
 * Motor de recetas determinista (SDD §5.3, product §11). Parte de la receta base del método
 * (seed, product §9), aplica el objetivo (≤ 2 variables) y la ficha del café. Sin LLM: todo
 * número sale de aquí o del seed. Las tablas viven en engine-tables.ts (P-14).
 */
import type { CoffeeRecord, ProcessType, RoastLevel, SetupRecord } from '@/lib/schemas/coffee'
import { PROCESS_LABEL, ROAST_LABEL } from '@/lib/schemas/coffee'
import type { Method, RecipeParams, RecipeStep } from '@/lib/schemas/recipe-seed'
import { seedRecipes } from '@/lib/recipes'
import {
  COFFEE_ALTITUDE_TEMP_ADJUST,
  OBJECTIVE_DELTAS,
  PREFERENCE_TO_OBJECTIVE,
  PRIORITY_TEXT,
  PROCESS_TEMP_ADJUST,
  ROAST_TEMP_ADJUST,
  ROAST_WINDOW_DAYS,
  TECHNIQUE_TEXT,
  TEMP_LIMITS_C,
  type Objective,
  type Preference,
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
}

export interface Change {
  variable: 'tempC' | 'grind' | 'ratio' | 'bloom' | 'technique'
  /** "Tueste claro: +1 °C" */
  label: string
}

export interface RoastWindow {
  days: number
  state: 'reposo' | 'ideal' | 'pasada'
}

export interface RecipeOutput {
  params: RecipeParams
  /** Objetivo técnico aplicado (resuelve "para alguien más") */
  technicalObjective: TechnicalObjective
  priority: string
  changes: Change[]
  roast: RoastWindow | null
}

const fmtSigned = (n: number) => `${n > 0 ? '+' : '−'}${String(Math.abs(n)).replace('.', ',')}`

export function baseRecipe(method: Method) {
  const r = seedRecipes().find((x) => x.method === method && x.source === 'seed')
  if (!r) throw new Error(`No hay receta base para ${method}`)
  return r
}

export function resolveObjective(objective: Objective, preference: Preference | null | undefined): TechnicalObjective {
  if (objective !== 'para_alguien_mas') return objective
  // Sin preferencia: dulzor prioritario (product §11)
  return PREFERENCE_TO_OBJECTIVE[preference ?? 'sorprendeme']
}

/** Días desde el tueste y estado de la ventana (7–21 d filtrado, 14–30 d espresso) */
export function roastWindow(roastDateISO: string, todayISO: string, method: Method): RoastWindow {
  const day = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
  const days = Math.max(0, Math.round((day(todayISO) - day(roastDateISO)) / 86_400_000))
  const [from, to] = ROAST_WINDOW_DAYS[method === 'espresso' ? 'espresso' : 'filtrado']
  return { days, state: days < from ? 'reposo' : days > to ? 'pasada' : 'ideal' }
}

/** El agua hierve a ≈ 100 − altitud/300 °C; la receta queda 1 °C por debajo. null = sin tope. */
export function brewAltitudeCap(altitudeM: number | null): number | null {
  if (altitudeM === null || altitudeM <= 0) return null
  return Math.floor((100 - altitudeM / 300) * 2) / 2 - 1
}

export function coffeeAltitudeAdjust(altitudeM: number | null): number {
  if (altitudeM === null) return 0
  return COFFEE_ALTITUDE_TEMP_ADJUST.find((r) => altitudeM >= r.minM)?.tempC ?? 0
}

export const roastAdjust = (r: RoastLevel | null) => (r ? ROAST_TEMP_ADJUST[r] : 0)
export const processAdjust = (p: ProcessType | null) => (p ? PROCESS_TEMP_ADJUST[p] : 0)

const roundHalf = (n: number) => Math.round(n * 2) / 2
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Clicks del molino para el método ± pasos; null sin molino configurado */
export function grindFor(method: Method, steps: number, setup: SetupRecord): number | null {
  const g = setup.grinder
  if (!g) return null
  return clamp(g.base[method] + steps * g.clicksPerStep, g.minClicks, g.maxClicks)
}

function grindDescriptor(base: string, steps: number): string {
  if (steps < 0) return `${base}, un poco más fina`
  if (steps > 0) return `${base}, un poco más gruesa`
  return base
}

/** Reescala las metas acumuladas al nuevo total de agua (enteros, siempre crecientes) */
function scaleTargets(steps: RecipeStep[], fromWater: number, toWater: number): RecipeStep[] {
  if (fromWater === toWater) return steps
  let last = 0
  return steps.map((s) => {
    if (s.targetG === null) return s
    const isLast = s.targetG === fromWater
    const t = Math.max(last + 1, isLast ? toWater : Math.round((s.targetG * toWater) / fromWater))
    last = t
    return { ...s, targetG: t }
  })
}

export function generateRecipe(input: RecipeInput): RecipeOutput {
  const { method, coffee, setup, todayISO } = input
  const base = baseRecipe(method).params
  const technicalObjective = resolveObjective(input.objective, input.preference)
  const delta = OBJECTIVE_DELTAS[technicalObjective][method]
  const changes: Change[] = []
  const warnings = [...base.warnings]

  // 1 · Temperatura: objetivo + ficha del café, acotada y redondeada a 0,5
  let temp = base.tempC
  if (delta.tempC) {
    temp += delta.tempC
    changes.push({ variable: 'tempC', label: `Objetivo: ${fmtSigned(delta.tempC)} °C` })
  }
  const contextual: [number, string][] = [
    [roastAdjust(coffee?.roastLevel ?? null), coffee?.roastLevel ? `Tueste ${ROAST_LABEL[coffee.roastLevel].toLowerCase()}` : ''],
    [processAdjust(coffee?.process ?? null), coffee?.process ? `Proceso ${PROCESS_LABEL[coffee.process].toLowerCase()}` : ''],
    [coffeeAltitudeAdjust(coffee?.altitudeM ?? null), coffee?.altitudeM != null ? `Altitud del cultivo ${coffee.altitudeM} m` : ''],
  ]
  for (const [d, label] of contextual) {
    if (!d) continue
    temp += d
    changes.push({ variable: 'tempC', label: `${label}: ${fmtSigned(d)} °C` })
  }
  temp = roundHalf(clamp(temp, TEMP_LIMITS_C[0], TEMP_LIMITS_C[1]))
  const cap = brewAltitudeCap(setup.brewAltitudeM)
  if (cap !== null && temp > cap) {
    temp = cap
    changes.push({ variable: 'tempC', label: `Tu altitud: el agua hierve antes, tope ${String(cap).replace('.', ',')} °C` })
  }

  // 2 · Molienda
  const clicks = grindFor(method, delta.grindSteps, setup)
  if (delta.grindSteps) {
    changes.push({ variable: 'grind', label: `Objetivo: molienda ${delta.grindSteps < 0 ? 'más fina' : 'más gruesa'}` })
  }

  // 3 · Ratio → agua total y metas acumuladas
  const baseRatio = base.waterG / base.doseG
  const ratio = baseRatio + delta.ratio
  const waterG = Math.round(base.doseG * ratio)
  let steps = scaleTargets(base.steps, base.waterG, waterG)
  if (delta.ratio) changes.push({ variable: 'ratio', label: `Objetivo: ratio ${fmtSigned(delta.ratio)}` })

  // 4 · Bloom más corto
  if (delta.bloomShorterS) {
    const i = steps.findIndex((s) => s.type !== 'prep')
    const bloom = steps[i]
    if (bloom && bloom.startS !== null && bloom.endS !== null) {
      const endS = Math.max(bloom.startS + 10, bloom.endS - delta.bloomShorterS)
      steps = steps.map((s, k) => (k === i ? { ...s, endS } : s))
      changes.push({ variable: 'bloom', label: `Objetivo: bloom ${delta.bloomShorterS} s más corto` })
    }
  }

  // 5 · Técnica de los vertidos (después del bloom)
  if (delta.technique) {
    const firstTimed = steps.findIndex((s) => s.type !== 'prep')
    const text = TECHNIQUE_TEXT[delta.technique]
    steps = steps.map((s, k) => (s.type === 'pour' && k > firstTimed ? { ...s, technique: text } : s))
    changes.push({ variable: 'technique', label: `Objetivo: ${delta.technique === 'agitar' ? 'más agitación' : 'vertidos lentos'}` })
  }

  // Avisos (no mueven números)
  const roast = coffee?.roastDateISO ? roastWindow(coffee.roastDateISO, todayISO, method) : null
  if (roast?.state === 'reposo') warnings.push(`Café muy fresco (${roast.days} d desde el tueste): el bloom puede crecer más.`)
  if (roast?.state === 'pasada') warnings.push(`Tostado hace ${roast.days} d: puede saber más plano.`)

  const priority = input.objective === 'para_alguien_mas' ? `Para alguien más. ${PRIORITY_TEXT[technicalObjective]}` : PRIORITY_TEXT[technicalObjective]

  return {
    params: {
      ...base,
      waterG,
      tempC: temp,
      grind: { descriptor: grindDescriptor(base.grind.descriptor, delta.grindSteps), clicks },
      steps,
      warnings,
    },
    technicalObjective,
    priority,
    changes,
    roast,
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
