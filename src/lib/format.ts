/**
 * Formato de números y unidades (DS §7). Todo número de la UI pasa por aquí.
 * El separador entre número y unidad es un espacio de no separación (U+00A0)
 * para que "15 g" nunca se parta en dos líneas.
 */
const NBSP = ' '

/** 15 → "15", 15.5 → "15,5", 92.25 → "92,25". Coma decimal, sin ceros finales. */
export function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return String(rounded).replace('.', ',')
}

export const formatGrams = (g: number): string => `${formatNumber(g)}${NBSP}g`

export const formatTemp = (c: number): string => `${formatNumber(c)}${NBSP}°C`

/** formatRatio(240, 15) → "1:16". Un decimal como máximo: 200/15 → "1:13,3". */
export function formatRatio(water: number, dose: number): string {
  const ratio = Math.round((water / dose) * 10) / 10
  return `1:${formatNumber(ratio)}`
}

/** 160 → "2:40" (m:ss). */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** formatRange(160, 180) → "2:40 – 3:00". */
export const formatRange = (fromS: number, toS: number): string =>
  `${formatDuration(fromS)} – ${formatDuration(toS)}`

export const formatClicks = (n: number): string =>
  `${formatNumber(n)}${NBSP}${n === 1 ? 'click' : 'clicks'}`

export const formatDays = (n: number): string => `${n}${NBSP}${n === 1 ? 'día' : 'días'}`
