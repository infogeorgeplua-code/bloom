import { describe, expect, it } from 'vitest'
import {
  ENGINE_VERSION,
  OBJECTIVE_RULES,
  PREFERENCE_TO_OBJECTIVE,
  PRIORITY_TEXT,
  PRIORITY_TEXT_NO_CHANGE,
  ROAST_TEMP_ADJUST,
  SOURCES,
  TEMP_LIMITS_BY_METHOD,
  clampTempC,
  localBoilingPointC,
  ruleFor,
  type TechnicalObjective,
} from '@/features/recipes/engine-tables'
import { LEBURRY_38, presetBase, setupFromPreset } from '@/features/recipes/grinders'
import {
  baseRecipe,
  generateRecipe,
  grindFor,
  recipeIdFor,
  resolveObjective,
  roastWindow,
  roundWater,
  type EngineCoffee,
} from '@/features/recipes/recipe-engine'
import { EMPTY_SETUP, type RoastLevel, type SetupRecord } from '@/lib/schemas/coffee'
import { RecipeParams, type Method } from '@/lib/schemas/recipe-seed'

const METHODS: Method[] = ['v60', 'aeropress', 'espresso']
const TODAY = '2026-11-04'
const LEB: SetupRecord = { grinder: setupFromPreset(LEBURRY_38), brewAltitudeM: null }
const coffee = (c: Partial<EngineCoffee> = {}): EngineCoffee => ({
  id: 'c1', roastLevel: null, process: null, altitudeM: null, roastDateISO: null, ...c,
})

/** Para probar un objetivo técnico, incluido 'intensidad' (solo se alcanza por la preferencia "intenso") */
function gen(method: Method, objective: TechnicalObjective, c: EngineCoffee | null = null, setup = EMPTY_SETUP, enableHypotheses = false) {
  return objective === 'intensidad'
    ? generateRecipe({ method, objective: 'para_alguien_mas', preference: 'intenso', coffee: c, setup, todayISO: TODAY, enableHypotheses })
    : generateRecipe({ method, objective, coffee: c, setup, todayISO: TODAY, enableHypotheses })
}

describe('OBJECTIVE_RULES (P-14.1): cada fila, con hipótesis apagadas y encendidas', () => {
  for (const [objective, byMethod] of Object.entries(OBJECTIVE_RULES) as [TechnicalObjective, (typeof OBJECTIVE_RULES)['dulce']][]) {
    for (const method of METHODS) {
      const rule = byMethod[method]
      for (const on of [false, true]) {
        it(`${objective} · ${method} · hipótesis ${on ? 'on' : 'off'}`, () => {
          const base = baseRecipe(method).params
          const out = gen(method, objective, null, LEB, on)
          const applies = rule.variable !== null && (rule.evidence !== 'hipotesis' || on)
          // Un objetivo mueve UNA variable (principio 1)
          const objectiveChanges = out.changes.filter((c) => c.label.startsWith('Objetivo'))
          expect(objectiveChanges.length).toBe(applies ? 1 : 0)
          expect(out.params.tempC).toBe(applies && rule.variable === 'tempC' ? base.tempC + rule.delta : base.tempC)
          expect(out.params.waterG).toBe(
            applies && rule.variable === 'ratioPct' ? roundWater(method, base.waterG * (1 + rule.delta / 100)) : base.waterG,
          )
          // Nada más se mueve: dosis, molienda, bloom ni técnica
          expect(out.params.doseG).toBe(base.doseG)
          expect(out.params.grind.clicks).toBe(grindFor(method, 0, LEB))
          expect(out.params.steps.map((s) => [s.startS, s.endS, s.technique])).toEqual(base.steps.map((s) => [s.startS, s.endS, s.technique]))
          expect(out.objectiveEvidence).toBe(applies ? rule.evidence : null)
          if (objective !== 'equilibrado') {
            const prefix = objective === 'intensidad' ? 'Para alguien más. ' : ''
            expect(out.priority).toBe(prefix + (applies ? PRIORITY_TEXT[objective] : PRIORITY_TEXT_NO_CHANGE))
          }
          expect(() => RecipeParams.parse(out.params)).not.toThrow()
          // Cada fuente citada existe
          for (const s of rule.sources) expect(SOURCES[s].url).toMatch(/^https:\/\//)
        })
      }
    }
  }

  it('ruleFor apaga las hipótesis por defecto', () => {
    expect(ruleFor('brillante', 'v60').variable).toBeNull()
    expect(ruleFor('brillante', 'v60', true)).toMatchObject({ variable: 'tempC', delta: -1 })
  })

  it('valores de referencia: dulce V60 254 g, intensidad V60 226 g, cuerpo e intensidad espresso 32,4 g', () => {
    expect(gen('v60', 'dulce').params.waterG).toBe(254)
    expect(gen('aeropress', 'dulce').params.waterG).toBe(212)
    expect(gen('v60', 'intensidad').params.waterG).toBe(226)
    expect(gen('espresso', 'cuerpo').params.waterG).toBe(32.4)
    expect(gen('espresso', 'intensidad').params.waterG).toBe(32.4)
    expect(gen('espresso', 'claridad').params.waterG).toBe(36)
    expect(gen('espresso', 'claridad', null, EMPTY_SETUP, true).params.waterG).toBe(39.6)
  })

  it('las metas acumuladas se reescalan y la última es el agua total', () => {
    const targets = gen('v60', 'dulce').params.steps.map((s) => s.targetG).filter((t): t is number => t !== null)
    expect(targets).toEqual([48, 148, 212, 254])
    const esp = gen('espresso', 'intensidad').params.steps.map((s) => s.targetG).filter((t): t is number => t !== null)
    expect(esp.at(-1)).toBe(32.4)
  })

  it('equilibrado sin café ni molino = receta base (sin clicks inventados)', () => {
    const out = gen('v60', 'equilibrado')
    const base = baseRecipe('v60').params
    expect(out.params).toMatchObject({ tempC: base.tempC, waterG: base.waterG, grind: { descriptor: base.grind.descriptor, clicks: null } })
    expect(out.changes).toEqual([])
    expect(out.priority).toBe('Partimos de la receta base.')
    expect(out.engineVersion).toBe(ENGINE_VERSION)
  })
})

describe('PREFERENCE_TO_OBJECTIVE (P-14.1): cada fila', () => {
  for (const [pref, obj] of Object.entries(PREFERENCE_TO_OBJECTIVE)) {
    it(`${pref} → ${obj}`, () => {
      expect(resolveObjective('para_alguien_mas', pref as keyof typeof PREFERENCE_TO_OBJECTIVE)).toBe(obj)
      const out = generateRecipe({ method: 'v60', objective: 'para_alguien_mas', preference: pref as never, coffee: null, setup: EMPTY_SETUP, todayISO: TODAY })
      expect(out.technicalObjective).toBe(obj)
      expect(out.priority.startsWith('Para alguien más.')).toBe(true)
    })
  }
  it('sin preferencia: equilibrado (default de SDD §5.3)', () => {
    expect(resolveObjective('para_alguien_mas', null)).toBe('equilibrado')
  })
  it('los demás objetivos pasan tal cual', () => {
    expect(resolveObjective('brillante', 'floral')).toBe('brillante')
  })
})

describe('ROAST_TEMP_ADJUST: cada fila (heurística)', () => {
  for (const [level, d] of Object.entries(ROAST_TEMP_ADJUST) as [RoastLevel, number][]) {
    it(`${level}: ${d} °C`, () => {
      const out = gen('v60', 'equilibrado', coffee({ roastLevel: level }))
      expect(out.params.tempC).toBe(92 + d)
      expect(out.changes.filter((c) => c.variable === 'tempC').map((c) => c.evidence)).toEqual(d ? ['heuristica'] : [])
    })
  }
  it('proceso y altitud del cultivo ya no mueven la temperatura (P-14.1 principio 5)', () => {
    const out = gen('aeropress', 'equilibrado', coffee({ process: 'natural', altitudeM: 900 }))
    expect(out.params.tempC).toBe(88)
    expect(out.changes).toEqual([])
  })
})

describe('Ventana de tueste (orientativa)', () => {
  it.each([
    ['v60', '2026-10-29', 6, 'reposo'],
    ['v60', '2026-10-28', 7, 'en_ventana'],
    ['aeropress', '2026-10-14', 21, 'en_ventana'],
    ['v60', '2026-10-13', 22, 'fuera_de_ventana'],
    ['espresso', '2026-10-22', 13, 'reposo'],
    ['espresso', '2026-10-21', 14, 'en_ventana'],
    ['espresso', '2026-10-05', 30, 'en_ventana'],
    ['espresso', '2026-10-04', 31, 'fuera_de_ventana'],
  ] as const)('%s tostado el %s → %i d, %s', (method, date, days, state) => {
    expect(roastWindow(date, TODAY, method)).toEqual({ days, state })
  })
  it('solo avisa: no mueve números', () => {
    const fresh = gen('v60', 'equilibrado', coffee({ roastDateISO: '2026-11-02' }))
    expect(fresh.params.tempC).toBe(92)
    expect(fresh.params.warnings.some((w) => w.includes('muy fresco'))).toBe(true)
    expect(gen('v60', 'equilibrado', coffee({ roastDateISO: '2026-09-01' })).params.warnings.some((w) => w.includes('orientativa'))).toBe(true)
  })
})

describe('Temperatura: límites por método y ebullición local (P-14.1)', () => {
  it.each([
    [0, 100],
    [1500, 95],
    [2560, 91.5],
    [2850, 90.5],
    [4000, 86.7],
  ])('%i m → hierve a ~%s °C', (alt, t) => {
    expect(localBoilingPointC(alt)).toBe(t)
  })
  it('sin altitud no se infiere', () => {
    expect(localBoilingPointC(null)).toBeNull()
    expect(localBoilingPointC(undefined)).toBeNull()
  })
  it.each([
    ['v60', 92, 2850, 90.5, 'ebullicion'],
    ['aeropress', 88, 2850, 88, null],
    ['espresso', 93, 2850, 93, null], // caldera presurizada: sin techo de ebullición
    ['v60', 98, null, 96, 'metodo_max'],
    ['v60', 80, null, 85, 'metodo_min'],
    ['aeropress', 79, null, 80, 'metodo_min'],
    ['espresso', 87, null, 88, 'metodo_min'],
  ] as const)('%s %s °C a %s m → %s °C (%s)', (method, target, alt, tempC, cappedBy) => {
    const r = clampTempC(target, method, alt)
    expect(r).toMatchObject({ tempC, cappedBy })
    expect(r.warning !== null).toBe(cappedBy === 'ebullicion')
  })
  it('cada método tiene límites razonables', () => {
    for (const m of METHODS) expect(TEMP_LIMITS_BY_METHOD[m][0]).toBeLessThan(TEMP_LIMITS_BY_METHOD[m][1])
  })
  it('en Quito el V60 base queda en 90,5 °C con aviso', () => {
    const out = gen('v60', 'equilibrado', null, { grinder: null, brewAltitudeM: 2850 })
    expect(out.params.tempC).toBe(90.5)
    expect(out.params.warnings.some((w) => w.includes('hierve'))).toBe(true)
    expect(out.changes.at(-1)?.label).toBe('Tu altitud: tope 90,5 °C')
  })
  it('tueste claro + Cuenca: pide 93 °C y se queda en 91,5 °C', () => {
    expect(gen('v60', 'equilibrado', coffee({ roastLevel: 'claro' }), { grinder: null, brewAltitudeM: 2560 }).params.tempC).toBe(91.5)
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
  it('ningún objetivo mueve la molienda (P-14.1)', () => {
    for (const o of Object.keys(OBJECTIVE_RULES) as TechnicalObjective[]) {
      expect(gen('v60', o, null, LEB, true).params.grind).toEqual({ descriptor: 'media-fina', clicks: 15 })
    }
  })
})

it('recipeIdFor: identidad café + método + objetivo', () => {
  expect(recipeIdFor('c1', 'v60', 'dulce')).toBe('c1:v60:dulce')
  expect(recipeIdFor(null, 'espresso', 'equilibrado')).toBe('sin-cafe:espresso:equilibrado')
})
