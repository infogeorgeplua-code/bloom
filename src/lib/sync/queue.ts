/**
 * Cliente del sync (fase 5, tech §4). Cada escritura en IndexedDB deja en `syncQueue` qué fila
 * cambió (hooks de Dexie: ninguna pantalla tiene que acordarse). Al sincronizar se lee la fila
 * actual, se convierte y se sube; gana el cambio más reciente. Brew Mode nunca espera a la red.
 */
import type { Transaction } from 'dexie'
import { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { SetupRecord } from '@/lib/schemas/coffee'
import { getHapticsEnabled, type BloomDB } from '@/lib/offline-db'
import { getSetup } from '@/lib/library-db'
import {
  adjustmentFromRow,
  adjustmentToRow,
  bagFromRow,
  bagToRow,
  brewFromRow,
  brewToRow,
  coffeeFromRow,
  coffeeToRow,
  profileToRow,
  versionFromRow,
  versionToRow,
} from './rows'
import {
  BagRow,
  BrewSessionRow,
  CoffeeRow,
  MAX_OPS,
  ProfileRow,
  RecipeVersionRow,
  SYNC_TABLES,
  StockAdjustmentRow,
  SyncResponse,
  opKey,
  type SyncOp,
  type SyncTable,
} from './schema'

export interface DirtyRef {
  table: SyncTable
  /** 'me' en profiles */
  id: string
}

const keyOf = (r: DirtyRef) => `${r.table}:${r.id}`

/** Tablas locales que se sincronizan y su tabla en Postgres */
const LOCAL: { local: 'coffees' | 'bags' | 'stockAdjustments' | 'recipes' | 'brewSessions'; table: SyncTable }[] = [
  { local: 'coffees', table: 'coffees' },
  { local: 'bags', table: 'coffee_bags' },
  { local: 'stockAdjustments', table: 'stock_adjustments' },
  { local: 'recipes', table: 'recipe_versions' },
  { local: 'brewSessions', table: 'brew_sessions' },
]

// ── Marcar cambios ───────────────────────────────────────────────────────

let suppressed = 0
/** Escrituras que vienen de la nube (bajada) no se vuelven a subir */
export async function withoutTracking<T>(fn: () => Promise<T>): Promise<T> {
  suppressed++
  try {
    return await fn()
  } finally {
    suppressed--
  }
}

export async function markDirty(db: BloomDB, refs: DirtyRef[], nowEpochMs = Date.now()): Promise<void> {
  if (!refs.length) return
  await db.syncQueue.bulkAdd(refs.map((op) => ({ op, createdAtEpochMs: nowEpochMs, attempts: 0 })))
}

const installed = new WeakSet<BloomDB>()

/**
 * Hooks de Dexie: al confirmarse la transacción, la fila queda marcada. Un brew marca también su
 * versión de receta (si es una receta base, se sube tu copia: la FK del brew la necesita).
 */
export function installSyncHooks(db: BloomDB): void {
  if (installed.has(db)) return
  installed.add(db)
  const after = (trans: Transaction, refs: () => DirtyRef[]) => {
    if (suppressed) return
    trans.on('complete', () => void markDirty(db, refs()))
  }
  for (const { local, table } of LOCAL) {
    const t = db.table(local)
    t.hook('creating', (primKey, obj: { id: string; versionId?: string }, trans) => {
      after(trans, () => [{ table, id: obj.id }, ...(obj.versionId ? [{ table: 'recipe_versions' as const, id: obj.versionId }] : [])])
    })
    t.hook('updating', (_mods, primKey, _obj, trans) => {
      after(trans, () => [{ table, id: String(primKey) }])
    })
  }
  const meta = db.table('meta')
  const profileHook = (key: unknown, trans: Transaction) => {
    if (key === 'setup' || key === 'haptics') after(trans, () => [{ table: 'profiles', id: 'me' }])
  }
  meta.hook('creating', (primKey, obj: { key: string }, trans) => profileHook(obj.key, trans))
  meta.hook('updating', (_mods, primKey, _obj, trans) => profileHook(primKey, trans))
}

/**
 * Al entrar por primera vez (o si algo quedó sin marcar): todo lo tuyo a la cola. De las recetas
 * base solo las que usaste o cambiaste de estado.
 */
export async function enqueueAll(db: BloomDB, nowEpochMs = Date.now()): Promise<number> {
  const [coffees, bags, adjustments, recipes, brews] = await Promise.all([
    db.coffees.toArray(),
    db.bags.toArray(),
    db.stockAdjustments.toArray(),
    db.recipes.toArray(),
    db.brewSessions.toArray(),
  ])
  const usedVersions = new Set(brews.map((b) => b.versionId))
  const refs: DirtyRef[] = [
    { table: 'profiles', id: 'me' },
    ...coffees.map((x) => ({ table: 'coffees' as const, id: x.id })),
    ...bags.map((x) => ({ table: 'coffee_bags' as const, id: x.id })),
    ...adjustments.map((x) => ({ table: 'stock_adjustments' as const, id: x.id })),
    ...recipes
      .filter((r) => r.source !== 'seed' || r.status !== 'active' || usedVersions.has(r.id))
      .map((x) => ({ table: 'recipe_versions' as const, id: x.id })),
    ...brews.map((x) => ({ table: 'brew_sessions' as const, id: x.id })),
  ]
  await markDirty(db, refs, nowEpochMs)
  return refs.length
}

/** Red de seguridad: brews que nunca llegaron a la nube (syncState 'local') vuelven a la cola */
export async function enqueueUnsyncedBrews(db: BloomDB, nowEpochMs = Date.now()): Promise<void> {
  const local = await db.brewSessions.where('syncState').equals('local').toArray()
  await markDirty(
    db,
    local.flatMap((b) => [
      { table: 'recipe_versions' as const, id: b.versionId },
      { table: 'brew_sessions' as const, id: b.id },
    ]),
    nowEpochMs,
  )
}

// ── Subir ────────────────────────────────────────────────────────────────

async function buildOp(db: BloomDB, ref: DirtyRef, updatedAtMs: number): Promise<SyncOp | null> {
  switch (ref.table) {
    case 'profiles':
      return { table: 'profiles', row: profileToRow(await getSetup(db), await getHapticsEnabled(db), updatedAtMs) }
    case 'coffees': {
      const r = await db.coffees.get(ref.id)
      return r ? { table: 'coffees', row: coffeeToRow(r, updatedAtMs) } : null
    }
    case 'coffee_bags': {
      const r = await db.bags.get(ref.id)
      return r ? { table: 'coffee_bags', row: bagToRow(r, updatedAtMs) } : null
    }
    case 'stock_adjustments': {
      const r = await db.stockAdjustments.get(ref.id)
      return r ? { table: 'stock_adjustments', row: adjustmentToRow(r, updatedAtMs) } : null
    }
    case 'recipe_versions': {
      const r = await db.recipes.get(ref.id)
      return r ? { table: 'recipe_versions', row: versionToRow(r, updatedAtMs) } : null
    }
    case 'brew_sessions': {
      const r = await db.brewSessions.get(ref.id)
      return r ? { table: 'brew_sessions', row: brewToRow(r, updatedAtMs) } : null
    }
  }
}

export type SendOps = (ops: SyncOp[]) => Promise<{ ok: true; results: SyncResponse['results'] } | { ok: false; status: number }>

/** POST /api/sync con la sesión en cookies */
export const sendViaApi: SendOps = async (ops) => {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ ops }),
  })
  if (!res.ok) return { ok: false, status: res.status }
  const parsed = SyncResponse.safeParse(await res.json())
  return parsed.success ? { ok: true, results: parsed.data.results } : { ok: false, status: 502 }
}

export interface PushSummary {
  applied: number
  rejected: number
  pending: number
  /** 401: sin sesión; otro: el servidor falló (se reintenta luego) */
  stoppedByStatus: number | null
}

/** Sube la cola en lotes de 100, en orden de dependencias. Lo aplicado sale de la cola. */
export async function pushQueue(db: BloomDB, send: SendOps): Promise<PushSummary> {
  const entries = await db.syncQueue.orderBy('seq').toArray()
  const byKey = new Map<string, { ref: DirtyRef; seqs: number[]; updatedAt: number }>()
  for (const e of entries) {
    const ref = e.op as DirtyRef
    const k = keyOf(ref)
    const cur = byKey.get(k) ?? { ref, seqs: [], updatedAt: 0 }
    cur.seqs.push(e.seq!)
    cur.updatedAt = Math.max(cur.updatedAt, e.createdAtEpochMs)
    byKey.set(k, cur)
  }
  const items = [...byKey.values()].sort(
    (a, b) => SYNC_TABLES.indexOf(a.ref.table) - SYNC_TABLES.indexOf(b.ref.table) || a.updatedAt - b.updatedAt,
  )
  const summary: PushSummary = { applied: 0, rejected: 0, pending: 0, stoppedByStatus: null }

  for (let i = 0; i < items.length; i += MAX_OPS) {
    const chunk = items.slice(i, i + MAX_OPS)
    const built: { item: (typeof items)[number]; op: SyncOp }[] = []
    for (const item of chunk) {
      const op = await buildOp(db, item.ref, item.updatedAt)
      if (op) built.push({ item, op })
      else await db.syncQueue.bulkDelete(item.seqs) // la fila ya no existe
    }
    if (!built.length) continue
    const res = await send(built.map((b) => b.op))
    if (!res.ok) {
      summary.stoppedByStatus = res.status
      summary.pending = items.length - i
      return summary
    }
    const status = new Map(res.results.map((r) => [r.key, r.status]))
    for (const { item, op } of built) {
      if (status.get(opKey(op)) === 'applied') {
        await db.syncQueue.bulkDelete(item.seqs)
        if (op.table === 'brew_sessions') await withoutTracking(() => db.brewSessions.update(op.row.id, { syncState: 'synced' }))
        summary.applied++
      } else {
        await db.syncQueue.where(':id').anyOf(item.seqs).modify((e) => {
          e.attempts++
        })
        summary.rejected++
      }
    }
  }
  return summary
}

// ── Bajar ────────────────────────────────────────────────────────────────

/** Lee una tabla de la nube con la sesión del usuario (RLS) */
export type FetchTable = (table: SyncTable) => Promise<unknown[]>

/**
 * Trae tus datos de la nube a este teléfono (dispositivo nuevo o reinstalación). Lo que tienes
 * pendiente de subir no se pisa: tu cambio local es el más reciente.
 */
export async function pullAll(db: BloomDB, fetchTable: FetchTable): Promise<number> {
  const dirty = new Set((await db.syncQueue.toArray()).map((e) => keyOf(e.op as DirtyRef)))
  const clean = <T extends { id: string }>(table: SyncTable, rows: T[]) => rows.filter((r) => !dirty.has(`${table}:${r.id}`))
  const parse = <T,>(schema: { safeParse: (x: unknown) => { success: boolean; data?: T } }, rows: unknown[]) =>
    rows.map((r) => schema.safeParse(r)).flatMap((r) => (r.success ? [r.data as T] : []))

  const [profiles, coffees, bags, adjustments, versions, brews] = await Promise.all(SYNC_TABLES.map((t) => fetchTable(t)))
  let count = 0
  await withoutTracking(async () => {
    const profile = parse(ProfileRow, profiles ?? [])[0]
    if (profile && !dirty.has('profiles:me')) {
      const setup = SetupRecord.safeParse(profile.setup)
      if (setup.success) await db.meta.put({ key: 'setup', value: setup.data })
      await db.meta.put({ key: 'haptics', value: profile.haptics })
    }
    const c = clean('coffees', parse(CoffeeRow, coffees ?? [])).map(coffeeFromRow)
    const b = clean('coffee_bags', parse(BagRow, bags ?? [])).map(bagFromRow)
    const a = clean('stock_adjustments', parse(StockAdjustmentRow, adjustments ?? [])).map(adjustmentFromRow)
    // Una versión con parámetros inválidos rompería Brew Mode: se descarta
    const v = clean('recipe_versions', parse(RecipeVersionRow, versions ?? []))
      .map(versionFromRow)
      .filter((x) => RecipeVersion.safeParse(x).success)
    const s = clean('brew_sessions', parse(BrewSessionRow, brews ?? [])).map(brewFromRow)
    await db.transaction('rw', [db.coffees, db.bags, db.stockAdjustments, db.recipes, db.brewSessions], async () => {
      await db.coffees.bulkPut(c)
      await db.bags.bulkPut(b)
      await db.stockAdjustments.bulkPut(a)
      await db.recipes.bulkPut(v)
      await db.brewSessions.bulkPut(s)
    })
    count = c.length + b.length + a.length + v.length + s.length
  })
  return count
}
