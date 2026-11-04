import { describe, expect, it } from 'vitest'
import {
  COFFEE_ALTITUDE_TEMP_ADJUST,
  OBJECTIVE_DELTAS,
  PREFERENCE_TO_OBJECTIVE,
  PROCESS_TEMP_ADJUST,
  ROAST_TEMP_ADJUST,
  type TechnicalObjective,
} from '@/features/recipes/engine-tables'
import { LEBURRY_38, presetBase, setupFromPreset } from '@/features/recipes/grinders'
import {
  baseRecipe,
  brewAltitudeCap,
  coffeeAltitudeAdjust,
  generateRecipe,
  grindFor,
  recipeIdFor,
  resolveObjective,
  roastWindow,
  type EngineCoffee,
} from '@/features/recipes/recipe-engine'
import { EMPTY_SETUP, type ProcessType, type RoastLevel } from '@/lib/schemas/coffee'
import { RecipeParams, type Method } from '@/lib/schemas/recipe-seed'

const METHODS: Method[] = ['v60', 'aeropress', 'espresso']
const TODAY = '2026-11-04'
const LEB = { grinder: setupFromPreset(LEBURRY_38), brewAltitudeM: null }
const coffee = (c: Partial<EngineCoffee> = {}): EngineCoffee => ({
  id: 'c1', roastLevel: null, process: null, altitudeM: null, roastDateISO: null, ...c,
})
const gen = (method: Method, objective: TechnicalObjective | 'para_alguien_mas', c: EngineCoffee | null = null, setup = EMPTY_SETUP) =>
  generateRecipe({ method, objective, coffee: c, setup, todayISO: TODAY })

describe('OBJECTIVE_DELTAS: cada fila (objetivo × método)', () => {
  for (const [objective, byMethod] of Object.entries(OBJECTIVE_DELTAS) as [TechnicalObjective, (typeof OBJECTIVE_DELTAS)['dulce']][]) {
    for (const method of METHODS) {
      const d = byMethod[method]
      it(`${objective} · ${method}`, () => {
        const base = baseRecipe(method).params
        const out = gen(method, objective, null, LEB)
        // Nunca más de 2 variables por objetivo (product §11)
        const moved = [d.tempC, d.grindSteps, d.ratio, d.bloomShorterS, d.technique].filter((x) => x !== 0 && x !== null)
        expect(moved.length).toBeLessThanOrEqual(2)
        expect(out.params.tempC).toBe(base.tempC + d.tempC)
        expect(out.params.grind.clicks).toBe(grindFor(method, d.grindSteps, LEB))
        expect(out.params.waterG).toBe(Math.round(base.doseG * (base.waterG / base.doseG + d.ratio)))
        expect(out.params.doseG).toBe(base.doseG)
        const bloomI = base.steps.findIndex((s) => s.type !== 'prep')
        expect(out.params.steps[bloomI]!.endS).toBe(base.steps[bloomI]!.endS! - d.bloomShorterS)
        if (d.technique) {
          expect(out.params.steps.some((s, i) => i > bloomI && s.type === 'pour' && s.technique !== base.steps[i]!.technique)).toBe(true)
        } else {
          expect(out.params.steps.map((s) => s.technique)).toEqual(base.steps.map((s) => s.technique))
        }
        // La receta generada sigue siendo válida para Brew Mode
        expect(() => RecipeParams.parse(out.params)).not.toThrow()
      })
    }
  }

  it('equilibrado sin café ni molino = receta base (sin clicks inventados)', () => {
    const out = gen('v60', 'equilibrado')
    const base = baseRecipe('v60').params
    expect(out.params.tempC).toBe(base.tempC)
    expect(out.params.waterG).toBe(base.waterG)
    expect(out.params.grind).toEqual({ descriptor: base.grind.descriptor, clicks: null })
    expect(out.changes).toEqual([])
  })

  it('claridad V60: 1:17 → 255 g y la última meta es el agua total', () => {
    const out = gen('v60', 'claridad')
    expect(out.params.waterG).toBe(255)
    const targets = out.params.steps.map((s) => s.targetG).filter((t): t is number => t !== null)
    expect(targets.at(-1)).toBe(255)
    expect([...targets].sort((a, b) => a - b)).toEqual(targets)
  })

  it('claridad espresso: 1:2 → 1:2,5 (45 g en taza)', () => {
    expect(gen('espresso', 'claridad').params.waterG).toBe(45)
  })
})

describe('PREFERENCE_TO_OBJECTIVE: cada fila', () => {
  for (const [pref, obj] of Object.entries(PREFERENCE_TO_OBJECTIVE)) {
    it(`${pref} → ${obj}`, () => {
      expect(resolveObjective('para_alguien_mas', pref as keyof typeof PREFERENCE_TO_OBJECTIVE)).toBe(obj)
      const out = generateRecipe({ method: 'v60', objective: 'para_alguien_mas', preference: pref as never, coffee: null, setup: EMPTY_SETUP, todayISO: TODAY })
      expect(out.technicalObjective).toBe(obj)
      expect(out.priority.startsWith('Para alguien más.')).toBe(true)
    })
  }
  it('sin preferencia: dulzor prioritario', () => {
    expect(resolveObjective('para_alguien_mas', null)).toBe('dulce')
  })
  it('los demás objetivos pasan tal cual', () => {
    expect(resolveObjective('brillante', 'floral')).toBe('brillante')
  })
})

describe('ROAST_TEMP_ADJUST: cada fila', () => {
  for (const [level, d] of Object.entries(ROAST_TEMP_ADJUST) as [RoastLevel, number][]) {
    it(`${level}: ${d} °C`, () => {
      expect(gen('v60', 'equilibrado', coffee({ roastLevel: level })).params.tempC).toBe(92 + d)
    })
  }
})

describe('PROCESS_TEMP_ADJUST: cada fila', () => {
  for (const [p, d] of Object.entries(PROCESS_TEMP_ADJUST) as [ProcessType, number][]) {
    it(`${p}: ${d} °C`, () => {
      expect(gen('aeropress', 'equilibrado', coffee({ process: p })).params.tempC).toBe(88 + d)
    })
  }
})

describe('COFFEE_ALTITUDE_TEMP_ADJUST: cada fila y sus bordes', () => {
  for (const row of COFFEE_ALTITUDE_TEMP_ADJUST) {
    it(`desde ${row.minM} m: ${row.tempC} °C`, () => {
      expect(coffeeAltitudeAdjust(row.minM)).toBe(row.tempC)
    })
  }
  it('1799 m → 0, 1199 m → −1, sin dato → 0', () => {
    expect(coffeeAltitudeAdjust(1799)).toBe(0)
    expect(coffeeAltitudeAdjust(1199)).toBe(-1)
    expect(coffeeAltitudeAdjust(null)).toBe(0)
  })
})

describe('ROAST_WINDOW_DAYS', () => {
  it.each([
    ['v60', '2026-10-29', 6, 'reposo'],
    ['v60', '2026-10-28', 7, 'ideal'],
    ['aeropress', '2026-10-14', 21, 'ideal'],
    ['v60', '2026-10-13', 22, 'pasada'],
    ['espresso', '2026-10-22', 13, 'reposo'],
    ['espresso', '2026-10-21', 14, 'ideal'],
    ['espresso', '2026-10-05', 30, 'ideal'],
    ['espresso', '2026-10-04', 31, 'pasada'],
  ] as const)('%s tostado el %s → %i d, %s', (method, date, days, state) => {
    expect(roastWindow(date, TODAY, method)).toEqual({ days, state })
  })
  it('solo avisa: no mueve números', () => {
    const fresh = gen('v60', 'equilibrado', coffee({ roastDateISO: '2026-11-02' }))
    expect(fresh.params.tempC).toBe(92)
    expect(fresh.params.warnings.some((w) => w.includes('muy fresco'))).toBe(true)
    expect(gen('v60', 'equilibrado', coffee({ roastDateISO: '2026-09-01' })).params.warnings.some((w) => w.includes('plano'))).toBe(true)
  })
})

describe('Altitud donde preparas (punto de ebullición)', () => {
  it.each([
    [null, null],
    [0, null],
    [1500, 94],
    [2850, 89.5],
  ] as const)('%s m → tope %s °C', (alt, cap) => {
    expect(brewAltitudeCap(alt)).toBe(cap)
  })
  it('limita la temperatura sin tocar recetas por debajo del tope', () => {
    const quito = { grinder: null, brewAltitudeM: 2850 }
    expect(gen('v60', 'dulce', null, quito).params.tempC).toBe(89.5)
    expect(gen('aeropress', 'brillante', null, quito).params.tempC).toBe(87)
  })
})

describe('Límites y combinación', () => {
  it('temperatura acotada a 80–100 °C y en medios grados', () => {
    const hot = gen('espresso', 'dulce', coffee({ roastLevel: 'claro', altitudeM: 2000 }))
    expect(hot.params.tempC).toBe(96)
    const cold = gen('aeropress', 'brillante', coffee({ roastLevel: 'oscuro', process: 'natural', altitudeM: 900 }))
    expect(cold.params.tempC).toBe(83)
    expect(cold.changes.filter((c) => c.variable === 'tempC')).toHaveLength(4)
  })
})

describe('Molino LEBURRY (38 posiciones, 1 = más fina)', () => {
  it('punto de partida = centro del rango del fabricante', () => {
    expect(presetBase(LEBURRY_38)).toEqual({ v60: 15, aeropress: 11, espresso: 3 })
    expect(LEBURRY_38.ranges.aeropress.status).toBe('inferido')
  })
  it('un paso = 2 posiciones y se acota al rango del molino', () => {
    expect(grindFor('v60', -1, LEB)).toBe(13)
    expect(grindFor('v60', 1, LEB)).toBe(17)
    expect(grindFor('espresso', -2, LEB)).toBe(1)
    expect(grindFor('v60', 0, EMPTY_SETUP)).toBeNull()
  })
  it('el descriptor dice hacia dónde se movió', () => {
    expect(gen('v60', 'dulce', null, LEB).params.grind).toEqual({ descriptor: 'media-fina, un poco más fina', clicks: 13 })
    expect(gen('v60', 'cuerpo', null, LEB).params.grind.descriptor).toBe('media-fina, un poco más gruesa')
  })
})

it('recipeIdFor: identidad café + método + objetivo', () => {
  expect(recipeIdFor('c1', 'v60', 'dulce')).toBe('c1:v60:dulce')
  expect(recipeIdFor(null, 'espresso', 'equilibrado')).toBe('sin-cafe:espresso:equilibrado')
})
