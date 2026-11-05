import Dexie, { type Table } from 'dexie'
import type { Method, RecipeVersion } from '@/lib/schemas/recipe-seed'
import type { BagRecord, CoffeeRecord, StockAdjustmentRecord } from '@/lib/schemas/coffee'
import { SEED_VERSION, seedRecipes } from '@/lib/recipes'

/** Brew en curso (SDD §3.4). Solo anclas: el tiempo se deriva, nunca se acumula. */
export interface ActiveBrewRecord {
  id: 'current'
  schemaVersion: 1
  versionId: string
  status: 'prep' | 'countdown' | 'running' | 'paused'
  prepIndex: number
  countdownStartedAtEpochMs: number | null
  t0EpochMs: number | null
  pausedAtEpochMs: number | null
  totalPausedMs: number
  warnedStepIds: string[]
  /** Latido: se reescribe cada 1 s (D-08) */
  updatedAtEpochMs: number
}

/** Brew terminado (SDD §3.2). Se guarda al tocar "Terminar brew"; la calificación llega en la fase 4. */
export interface BrewSessionRecord {
  id: string
  versionId: string
  method: Method
  coffeeId: string | null
  bagId: string | null
  startedAtEpochMs: number
  finishedAtEpochMs: number
  gramsUsed: number
  durationS: number
  outcome: 'completed' | 'abandoned'
  rating: 1 | 2 | 3 | 4 | 5 | null
  symptoms: string[]
  notes: string | null
  syncState: 'local' | 'synced'
}

export interface SyncOpRecord {
  seq?: number
  op: unknown
  createdAtEpochMs: number
  attempts: number
}

export type RecipeVersionRecord = RecipeVersion & { createdAtEpochMs: number }

export class BloomDB extends Dexie {
  recipes!: Table<RecipeVersionRecord, string>
  activeBrew!: Table<ActiveBrewRecord, string>
  brewSessions!: Table<BrewSessionRecord, string>
  syncQueue!: Table<SyncOpRecord, number>
  meta!: Table<{ key: string; value: unknown }, string>
  coffees!: Table<CoffeeRecord, string>
  bags!: Table<BagRecord, string>
  stockAdjustments!: Table<StockAdjustmentRecord, string>

  constructor(name = 'bloom') {
    super(name)
    this.version(1).stores({
      recipes: 'id, recipeId, method, source',
      activeBrew: 'id',
      brewSessions: 'id, versionId, finishedAtEpochMs, syncState',
      syncQueue: '++seq, createdAtEpochMs',
      meta: 'key',
    })
    // v2 (fase 3, P-25): cafés, bolsas y ajustes de stock locales. Solo agrega stores e índices:
    // las filas de v1 (recetas, brews, brew en curso) se conservan tal cual.
    this.version(2).stores({
      recipes: 'id, recipeId, method, source, coffeeId',
      brewSessions: 'id, versionId, finishedAtEpochMs, syncState, coffeeId, bagId',
      coffees: 'id, createdAtEpochMs',
      bags: 'id, coffeeId, status',
      stockAdjustments: 'id, bagId',
    })
  }
}

let instance: BloomDB | null = null

/** Una sola conexión por pestaña; solo en el navegador. */
export function getDb(): BloomDB {
  instance ??= new BloomDB()
  return instance
}

/**
 * Carga idempotente del seed (SDD §3.2): si cambió la versión, reescribe las recetas seed
 * sin tocar recetas del motor o del usuario ni los brews.
 */
export async function ensureSeed(db: BloomDB, nowEpochMs: number): Promise<void> {
  const current = await db.meta.get('seedVersion')
  if (current?.value === SEED_VERSION) return
  await db.transaction('rw', db.recipes, db.meta, async () => {
    // Fase 4: conserva lo que es tuyo de una receta base (bloqueo/revertida y fecha de alta)
    const existing = new Map((await db.recipes.bulkGet(seedRecipes().map((r) => r.id))).filter(Boolean).map((r) => [r!.id, r!]))
    await db.recipes.bulkPut(
      seedRecipes().map((r) => {
        const old = existing.get(r.id)
        return old
          ? { ...r, status: old.status, lockedAtEpochMs: old.lockedAtEpochMs ?? null, createdAtEpochMs: old.createdAtEpochMs }
          : { ...r, createdAtEpochMs: nowEpochMs }
      }),
    )
    await db.meta.put({ key: 'seedVersion', value: SEED_VERSION })
    await db.meta.put({ key: 'schemaVersion', value: 2 })
  })
}

/** Preferencias del Brew Mode guardadas en `meta` */
export async function getHapticsEnabled(db: BloomDB): Promise<boolean> {
  const row = await db.meta.get('haptics')
  return row?.value !== false
}

export async function setHapticsEnabled(db: BloomDB, enabled: boolean): Promise<void> {
  await db.meta.put({ key: 'haptics', value: enabled })
}
