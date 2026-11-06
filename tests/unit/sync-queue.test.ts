import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { BloomDB, ensureSeed, setHapticsEnabled } from '@/lib/offline-db'
import { createCoffee, saveBrewSession, saveSetup } from '@/lib/library-db'
import { enqueueAll, enqueueUnsyncedBrews, installSyncHooks, pullAll, pushQueue, withoutTracking, type SendOps } from '@/lib/sync/queue'
import { coffeeToRow } from '@/lib/sync/rows'
import { SyncOp, opKey } from '@/lib/sync/schema'
import type { BrewSessionRecord } from '@/lib/offline-db'

let n = 0
let db: BloomDB
const fresh = () => {
  db = new BloomDB(`bloom-sync-${++n}`)
  installSyncHooks(db)
  return db
}
afterEach(() => db?.close())
const tick = () => new Promise((r) => setTimeout(r, 20))
const queued = async () => (await db.syncQueue.toArray()).map((e) => `${(e.op as { table: string }).table}:${(e.op as { id: string }).id}`)

const COFFEE = { name: 'Finca', roaster: null, originCountry: null, variety: null, process: null, roastLevel: null, roastDateISO: null, altitudeM: null }
const brew = (id: string, versionId = 'v60-base-v1'): BrewSessionRecord => ({
  id, versionId, method: 'v60', coffeeId: null, bagId: null, startedAtEpochMs: 1, finishedAtEpochMs: 2,
  gramsUsed: 15, durationS: 170, outcome: 'completed', rating: null, symptoms: [], notes: null, syncState: 'local',
})

/** Servidor falso: valida con Zod como /api/sync y guarda por clave (idempotente) */
function fakeServer() {
  const rows = new Map<string, SyncOp>()
  let calls = 0
  const send: SendOps = async (ops) => {
    calls++
    return {
      ok: true,
      results: ops.map((op) => {
        const ok = SyncOp.safeParse(op).success
        if (ok) rows.set(opKey(op), op)
        return { key: opKey(op), status: ok ? 'applied' : 'rejected' }
      }),
    }
  }
  return { rows, send, calls: () => calls }
}

describe('cola del sync (fase 5)', () => {
  it('cada escritura marca su fila; un brew marca también su versión de receta', async () => {
    fresh()
    const id = await createCoffee(db, COFFEE, 250, 10)
    await saveBrewSession(db, brew('b1'))
    await saveSetup(db, { grinder: null, brewAltitudeM: 2850 })
    await setHapticsEnabled(db, false)
    await tick()
    const q = await queued()
    expect(q).toEqual(expect.arrayContaining([`coffees:${id}`, 'brew_sessions:b1', 'recipe_versions:v60-base-v1', 'profiles:me']))
    expect(q.some((k) => k.startsWith('coffee_bags:'))).toBe(true)
  })

  it('lo que llega de la nube no se vuelve a subir', async () => {
    fresh()
    await withoutTracking(() => createCoffee(db, COFFEE, null, 1))
    await tick()
    expect(await queued()).toEqual([])
  })

  it('subir 3 veces lo mismo no duplica; lo aplicado sale de la cola y el brew queda synced', async () => {
    fresh()
    await ensureSeed(db, 1)
    await createCoffee(db, COFFEE, 250, 10)
    await saveBrewSession(db, brew('b1'))
    await tick()
    const server = fakeServer()
    const first = await pushQueue(db, server.send)
    expect(first.rejected).toBe(0)
    expect(await db.syncQueue.count()).toBe(0)
    expect((await db.brewSessions.get('b1'))?.syncState).toBe('synced')
    // Reintentos (p. ej. la respuesta se perdió): mismas claves, mismo número de filas
    await enqueueAll(db)
    await pushQueue(db, server.send)
    await enqueueAll(db)
    await pushQueue(db, server.send)
    expect([...server.rows.keys()].filter((k) => k === 'brew_sessions:b1')).toHaveLength(1)
    // Padres antes que hijos
    const order = [...server.rows.keys()].map((k) => k.split(':')[0])
    expect(order.indexOf('coffees')).toBeLessThan(order.indexOf('coffee_bags'))
    expect(order.indexOf('recipe_versions')).toBeLessThan(order.indexOf('brew_sessions'))
  })

  it('sin sesión (401) la cola queda intacta para después', async () => {
    fresh()
    await createCoffee(db, COFFEE, null, 1)
    await tick()
    const r = await pushQueue(db, async () => ({ ok: false, status: 401 }))
    expect(r.stoppedByStatus).toBe(401)
    expect(await db.syncQueue.count()).toBe(1)
  })

  it('red de seguridad: brews locales vuelven a la cola', async () => {
    fresh()
    await withoutTracking(() => saveBrewSession(db, brew('b9')))
    await tick()
    await enqueueUnsyncedBrews(db)
    expect(await queued()).toEqual(['recipe_versions:v60-base-v1', 'brew_sessions:b9'])
  })

  it('bajar: trae tus datos sin pisar lo que tienes pendiente de subir', async () => {
    fresh()
    const local = await createCoffee(db, { ...COFFEE, name: 'Local editado' }, null, 1)
    await tick()
    const cloudOther = coffeeToRow({ ...COFFEE, id: 'nube-1', name: 'De la nube', createdAtEpochMs: 5, archived: false }, 6)
    const cloudSame = coffeeToRow({ ...COFFEE, id: local, name: 'Versión vieja', createdAtEpochMs: 1, archived: false }, 2)
    const count = await pullAll(db, async (t) => (t === 'coffees' ? [cloudOther, cloudSame] : []))
    expect(count).toBe(1)
    expect((await db.coffees.get('nube-1'))?.name).toBe('De la nube')
    expect((await db.coffees.get(local))?.name).toBe('Local editado')
    await tick()
    expect(await queued()).toEqual([`coffees:${local}`]) // lo bajado no se re-sube
  })
})
