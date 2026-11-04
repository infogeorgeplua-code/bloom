/**
 * Molinos conocidos (Setup, product §21). Rangos del fabricante; lo inferido se marca.
 * Fuente LEBURRY: descripción del producto (bloom_decisions.md, "Resueltos 4 nov").
 */
import type { GrinderSetup } from '@/lib/schemas/coffee'
import type { Method } from '@/lib/schemas/recipe-seed'

export interface GrinderPreset {
  id: string
  name: string
  minClicks: number
  maxClicks: number
  clicksPerStep: number
  /** Rango recomendado por método; `inferido` cuando el fabricante no lo da */
  ranges: Record<Method, { min: number; max: number; status: 'observado' | 'inferido' }>
}

export const LEBURRY_38: GrinderPreset = {
  id: 'leburry-38',
  name: 'LEBURRY · 38 posiciones',
  minClicks: 1,
  maxClicks: 38,
  clicksPerStep: 2,
  ranges: {
    espresso: { min: 1, max: 5, status: 'observado' },
    v60: { min: 10, max: 20, status: 'observado' },
    aeropress: { min: 8, max: 14, status: 'inferido' },
  },
}

export const GRINDER_PRESETS: GrinderPreset[] = [LEBURRY_38]

/** Punto de partida: centro del rango del método, redondeado */
export function presetBase(p: GrinderPreset): Record<Method, number> {
  const mid = (m: Method) => Math.round((p.ranges[m].min + p.ranges[m].max) / 2)
  return { v60: mid('v60'), aeropress: mid('aeropress'), espresso: mid('espresso') }
}

export function setupFromPreset(p: GrinderPreset): GrinderSetup {
  return {
    presetId: p.id,
    name: p.name,
    minClicks: p.minClicks,
    maxClicks: p.maxClicks,
    clicksPerStep: p.clicksPerStep,
    base: presetBase(p),
  }
}

export const presetById = (id: string | null) => GRINDER_PRESETS.find((p) => p.id === id) ?? null
