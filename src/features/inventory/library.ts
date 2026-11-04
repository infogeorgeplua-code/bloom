/**
 * Biblioteca de cafés (Stock, Home): resúmenes derivados y "Tu café habitual" (SDD §5.9).
 * Lógica pura; la lectura de IndexedDB vive en lib/library-db.ts.
 */
import type { BagRecord, CoffeeRecord, StockAdjustmentRecord } from '@/lib/schemas/coffee'
import type { BrewSessionRecord } from '@/lib/offline-db'
import type { Method } from '@/lib/schemas/recipe-seed'
import { currentGrams, DEFAULT_DOSE_G, meterFill, stockStatus, type StockStatus } from './inventory'

export interface CoffeeSummary {
  coffee: CoffeeRecord
  activeBag: BagRecord | null
  /** null sin bolsa activa */
  grams: number | null
  stock: StockStatus | null
  fill: number
  brewCount: number
  brewsLast30: number
  lastBrewAtEpochMs: number | null
  lastVersionId: string | null
  lastMethod: Method | null
  /** Dosis de la última receta usada con este café (para las alertas) */
  doseG: number
  finishedBags: number
}

const DAY = 86_400_000

export function summarize(
  coffees: CoffeeRecord[],
  bags: BagRecord[],
  sessions: BrewSessionRecord[],
  adjustments: StockAdjustmentRecord[],
  nowEpochMs: number,
): CoffeeSummary[] {
  return coffees.map((coffee) => {
    const own = sessions
      .filter((s) => s.coffeeId === coffee.id && s.outcome === 'completed')
      .sort((a, b) => a.finishedAtEpochMs - b.finishedAtEpochMs)
    const last = own.at(-1) ?? null
    const doseG = last?.gramsUsed ?? DEFAULT_DOSE_G
    const coffeeBags = bags.filter((b) => b.coffeeId === coffee.id)
    const activeBag = coffeeBags.filter((b) => b.status === 'active').sort((a, b) => b.openedAtEpochMs - a.openedAtEpochMs)[0] ?? null
    let grams: number | null = null
    if (activeBag) {
      grams = currentGrams(
        activeBag.initialG,
        sessions.filter((s) => s.bagId === activeBag.id && s.outcome === 'completed').map((s) => s.gramsUsed),
        adjustments.filter((a) => a.bagId === activeBag.id).map((a) => a.deltaG),
      )
    }
    return {
      coffee,
      activeBag,
      grams,
      stock: grams === null ? null : stockStatus(grams, doseG),
      fill: grams === null || !activeBag ? 0 : meterFill(grams, activeBag.initialG),
      brewCount: own.length,
      brewsLast30: own.filter((s) => s.finishedAtEpochMs >= nowEpochMs - 30 * DAY).length,
      lastBrewAtEpochMs: last?.finishedAtEpochMs ?? null,
      lastVersionId: last?.versionId ?? null,
      lastMethod: last?.method ?? null,
      doseG,
      finishedBags: coffeeBags.filter((b) => b.status === 'finished').length,
    }
  })
}

/** Cafés con bolsa activa y al menos una dosis (los que se pueden preparar hoy) */
export const inStock = (list: CoffeeSummary[]) =>
  list.filter((s) => !s.coffee.archived && s.stock !== null && s.stock.level !== 'depleted')

/**
 * "Tu café habitual" (SDD §5.9): entre los cafés en stock, el que más preparaste en 30 días;
 * empate → el preparado más reciente; sin brews → el agregado más reciente. null si no hay ninguno.
 */
export function pickHabitual(list: CoffeeSummary[]): CoffeeSummary | null {
  const candidates = inStock(list)
  if (!candidates.length) return null
  return [...candidates].sort(
    (a, b) =>
      b.brewsLast30 - a.brewsLast30 ||
      (b.lastBrewAtEpochMs ?? 0) - (a.lastBrewAtEpochMs ?? 0) ||
      b.coffee.createdAtEpochMs - a.coffee.createdAtEpochMs,
  )[0]!
}

/** Cafés recientes del Home: preparados o agregados más recientemente, sin archivados */
export function recentCoffees(list: CoffeeSummary[], limit = 3): CoffeeSummary[] {
  const at = (s: CoffeeSummary) => Math.max(s.lastBrewAtEpochMs ?? 0, s.coffee.createdAtEpochMs)
  return list.filter((s) => !s.coffee.archived && s.activeBag).sort((a, b) => at(b) - at(a)).slice(0, limit)
}

/** Tile Stock del Home: gramos totales de bolsas activas y cuántos cafés tienen stock */
export function stockTotals(list: CoffeeSummary[]) {
  const active = list.filter((s) => !s.coffee.archived && s.activeBag && s.grams !== null)
  const grams = active.reduce((a, s) => a + (s.grams ?? 0), 0)
  const initial = active.reduce((a, s) => a + (s.activeBag?.initialG ?? 0), 0)
  return {
    grams,
    coffeesInStock: inStock(list).length,
    fill: meterFill(grams, initial),
    level: stockStatus(grams, null).level,
  }
}
