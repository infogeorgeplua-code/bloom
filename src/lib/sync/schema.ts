/**
 * Contrato del sync (fase 5, SDD §4): filas tal como viven en Postgres (snake_case, sin user_id:
 * el servidor lo pone desde la sesión). Zod valida en el cliente antes de enviar y en /api/sync.
 */
import { z } from 'zod'

const iso = z.string().datetime({ offset: true })
const id = z.string().min(1).max(100)

export const ProfileRow = z.object({
  setup: z.object({ grinder: z.unknown().nullable(), brewAltitudeM: z.number().nullable() }).passthrough(),
  haptics: z.boolean(),
  updated_at: iso,
})

export const CoffeeRow = z.object({
  id,
  name: z.string().min(1).max(200),
  roaster: z.string().nullable(),
  origin_country: z.string().nullable(),
  variety: z.string().nullable(),
  process: z.enum(['lavado', 'natural', 'honey', 'anaerobico', 'otro']).nullable(),
  roast_level: z.enum(['claro', 'medio', 'medio_oscuro', 'oscuro']).nullable(),
  roast_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  altitude_m: z.number().int().min(0).max(3000).nullable(),
  archived: z.boolean(),
  created_at: iso,
  updated_at: iso,
})

export const BagRow = z.object({
  id,
  coffee_id: id,
  number: z.number().int().positive(),
  initial_g: z.number().positive(),
  opened_at: iso,
  status: z.enum(['active', 'finished']),
  finished_at: iso.nullable(),
  updated_at: iso,
})

export const StockAdjustmentRow = z.object({
  id,
  bag_id: id,
  delta_g: z.number(),
  reason: z.string(),
  created_at: iso,
  updated_at: iso,
})

export const RecipeVersionRow = z.object({
  id,
  recipe_id: id,
  number: z.number().int().positive(),
  parent_version_id: id.nullable(),
  status: z.enum(['active', 'locked', 'reverted']),
  method: z.enum(['v60', 'aeropress', 'espresso']),
  objective: z.string().nullable(),
  coffee_id: id.nullable(),
  source: z.enum(['seed', 'engine', 'user']),
  seed_version: z.string().nullable(),
  name: z.string().min(1),
  params: z.record(z.string(), z.unknown()),
  traceability: z.record(z.string(), z.unknown()),
  engine_version: z.string().nullable(),
  adjust_meta: z.record(z.string(), z.unknown()).nullable(),
  locked_at: iso.nullable(),
  created_at: iso,
  updated_at: iso,
})

export const BrewSessionRow = z.object({
  id,
  version_id: id,
  method: z.enum(['v60', 'aeropress', 'espresso']),
  coffee_id: id.nullable(),
  bag_id: id.nullable(),
  started_at: iso,
  finished_at: iso,
  grams_used: z.number().min(0),
  duration_s: z.number().int().min(0),
  outcome: z.enum(['completed', 'abandoned']),
  rating: z.number().int().min(1).max(5).nullable(),
  symptoms: z.array(z.string()),
  notes: z.string().max(2000).nullable(),
  updated_at: iso,
})

/** Orden de aplicación: los padres antes que los hijos (FKs compuestas) */
export const SYNC_TABLES = ['profiles', 'coffees', 'coffee_bags', 'stock_adjustments', 'recipe_versions', 'brew_sessions'] as const
export type SyncTable = (typeof SYNC_TABLES)[number]

export const SyncOp = z.discriminatedUnion('table', [
  z.object({ table: z.literal('profiles'), row: ProfileRow }),
  z.object({ table: z.literal('coffees'), row: CoffeeRow }),
  z.object({ table: z.literal('coffee_bags'), row: BagRow }),
  z.object({ table: z.literal('stock_adjustments'), row: StockAdjustmentRow }),
  z.object({ table: z.literal('recipe_versions'), row: RecipeVersionRow }),
  z.object({ table: z.literal('brew_sessions'), row: BrewSessionRow }),
])
export type SyncOp = z.infer<typeof SyncOp>

export const MAX_OPS = 100
export const SyncRequest = z.object({ ops: z.array(SyncOp).min(1).max(MAX_OPS) })
export type SyncRequest = z.infer<typeof SyncRequest>

export const SyncResult = z.object({
  /** "tabla:id" */
  key: z.string(),
  status: z.enum(['applied', 'rejected']),
  error: z.string().optional(),
})
export const SyncResponse = z.object({ results: z.array(SyncResult) })
export type SyncResponse = z.infer<typeof SyncResponse>

export const opKey = (op: SyncOp): string => `${op.table}:${op.table === 'profiles' ? 'me' : op.row.id}`
