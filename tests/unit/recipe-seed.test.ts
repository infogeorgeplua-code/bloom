import { describe, expect, it } from 'vitest'
import seedJson from '@/data/recipes.seed.json'
import { SEED, seedRecipe } from '@/lib/recipes'
import { RecipeParams, RecipeSeedFile } from '@/lib/schemas/recipe-seed'

describe('recipes.seed.json', () => {
  it('valida con Zod y trae las 3 recetas de product §9', () => {
    expect(() => RecipeSeedFile.parse(seedJson)).not.toThrow()
    expect(SEED.recipes.map((r) => r.method)).toEqual(['v60', 'aeropress', 'espresso'])
  })

  it('V60: 15 g / 240 g / 92 °C, 2:40–3:00 y ventanas de product §9 (P-20)', () => {
    const p = seedRecipe('v60-base-v1')!.params
    expect([p.doseG, p.waterG, p.tempC, p.totalMinS, p.totalMaxS]).toEqual([15, 240, 92, 160, 180])
    expect(p.grind).toEqual({ descriptor: 'media-fina', clicks: 18 })
    const timed = p.steps.filter((s) => s.type !== 'prep').map((s) => [s.name, s.targetG, s.startS, s.endS])
    expect(timed).toEqual([
      ['Bloom', 45, 0, 40],
      ['Primer vertido', 140, 45, 70],
      ['Segundo vertido', 200, 90, 110],
      ['Vertido final', 240, 130, 150],
      ['Decantación', null, 150, 180],
    ])
    expect(p.steps[0]!.type).toBe('prep')
  })

  it('AeroPress: 15 g / 200 g / 88 °C, 2:00–2:20', () => {
    const p = seedRecipe('aeropress-base-v1')!.params
    expect([p.doseG, p.waterG, p.tempC, p.totalMinS, p.totalMaxS]).toEqual([15, 200, 88, 120, 140])
    expect(p.steps.filter((s) => s.type !== 'prep').map((s) => [s.targetG, s.startS, s.endS])).toEqual([
      [30, 0, 20],
      [200, 30, 50],
      [null, 50, 90],
      [null, 90, 120],
    ])
  })

  it('Espresso: 18 g / 36 g / 93 °C, 27–32 s, dos prep y aviso de calibración', () => {
    const p = seedRecipe('espresso-base-v1')!.params
    expect([p.doseG, p.waterG, p.tempC, p.totalMinS, p.totalMaxS]).toEqual([18, 36, 93, 27, 32])
    expect(p.steps.filter((s) => s.type === 'prep')).toHaveLength(2)
    expect(p.warnings[0]).toMatch(/calibración/)
    expect(p.steps.find((s) => s.id === 'esp-pre')!.optional).toBe(true)
  })

  it('todos los pasos con tiempo tienen propósito (P-13 resuelto) y nunca "gr" ni "vertir"', () => {
    for (const r of SEED.recipes) {
      for (const s of r.params.steps.filter((x) => x.type !== 'prep')) expect(s.purpose, s.id).toBeTruthy()
      const text = JSON.stringify(r)
      expect(text).not.toMatch(/\bgr\b|vertir|Blooming/)
    }
  })

  it('rechaza ventanas solapadas, metas que bajan y prep después de un paso con tiempo', () => {
    const base = structuredClone(seedRecipe('v60-base-v1')!.params)
    const overlap = structuredClone(base)
    overlap.steps[2]!.startS = 30
    expect(RecipeParams.safeParse(overlap).success).toBe(false)
    const down = structuredClone(base)
    down.steps[3]!.targetG = 100
    expect(RecipeParams.safeParse(down).success).toBe(false)
    const prepLate = structuredClone(base)
    prepLate.steps.push({ ...base.steps[0]!, id: 'late' })
    expect(RecipeParams.safeParse(prepLate).success).toBe(false)
  })
})
