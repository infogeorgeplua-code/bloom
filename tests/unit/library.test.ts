import { describe, expect, it } from 'vitest'
import { pickHabitual, recentCoffees, stockTotals, summarize } from '@/features/inventory/library'
import type { BrewSessionRecord } from '@/lib/offline-db'
import type { BagRecord, CoffeeRecord } from '@/lib/schemas/coffee'

const DAY = 86_400_000
const NOW = 100 * DAY

const coffee = (id: string, createdAt = 0, archived = false): CoffeeRecord => ({
  id, name: id, roaster: null, originCountry: null, variety: null, process: null, roastLevel: null,
  roastDateISO: null, altitudeM: null, createdAtEpochMs: createdAt, archived,
})
const bag = (id: string, coffeeId: string, initialG: number, status: BagRecord['status'] = 'active'): BagRecord => ({
  id, coffeeId, number: 1, initialG, openedAtEpochMs: 0, status, finishedAtEpochMs: null,
})
const brew = (id: string, coffeeId: string, bagId: string, at: number, g = 15): BrewSessionRecord => ({
  id, versionId: `v-${coffeeId}`, method: 'v60', coffeeId, bagId, startedAtEpochMs: at - 1, finishedAtEpochMs: at,
  gramsUsed: g, durationS: 170, outcome: 'completed', rating: null, symptoms: [], notes: null, syncState: 'local',
})

describe('summarize', () => {
  it('descuenta brews de la bolsa activa y suma ajustes', () => {
    const [s] = summarize(
      [coffee('a')],
      [bag('b1', 'a', 250, 'finished'), bag('b2', 'a', 250)],
      [brew('1', 'a', 'b1', NOW - DAY), brew('2', 'a', 'b2', NOW - 2 * DAY), brew('3', 'a', 'b2', NOW - 40 * DAY)],
      [{ id: 'x', bagId: 'b2', deltaG: -10, createdAtEpochMs: 1, reason: 'manual' }],
      NOW,
    )
    expect(s!.grams).toBe(250 - 30 - 10)
    expect(s!.brewCount).toBe(3)
    expect(s!.brewsLast30).toBe(2)
    expect(s!.lastVersionId).toBe('v-a')
    expect(s!.finishedBags).toBe(1)
    expect(s!.stock?.level).toBe('ok')
  })

  it('sin bolsa activa: sin gramos ni alerta', () => {
    const [s] = summarize([coffee('a')], [], [], [], NOW)
    expect(s).toMatchObject({ grams: null, stock: null, fill: 0 })
  })
})

describe('pickHabitual (SDD §5.9)', () => {
  const list = summarize(
    [coffee('mucho', 1), coffee('reciente', 2), coffee('nuevo', 3), coffee('agotado', 4), coffee('archivado', 5, true)],
    [bag('b-m', 'mucho', 500), bag('b-r', 'reciente', 500), bag('b-n', 'nuevo', 250), bag('b-a', 'agotado', 20), bag('b-x', 'archivado', 500)],
    [
      brew('1', 'mucho', 'b-m', NOW - 5 * DAY), brew('2', 'mucho', 'b-m', NOW - 4 * DAY),
      brew('3', 'reciente', 'b-r', NOW - DAY),
      brew('4', 'agotado', 'b-a', NOW), brew('5', 'agotado', 'b-a', NOW), brew('6', 'agotado', 'b-a', NOW),
      brew('7', 'archivado', 'b-x', NOW), brew('8', 'archivado', 'b-x', NOW), brew('9', 'archivado', 'b-x', NOW),
    ],
    [],
    NOW,
  )

  it('el más preparado en 30 días, con stock y no archivado', () => {
    expect(pickHabitual(list)?.coffee.id).toBe('mucho')
  })
  it('empate de brews → el preparado más reciente', () => {
    const tie = list.map((s) => (s.coffee.id === 'reciente' ? { ...s, brewsLast30: 2 } : s))
    expect(pickHabitual(tie)?.coffee.id).toBe('reciente')
  })
  it('sin brews → el agregado más reciente', () => {
    const none = list.map((s) => ({ ...s, brewsLast30: 0, lastBrewAtEpochMs: null }))
    expect(pickHabitual(none)?.coffee.id).toBe('nuevo')
  })
  it('sin cafés en stock → null', () => {
    expect(pickHabitual([])).toBeNull()
  })
  it('recientes y totales del Home', () => {
    expect(recentCoffees(list).map((s) => s.coffee.id)).toEqual(['agotado', 'reciente', 'mucho'])
    const t = stockTotals(list)
    expect(t.coffeesInStock).toBe(3)
    expect(t.grams).toBe(470 + 485 + 250 + 0)
  })
})
