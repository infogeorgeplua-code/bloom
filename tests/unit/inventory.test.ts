import { describe, expect, it } from 'vitest'
import { currentGrams, meterFill, stockStatus } from '@/features/inventory/inventory'

describe('stockStatus (D-09, SDD §5.5)', () => {
  it.each([
    [145, null, 'ok', 9],
    [50, 15, 'ok', 3],
    [49, 15, 'low', 3],
    [30, 15, 'low', 2],
    [29, 15, 'critical', 1],
    [15, 15, 'critical', 1],
    [14, 15, 'depleted', 0],
    [0, 15, 'depleted', 0],
    [55, 30, 'critical', 1],
    [-5, 15, 'depleted', 0],
  ] as const)('%i g con dosis %s → %s (%i preparaciones)', (g, dose, level, preps) => {
    const s = stockStatus(g, dose)
    expect(s.level).toBe(level)
    expect(s.preparations).toBe(preps)
  })

  it('mensajes de D-09', () => {
    expect(stockStatus(145, 15).message).toBe('145 g · ~9 preparaciones')
    expect(stockStatus(42, 15).message).toBe('Te queda poco: ~2 preparaciones')
    expect(stockStatus(20, 15).message).toBe('Alcanza para 1 preparación más')
    expect(stockStatus(10, 15)).toMatchObject({ message: 'No alcanza para otra taza. ¿Lo marcamos como terminado?', action: 'mark_finished' })
  })

  it('sin receta activa la dosis es 15 g', () => {
    expect(stockStatus(100, null).doseG).toBe(15)
    expect(stockStatus(100, 0).doseG).toBe(15)
  })
})

describe('currentGrams', () => {
  it('inicial − brews + ajustes, nunca negativo', () => {
    expect(currentGrams(250, [15, 15, 15], [])).toBe(205)
    expect(currentGrams(250, [15], [-20, 5])).toBe(220)
    expect(currentGrams(20, [15, 15], [])).toBe(0)
  })
})

describe('meterFill', () => {
  it.each([
    [250, 250, 10],
    [125, 250, 5],
    [5, 250, 1],
    [0, 250, 0],
    [300, 250, 10],
    [10, 0, 0],
  ])('%i de %i g → %i segmentos', (g, initial, fill) => {
    expect(meterFill(g, initial)).toBe(fill)
  })
})
