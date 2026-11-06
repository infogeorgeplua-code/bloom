/**
 * Conversión entre las filas de IndexedDB (camelCase, epoch ms) y las de Postgres (snake_case,
 * ISO). Pura: sin I/O. `updatedAt` = cuándo cambió la fila en el teléfono (gana el más reciente).
 */
import type { BagRecord, CoffeeRecord, SetupRecord, StockAdjustmentRecord } from '@/lib/schemas/coffee'
import type { BrewSessionRecord, RecipeVersionRecord } from '@/lib/offline-db'
import type { z } from 'zod'
import type { BagRow, BrewSessionRow, CoffeeRow, ProfileRow, RecipeVersionRow, StockAdjustmentRow } from './schema'

const iso = (ms: number) => new Date(ms).toISOString()
const ms = (s: string) => Date.parse(s)

type Row<T extends z.ZodType> = z.infer<T>

export function profileToRow(setup: SetupRecord, haptics: boolean, updatedAtMs: number): Row<typeof ProfileRow> {
  return { setup, haptics, updated_at: iso(updatedAtMs) }
}

export function coffeeToRow(c: CoffeeRecord, updatedAtMs: number): Row<typeof CoffeeRow> {
  return {
    id: c.id,
    name: c.name,
    roaster: c.roaster,
    origin_country: c.originCountry,
    variety: c.variety,
    process: c.process,
    roast_level: c.roastLevel,
    roast_date: c.roastDateISO,
    altitude_m: c.altitudeM,
    archived: c.archived,
    created_at: iso(c.createdAtEpochMs),
    updated_at: iso(updatedAtMs),
  }
}

export function coffeeFromRow(r: Row<typeof CoffeeRow>): CoffeeRecord {
  return {
    id: r.id,
    name: r.name,
    roaster: r.roaster,
    originCountry: r.origin_country,
    variety: r.variety,
    process: r.process,
    roastLevel: r.roast_level,
    roastDateISO: r.roast_date,
    altitudeM: r.altitude_m,
    archived: r.archived,
    createdAtEpochMs: ms(r.created_at),
  }
}

export function bagToRow(b: BagRecord, updatedAtMs: number): Row<typeof BagRow> {
  return {
    id: b.id,
    coffee_id: b.coffeeId,
    number: b.number,
    initial_g: b.initialG,
    opened_at: iso(b.openedAtEpochMs),
    status: b.status,
    finished_at: b.finishedAtEpochMs === null ? null : iso(b.finishedAtEpochMs),
    updated_at: iso(updatedAtMs),
  }
}

export function bagFromRow(r: Row<typeof BagRow>): BagRecord {
  return {
    id: r.id,
    coffeeId: r.coffee_id,
    number: r.number,
    initialG: Number(r.initial_g),
    openedAtEpochMs: ms(r.opened_at),
    status: r.status,
    finishedAtEpochMs: r.finished_at === null ? null : ms(r.finished_at),
  }
}

export function adjustmentToRow(a: StockAdjustmentRecord, updatedAtMs: number): Row<typeof StockAdjustmentRow> {
  return { id: a.id, bag_id: a.bagId, delta_g: a.deltaG, reason: a.reason, created_at: iso(a.createdAtEpochMs), updated_at: iso(updatedAtMs) }
}

export function adjustmentFromRow(r: Row<typeof StockAdjustmentRow>): StockAdjustmentRecord {
  return { id: r.id, bagId: r.bag_id, deltaG: Number(r.delta_g), createdAtEpochMs: ms(r.created_at), reason: 'manual' }
}

export function versionToRow(v: RecipeVersionRecord, updatedAtMs: number): Row<typeof RecipeVersionRow> {
  return {
    id: v.id,
    recipe_id: v.recipeId,
    number: v.number,
    parent_version_id: v.parentVersionId,
    status: v.status,
    method: v.method,
    objective: v.objective,
    coffee_id: v.coffeeId,
    source: v.source,
    seed_version: v.seedVersion,
    name: v.name,
    params: v.params as unknown as Record<string, unknown>,
    traceability: v.traceability as unknown as Record<string, unknown>,
    engine_version: v.engineVersion ?? null,
    adjust_meta: (v.adjustMeta ?? null) as Record<string, unknown> | null,
    locked_at: v.lockedAtEpochMs ? iso(v.lockedAtEpochMs) : null,
    created_at: iso(v.createdAtEpochMs),
    updated_at: iso(updatedAtMs),
  }
}

/** Sin validar: quien llama valida con RecipeVersion de recipe-seed antes de guardar */
export function versionFromRow(r: Row<typeof RecipeVersionRow>): RecipeVersionRecord {
  return {
    id: r.id,
    recipeId: r.recipe_id,
    number: r.number,
    parentVersionId: r.parent_version_id,
    status: r.status,
    method: r.method,
    objective: r.objective,
    coffeeId: r.coffee_id,
    source: r.source,
    seedVersion: r.seed_version,
    name: r.name,
    params: r.params as unknown as RecipeVersionRecord['params'],
    traceability: r.traceability as unknown as RecipeVersionRecord['traceability'],
    engineVersion: r.engine_version,
    adjustMeta: r.adjust_meta as unknown as RecipeVersionRecord['adjustMeta'],
    lockedAtEpochMs: r.locked_at ? ms(r.locked_at) : null,
    createdAtEpochMs: ms(r.created_at),
  }
}

export function brewToRow(b: BrewSessionRecord, updatedAtMs: number): Row<typeof BrewSessionRow> {
  return {
    id: b.id,
    version_id: b.versionId,
    method: b.method,
    coffee_id: b.coffeeId,
    bag_id: b.bagId,
    started_at: iso(b.startedAtEpochMs),
    finished_at: iso(b.finishedAtEpochMs),
    grams_used: b.gramsUsed,
    duration_s: b.durationS,
    outcome: b.outcome,
    rating: b.rating,
    symptoms: b.symptoms,
    notes: b.notes,
    updated_at: iso(updatedAtMs),
  }
}

export function brewFromRow(r: Row<typeof BrewSessionRow>): BrewSessionRecord {
  return {
    id: r.id,
    versionId: r.version_id,
    method: r.method,
    coffeeId: r.coffee_id,
    bagId: r.bag_id,
    startedAtEpochMs: ms(r.started_at),
    finishedAtEpochMs: ms(r.finished_at),
    gramsUsed: Number(r.grams_used),
    durationS: r.duration_s,
    outcome: r.outcome,
    rating: r.rating as BrewSessionRecord['rating'],
    symptoms: r.symptoms,
    notes: r.notes,
    syncState: 'synced',
  }
}
