/**
 * Stock por bolsa (SDD §5.5, D-09, product §13). Lógica pura: los gramos se derivan,
 * nunca se guardan (gramos = inicial − Σ brews + Σ ajustes).
 */
import { formatNumber } from '@/lib/format'

export type StockLevel = 'ok' | 'low' | 'critical' | 'depleted'
export const DEFAULT_DOSE_G = 15
export const LOW_STOCK_G = 50
/** Segmentos del StockMeter (DS §3.16) */
export const METER_SEGMENTS = 10

export interface StockStatus {
  level: StockLevel
  grams: number
  preparations: number
  doseG: number
  message: string
  action: 'mark_finished' | null
}

/** D-09: las reglas se evalúan en orden; gana la primera que cumple. */
export function stockStatus(grams: number, activeDoseG: number | null): StockStatus {
  const doseG = activeDoseG && activeDoseG > 0 ? activeDoseG : DEFAULT_DOSE_G
  const g = Math.max(0, grams)
  const preparations = Math.floor(g / doseG)
  const base = { grams: g, preparations, doseG }
  if (g < doseG) {
    return { ...base, level: 'depleted', message: 'No alcanza para otra taza. ¿Lo marcamos como terminado?', action: 'mark_finished' }
  }
  if (g < 2 * doseG) return { ...base, level: 'critical', message: 'Alcanza para 1 preparación más', action: null }
  if (g < LOW_STOCK_G) return { ...base, level: 'low', message: `Te queda poco: ~${preparations} preparaciones`, action: null }
  return { ...base, level: 'ok', message: `${formatNumber(g)} g · ~${preparations} preparaciones`, action: null }
}

export function currentGrams(initialG: number, brewGramsUsed: number[], adjustmentsG: number[]): number {
  const used = brewGramsUsed.reduce((a, b) => a + b, 0)
  const adjusted = adjustmentsG.reduce((a, b) => a + b, 0)
  return Math.max(0, initialG - used + adjusted)
}

/** Segmentos llenos 0–10; un resto > 0 siempre muestra al menos 1 segmento */
export function meterFill(grams: number, initialG: number): number {
  if (initialG <= 0 || grams <= 0) return 0
  const ratio = Math.min(1, grams / initialG)
  return Math.max(1, Math.round(ratio * METER_SEGMENTS))
}

/** Stock bajo para ListRow / Home: cualquier nivel distinto de ok */
export const isLow = (level: StockLevel) => level !== 'ok'
