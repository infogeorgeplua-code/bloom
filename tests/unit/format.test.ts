import { describe, expect, it } from 'vitest'
import {
  formatClicks,
  formatDays,
  formatDuration,
  formatGrams,
  formatNumber,
  formatRange,
  formatRatio,
  formatTemp,
} from '@/lib/format'

// Los separadores entre número y unidad son espacios de no separación (U+00A0)
const nb = (s: string) => s.replace(/ /g, ' ')

describe('format (DS §7)', () => {
  it('gramos: sin punto, coma decimal solo si hace falta', () => {
    expect(formatGrams(15)).toBe(nb('15 g'))
    expect(formatGrams(15.5)).toBe(nb('15,5 g'))
    expect(formatGrams(240)).toBe(nb('240 g'))
  })

  it('temperatura: admite medios grados', () => {
    expect(formatTemp(92)).toBe(nb('92 °C'))
    expect(formatTemp(92.5)).toBe(nb('92,5 °C'))
  })

  it('ratio: 1:N con un decimal como máximo', () => {
    expect(formatRatio(240, 15)).toBe('1:16')
    expect(formatRatio(36, 18)).toBe('1:2')
    expect(formatRatio(200, 15)).toBe('1:13,3')
  })

  it('tiempo: m:ss y rangos con guion medio', () => {
    expect(formatDuration(160)).toBe('2:40')
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatRange(160, 180)).toBe('2:40 – 3:00')
  })

  it('clicks: singular y plural, medios clicks', () => {
    expect(formatClicks(18)).toBe(nb('18 clicks'))
    expect(formatClicks(1)).toBe(nb('1 click'))
    expect(formatClicks(17.5)).toBe(nb('17,5 clicks'))
  })

  it('formatNumber quita ceros finales', () => {
    expect(formatNumber(2)).toBe('2')
    expect(formatNumber(2.1)).toBe('2,1')
  })

  it('días: singular y plural', () => {
    expect(formatDays(1)).toBe(nb('1 día'))
    expect(formatDays(12)).toBe(nb('12 días'))
  })
})
