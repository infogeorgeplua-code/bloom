import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { BloomDB, ensureSeed, getHapticsEnabled, setHapticsEnabled } from '@/lib/offline-db'
import { SEED_VERSION } from '@/lib/recipes'

let n = 0
let db: BloomDB
const fresh = () => (db = new BloomDB(`bloom-test-${++n}`))

afterEach(async () => {
  db?.close()
})

describe('offline-db', () => {
  it('carga el seed una vez y marca la versión', async () => {
    fresh()
    await ensureSeed(db, 1)
    expect(await db.recipes.count()).toBe(3)
    expect((await db.meta.get('seedVersion'))?.value).toBe(SEED_VERSION)
  })

  it('es idempotente y no toca los brews ni recetas del usuario', async () => {
    fresh()
    await ensureSeed(db, 1)
    await db.brewSessions.put({
      id: 'b1', versionId: 'v60-base-v1', method: 'v60', coffeeId: null, bagId: null,
      startedAtEpochMs: 1, finishedAtEpochMs: 2, gramsUsed: 15, durationS: 170,
      outcome: 'completed', rating: null, symptoms: [], notes: null, syncState: 'local',
    })
    await db.meta.put({ key: 'seedVersion', value: 'viejo' })
    await ensureSeed(db, 2)
    expect(await db.brewSessions.count()).toBe(1)
    expect(await db.recipes.count()).toBe(3)
  })

  it('las sesiones se consultan por fecha de fin (métricas del Home)', async () => {
    fresh()
    for (const [id, t] of [['a', 10], ['b', 20], ['c', 30]] as const) {
      await db.brewSessions.put({
        id, versionId: 'v', method: 'v60', coffeeId: null, bagId: null, startedAtEpochMs: t - 1,
        finishedAtEpochMs: t, gramsUsed: 15, durationS: 1, outcome: 'completed', rating: null,
        symptoms: [], notes: null, syncState: 'local',
      })
    }
    const rows = await db.brewSessions.where('finishedAtEpochMs').aboveOrEqual(20).toArray()
    expect(rows.map((r) => r.id)).toEqual(['b', 'c'])
  })

  it('vibración encendida por defecto y se puede apagar', async () => {
    fresh()
    expect(await getHapticsEnabled(db)).toBe(true)
    await setHapticsEnabled(db, false)
    expect(await getHapticsEnabled(db)).toBe(false)
  })
})
