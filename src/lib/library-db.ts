/**
 * Lectura y escritura de cafés, bolsas, ajustes, Setup y recetas del motor en IndexedDB
 * (fase 3, P-25). Lógica de negocio en features/*; aquí solo persistencia.
 */
import { summarize, type CoffeeSummary } from '@/features/inventory/library'
import { ENGINE_TRACEABILITY, recipeIdFor, type RecipeOutput } from '@/features/recipes/recipe-engine'
import { ENGINE_VERSION, OBJECTIVE_LABEL, type Objective } from '@/features/recipes/engine-tables'
import { bestStart } from '@/features/evaluation/brew-adjust'
import { evaluatedBrews } from './evaluation-db'
import { METHOD_LABEL } from '@/features/home/monthly-stats'
import { seedRecipe } from '@/lib/recipes'
import {
  CoffeeInput,
  EMPTY_SETUP,
  SetupRecord,
  type BagRecord,
  type CoffeeRecord,
} from '@/lib/schemas/coffee'
import type { Method, RecipeVersion } from '@/lib/schemas/recipe-seed'
import type { BloomDB, BrewSessionRecord, RecipeVersionRecord } from './offline-db'

const uuid = () => crypto.randomUUID()

export async function getSetup(db: BloomDB): Promise<SetupRecord> {
  const row = await db.meta.get('setup')
  const parsed = SetupRecord.safeParse(row?.value)
  return parsed.success ? parsed.data : EMPTY_SETUP
}

export async function saveSetup(db: BloomDB, setup: SetupRecord): Promise<void> {
  await db.meta.put({ key: 'setup', value: SetupRecord.parse(setup) })
}

export async function loadSummaries(db: BloomDB, nowEpochMs: number): Promise<CoffeeSummary[]> {
  const [coffees, bags, sessions, adjustments] = await Promise.all([
    db.coffees.toArray(),
    db.bags.toArray(),
    db.brewSessions.toArray(),
    db.stockAdjustments.toArray(),
  ])
  return summarize(coffees, bags, sessions, adjustments, nowEpochMs)
}

export async function loadSummary(db: BloomDB, coffeeId: string, nowEpochMs: number): Promise<CoffeeSummary | null> {
  const coffee = await db.coffees.get(coffeeId)
  if (!coffee) return null
  const [bags, sessions, adjustments] = await Promise.all([
    db.bags.where('coffeeId').equals(coffeeId).toArray(),
    db.brewSessions.toArray(),
    db.stockAdjustments.toArray(),
  ])
  return summarize([coffee], bags, sessions, adjustments, nowEpochMs)[0] ?? null
}

/** "Tengo un café nuevo": crea el café y, si hay gramos, su bolsa 1 */
export async function createCoffee(db: BloomDB, input: CoffeeInput, bagG: number | null, nowEpochMs = Date.now()): Promise<string> {
  const data = CoffeeInput.parse(input)
  const id = uuid()
  await db.transaction('rw', db.coffees, db.bags, async () => {
    await db.coffees.add({ ...data, id, createdAtEpochMs: nowEpochMs, archived: false })
    if (bagG) await db.bags.add(newBagRecord(id, 1, bagG, nowEpochMs))
  })
  return id
}

export async function updateCoffee(db: BloomDB, id: string, input: CoffeeInput): Promise<void> {
  await db.coffees.update(id, CoffeeInput.parse(input))
}

function newBagRecord(coffeeId: string, number: number, initialG: number, nowEpochMs: number): BagRecord {
  return { id: uuid(), coffeeId, number, initialG, openedAtEpochMs: nowEpochMs, status: 'active', finishedAtEpochMs: null }
}

/** Bolsa nueva: la activa anterior (si queda) pasa a terminada */
export async function openBag(db: BloomDB, coffeeId: string, initialG: number, nowEpochMs: number): Promise<void> {
  await db.transaction('rw', db.bags, async () => {
    const bags = await db.bags.where('coffeeId').equals(coffeeId).toArray()
    for (const b of bags.filter((x) => x.status === 'active')) {
      await db.bags.update(b.id, { status: 'finished', finishedAtEpochMs: nowEpochMs })
    }
    await db.bags.add(newBagRecord(coffeeId, bags.length + 1, initialG, nowEpochMs))
  })
}

export async function finishBag(db: BloomDB, bagId: string, nowEpochMs: number): Promise<void> {
  await db.bags.update(bagId, { status: 'finished', finishedAtEpochMs: nowEpochMs })
}

/** "Ajustar gramos": guarda la diferencia como evento (el stock sigue siendo derivado) */
export async function adjustStockTo(db: BloomDB, bagId: string, currentG: number, targetG: number, nowEpochMs: number): Promise<void> {
  const deltaG = Math.round(targetG - currentG)
  if (!deltaG) return
  await db.stockAdjustments.add({ id: uuid(), bagId, deltaG, createdAtEpochMs: nowEpochMs, reason: 'manual' })
}

export async function archiveCoffee(db: BloomDB, id: string, archived: boolean): Promise<void> {
  await db.coffees.update(id, { archived })
}

/** Receta para Brew Mode: primero IndexedDB (motor), luego el seed */
export async function getRecipeVersion(db: BloomDB, id: string): Promise<RecipeVersion | null> {
  const row = await db.recipes.get(id)
  if (row) {
    const { createdAtEpochMs: _omit, ...rest } = row
    void _omit
    return rest
  }
  return seedRecipe(id) ?? null
}

/**
 * R1: si la receta café + método + objetivo ya existe, su mejor punto de partida (bestStart).
 * Una V1 de un motor anterior (P-14) que nunca se evaluó no cuenta: se regenera con P-14.1.
 */
export async function findActiveVersion(db: BloomDB, coffeeId: string | null, method: Method, objective: Objective): Promise<RecipeVersionRecord | null> {
  const rows = await db.recipes.where('recipeId').equals(recipeIdFor(coffeeId, method, objective)).toArray()
  const history = await evaluatedBrews(db, rows.map((r) => r.id))
  const evaluated = new Set(history.map((b) => b.versionId))
  const stale = (r: RecipeVersionRecord) =>
    r.source === 'engine' && !r.parentVersionId && (r.engineVersion ?? 'P-14') !== ENGINE_VERSION && !evaluated.has(r.id)
  return bestStart(rows.filter((r) => !stale(r)), history)
}

/** Guarda la V1 generada por el motor; devuelve su id para Brew Mode */
export async function saveEngineVersion(
  db: BloomDB,
  args: { coffee: CoffeeRecord | null; method: Method; objective: Objective; output: RecipeOutput; nowEpochMs?: number },
): Promise<string> {
  const { coffee, method, objective, output, nowEpochMs = Date.now() } = args
  const id = uuid()
  const name = `${coffee?.name ?? METHOD_LABEL[method]} · ${OBJECTIVE_LABEL[objective]}`
  const recipeId = recipeIdFor(coffee?.id ?? null, method, objective)
  // Si había una V1 vieja sin evaluar (P-14), la nueva toma el número siguiente
  const siblings = await db.recipes.where('recipeId').equals(recipeId).toArray()
  await db.recipes.add({
    id,
    recipeId,
    number: Math.max(0, ...siblings.map((r) => r.number)) + 1,
    parentVersionId: null,
    status: 'active',
    method,
    objective,
    coffeeId: coffee?.id ?? null,
    source: 'engine',
    seedVersion: null,
    name,
    params: output.params,
    traceability: ENGINE_TRACEABILITY,
    engineVersion: output.engineVersion,
    createdAtEpochMs: nowEpochMs,
  })
  return id
}

/**
 * Guarda el brew terminado vinculado al café de la receta y a su bolsa activa:
 * así el stock se descuenta solo (product §13).
 */
export async function saveBrewSession(db: BloomDB, session: BrewSessionRecord): Promise<void> {
  let { coffeeId, bagId } = session
  if (!coffeeId) coffeeId = (await db.recipes.get(session.versionId))?.coffeeId ?? null
  if (coffeeId && !bagId) {
    const active = (await db.bags.where('coffeeId').equals(coffeeId).toArray())
      .filter((b) => b.status === 'active')
      .sort((a, b) => b.openedAtEpochMs - a.openedAtEpochMs)[0]
    bagId = active?.id ?? null
  }
  await db.brewSessions.put({ ...session, coffeeId, bagId })
}
