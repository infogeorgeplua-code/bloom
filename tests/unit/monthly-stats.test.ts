import { describe, expect, it } from 'vitest'
import { formatShare, monthlyStats, startOfMonth } from '@/features/home/monthly-stats'

const now = new Date(2026, 10, 3, 12, 0).getTime() // 3 nov 2026
const day = (d: number) => new Date(2026, 10, d, 9, 0).getTime()
const s = (method: 'v60' | 'aeropress' | 'espresso', d: number, outcome: 'completed' | 'abandoned' = 'completed') => ({
  method,
  finishedAtEpochMs: day(d),
  outcome,
})

describe('monthly-stats', () => {
  it('mes vacío', () => {
    expect(monthlyStats([], now)).toMatchObject({ totalBrews: 0, byMethod: [], topMethods: [] })
  })

  it('cuenta solo el mes en curso y solo brews completados', () => {
    const lastMonth = { method: 'v60' as const, finishedAtEpochMs: new Date(2026, 9, 31, 22).getTime(), outcome: 'completed' as const }
    const r = monthlyStats([s('v60', 1), s('v60', 2), s('aeropress', 2, 'abandoned'), lastMonth], now)
    expect(r.totalBrews).toBe(2)
    expect(r.byMethod).toEqual([{ method: 'v60', brews: 2, share: 1 }])
  })

  it('ordena de más a menos usado; los 2 primeros van a los tiles', () => {
    const sessions = [s('v60', 1), s('v60', 1), s('v60', 2), s('aeropress', 2), s('espresso', 3)]
    const r = monthlyStats(sessions, now)
    expect(r.topMethods.map((m) => m.method)).toEqual(['v60', 'aeropress'])
    expect(formatShare(r.topMethods[0]!.share)).toBe('60% del mes')
  })

  it('empate: orden fijo V60, AeroPress, Espresso', () => {
    const r = monthlyStats([s('espresso', 1), s('aeropress', 1), s('v60', 1)], now)
    expect(r.byMethod.map((m) => m.method)).toEqual(['v60', 'aeropress', 'espresso'])
  })

  it('startOfMonth es el día 1 a las 00:00 locales', () => {
    expect(new Date(startOfMonth(now)).getDate()).toBe(1)
    expect(new Date(startOfMonth(now)).getHours()).toBe(0)
  })
})
