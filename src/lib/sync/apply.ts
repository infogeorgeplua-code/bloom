/**
 * Servidor: aplica las operaciones del sync con el cliente del usuario (RLS). Cada op es un upsert
 * por (user_id, id): reintentar nunca duplica. Gana el updated_at más reciente (trigger keep_newest).
 * Una op fallida no bloquea las demás (SDD §4).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { SYNC_TABLES, opKey, type SyncOp } from './schema'

/** El servidor rechaza un updatedAt más de 5 min en el futuro (SDD §4) */
export const MAX_FUTURE_MS = 5 * 60_000

export interface ApplyResult {
  key: string
  status: 'applied' | 'rejected'
  error?: string
}

export async function applyOps(sb: SupabaseClient, userId: string, ops: SyncOp[], nowMs: number): Promise<ApplyResult[]> {
  const ordered = [...ops].sort((a, b) => SYNC_TABLES.indexOf(a.table) - SYNC_TABLES.indexOf(b.table))
  const results: ApplyResult[] = []
  for (const op of ordered) {
    const key = opKey(op)
    if (Date.parse(op.row.updated_at) > nowMs + MAX_FUTURE_MS) {
      results.push({ key, status: 'rejected', error: 'La fecha del cambio está en el futuro' })
      continue
    }
    const { error } = await sb
      .from(op.table)
      .upsert({ ...op.row, user_id: userId }, { onConflict: op.table === 'profiles' ? 'user_id' : 'user_id,id' })
    results.push(error ? { key, status: 'rejected', error: error.message } : { key, status: 'applied' })
  }
  return results
}
