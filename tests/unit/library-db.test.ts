import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { BloomDB, ensureSeed, type BrewSessionRecord } from '@/lib/offline-db'
import {
  adjustStockTo,
  createCoffee,
  findActiveVersion,
  getRecipeVersion,
  getSetup,
  loadSummaries,
  openBag,
  saveBrewSession,
  saveEngineVersion,
  saveSetup,
} from '@/lib/library-db'
import { generateRecipe } from '@/features/recipes/recipe-engine'
import { LEBURRY_38, setupFromPreset } from '@/features/recipes/grinders'
import { EMPTY_SETUP } from '@/lib/schemas/coffee'

let n = 0
let db: BloomDB
const fresh = () => (db = new BloomDB(`bloom-lib-${++n}`))
afterEach(() => db?.close())

const COFFEE = {
  name: 'El Paraíso Sidra', roaster: null, originCountry: 'Colombia', variety: 'Sidra',
  process: 'anaerobico' as const, roastLevel: 'claro' as const, roastDateISO: '2026-10-20', altitudeM: 1950,
}
const session = (id: string, versionId: string): BrewSessionRecord => ({
  id, versionId, method: 'v60', coffeeId: null, bagId: null, startedAtEpochMs: 1, finishedAtEpochMs: 2,
  gramsUsed: 15, durationS: 170, outcome: 'completed', rating: null, symptoms: [], notes: null, syncState: 'local',
})

describe('migración Dexie v1 → v2 (fase 3)', () => {
  it('conserva brews y recetas de v1 y agrega los stores nuevos', async () => {
    const name = `bloom-mig-${++n}`
    const v1 = new Dexie(name)
    v1.version(1).stores({
      recipes: 'id, recipeId, method, source', activeBrew: 'id',
      brewSessions: 'id, versionId, finishedAtEpochMs, syncState', syncQueue: '++seq, createdAtEpochMs', meta: 'key',
    })
    await v1.table('brewSessions').put(session('viejo', 'v60-base-v1'))
    await v1.table('meta').put({ key: 'haptics', value: false })
    v1.close()

    db = new BloomDB(name)
    expect(await db.brewSessions.get('viejo')).toBeTruthy()
    expect((await db.meta.get('haptics'))?.value).toBe(false)
    expect(await db.coffees.count()).toBe(0)
    expect(await db.brewSessions.where('coffeeId').equals('x').count()).toBe(0)
  })
})

describe('inventario local (P-25)', () => {
  it('café nuevo con bolsa → el brew descuenta de la bolsa activa', async () => {
    fresh()
    await ensureSeed(db, 1)
    const coffeeId = await createCoffee(db, COFFEE, 250, 10)
    const coffee = (await db.coffees.get(coffeeId))!
    const out = generateRecipe({ method: 'v60', objective: 'dulce', coffee, setup: EMPTY_SETUP, todayISO: '2026-11-04' })
    const versionId = await saveEngineVersion(db, { coffee, method: 'v60', objective: 'dulce', output: out, nowEpochMs: 20 })

    await saveBrewSession(db, session('s1', versionId))
    const saved = (await db.brewSessions.get('s1'))!
    expect(saved.coffeeId).toBe(coffeeId)
    expect(saved.bagId).toBeTruthy()

    const [s] = await loadSummaries(db, 100)
    expect(s!.grams).toBe(235)
    expect(s!.lastVersionId).toBe(versionId)
  })

  it('ajustar gramos guarda la diferencia; bolsa nueva cierra la anterior', async () => {
    fresh()
    const coffeeId = await createCoffee(db, COFFEE, 250, 10)
    const bag = (await db.bags.where('coffeeId').equals(coffeeId).first())!
    await adjustStockTo(db, bag.id, 250, 230, 11)
    expect((await loadSummaries(db, 100))[0]!.grams).toBe(230)
    await adjustStockTo(db, bag.id, 230, 230, 12)
    expect(await db.stockAdjustments.count()).toBe(1)

    await openBag(db, coffeeId, 340, 13)
    const bags = await db.bags.where('coffeeId').equals(coffeeId).toArray()
    expect(bags.map((b) => [b.number, b.status])).toEqual(expect.arrayContaining([[1, 'finished'], [2, 'active']]))
    expect((await loadSummaries(db, 100))[0]!.grams).toBe(340)
  })

  it('café sin gramos: sin bolsa, y el brew queda sin bolsa', async () => {
    fresh()
    const coffeeId = await createCoffee(db, { ...COFFEE, name: 'Sin bolsa' }, null, 10)
    expect(await db.bags.count()).toBe(0)
    const coffee = (await db.coffees.get(coffeeId))!
    const out = generateRecipe({ method: 'v60', objective: 'equilibrado', coffee, setup: EMPTY_SETUP, todayISO: '2026-11-04' })
    const v = await saveEngineVersion(db, { coffee, method: 'v60', objective: 'equilibrado', output: out })
    await saveBrewSession(db, session('s2', v))
    expect((await db.brewSessions.get('s2'))!.bagId).toBeNull()
  })

  it('brews de recetas seed no se vinculan a ningún café', async () => {
    fresh()
    await ensureSeed(db, 1)
    await saveBrewSession(db, session('s3', 'v60-base-v1'))
    expect((await db.brewSessions.get('s3'))!.coffeeId).toBeNull()
  })
})

describe('recetas del motor (R1)', () => {
  it('guarda la V1 y la reutiliza para el mismo café + método + objetivo', async () => {
    fresh()
    const coffeeId = await createCoffee(db, COFFEE, 250, 10)
    const coffee = (await db.coffees.get(coffeeId))!
    expect(await findActiveVersion(db, coffeeId, 'v60', 'dulce')).toBeNull()
    const out = generateRecipe({ method: 'v60', objective: 'dulce', coffee, setup: EMPTY_SETUP, todayISO: '2026-11-04' })
    const id = await saveEngineVersion(db, { coffee, method: 'v60', objective: 'dulce', output: out })
    expect((await findActiveVersion(db, coffeeId, 'v60', 'dulce'))?.id).toBe(id)
    expect(await findActiveVersion(db, coffeeId, 'v60', 'brillante')).toBeNull()
    const v = await getRecipeVersion(db, id)
    expect(v).toMatchObject({ source: 'engine', number: 1, coffeeId, name: 'El Paraíso Sidra · Dulce' })
    expect(await getRecipeVersion(db, 'espresso-base-v1')).toMatchObject({ source: 'seed' })
    expect(await getRecipeVersion(db, 'no-existe')).toBeNull()
  })
})

describe('Setup', () => {
  it('vacío por defecto; guarda el molino', async () => {
    fresh()
    expect(await getSetup(db)).toEqual(EMPTY_SETUP)
    const s = { grinder: setupFromPreset(LEBURRY_38), brewAltitudeM: 2850 }
    await saveSetup(db, s)
    expect(await getSetup(db)).toEqual(s)
  })
})
