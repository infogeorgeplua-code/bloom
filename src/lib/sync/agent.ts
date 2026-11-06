'use client'

/**
 * Agente del sync en el navegador (fase 5). Con sesión: instala los hooks, sube la cola al abrir
 * la app, al volver la señal, al volver a la pestaña y cada minuto si hay pendientes. Nunca
 * bloquea la UI ni Brew Mode, y nunca muestra "Sin conexión": si falla, reintenta después.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { getDb, type BloomDB } from '@/lib/offline-db'
import { getSupabase } from '@/lib/supabase/client'
import { enqueueAll, enqueueUnsyncedBrews, installSyncHooks, pullAll, pushQueue, sendViaApi, type PushSummary } from './queue'

export type SyncStatus =
  | { kind: 'off' } // nube no configurada
  | { kind: 'signed_out' }
  | { kind: 'idle'; email: string | null; pending: number; lastSyncAtEpochMs: number | null }
  | { kind: 'syncing'; email: string | null }

const listeners = new Set<(s: SyncStatus) => void>()
let status: SyncStatus = { kind: 'signed_out' }
const emit = (s: SyncStatus) => {
  status = s
  for (const l of listeners) l(s)
}
export const getSyncStatus = () => status
export function onSyncStatus(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

let running: Promise<PushSummary | null> | null = null

/** Primer ingreso de este usuario en este teléfono: sube todo lo local y baja lo de la nube */
async function firstSyncFor(db: BloomDB, sb: SupabaseClient, userId: string) {
  const seen = await db.meta.get('cloudUserId')
  if (seen?.value === userId) return
  await enqueueAll(db)
  await pullAll(db, async (table) => {
    const { data, error } = await sb.from(table).select('*')
    if (error) throw error
    return data ?? []
  })
  await db.meta.put({ key: 'cloudUserId', value: userId })
}

export async function syncNow(): Promise<PushSummary | null> {
  if (running) return running
  running = (async () => {
    const sb = getSupabase()
    if (!sb) {
      emit({ kind: 'off' })
      return null
    }
    const { data } = await sb.auth.getSession()
    const user = data.session?.user
    if (!user) {
      emit({ kind: 'signed_out' })
      return null
    }
    const db = getDb()
    installSyncHooks(db)
    const email = user.email ?? null
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      emit({ kind: 'idle', email, pending: await db.syncQueue.count(), lastSyncAtEpochMs: await lastSync(db) })
      return null
    }
    emit({ kind: 'syncing', email })
    try {
      await firstSyncFor(db, sb, user.id)
      await enqueueUnsyncedBrews(db)
      const summary = await pushQueue(db, sendViaApi)
      if (summary.stoppedByStatus === null) await db.meta.put({ key: 'lastSyncAt', value: Date.now() })
      return summary
    } catch {
      return null // sin red o servidor caído: la cola espera al próximo intento
    } finally {
      emit({ kind: 'idle', email, pending: await db.syncQueue.count(), lastSyncAtEpochMs: await lastSync(db) })
    }
  })()
  try {
    return await running
  } finally {
    running = null
  }
}

async function lastSync(db: BloomDB): Promise<number | null> {
  const v = (await db.meta.get('lastSyncAt'))?.value
  return typeof v === 'number' ? v : null
}

let started = false
/** Arranca una sola vez por pestaña */
export function startSyncAgent(): () => void {
  const sb = getSupabase()
  if (!sb || started) {
    if (!sb) emit({ kind: 'off' })
    return () => {}
  }
  started = true
  const run = () => void syncNow()
  const onVisible = () => document.visibilityState === 'visible' && run()
  const { data: sub } = sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(run, 0)
  })
  window.addEventListener('online', run)
  document.addEventListener('visibilitychange', onVisible)
  const timer = window.setInterval(async () => {
    if ((await getDb().syncQueue.count()) > 0) run()
  }, 60_000)
  run()
  return () => {
    started = false
    sub.subscription.unsubscribe()
    window.removeEventListener('online', run)
    document.removeEventListener('visibilitychange', onVisible)
    window.clearInterval(timer)
  }
}
