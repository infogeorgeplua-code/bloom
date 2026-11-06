/**
 * Fase 5 · criterio de "listo" (tech §0, SDD §9.1 y §9.5), contra la base local:
 * 1. Brews offline sincronizan sin duplicarse (mismo id 3 veces → 1 fila; el stock descuenta una vez).
 * 2. RLS: B no ve, no edita, no borra ni referencia nada de A.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { applyOps } from '@/lib/sync/apply'
import { SYNC_TABLES, type SyncOp } from '@/lib/sync/schema'
import { anon, testUser } from './local-stack'

const now = Date.now()
const iso = (ms: number) => new Date(ms).toISOString()
const T = iso(now)

const coffee = (id: string, name = 'Finca A', updated = T): SyncOp => ({
  table: 'coffees',
  row: { id, name, roaster: null, origin_country: 'Ecuador', variety: null, process: 'lavado', roast_level: 'medio', roast_date: '2026-10-20', altitude_m: 1800, archived: false, created_at: T, updated_at: updated },
})
const bag = (id: string, coffeeId: string): SyncOp => ({
  table: 'coffee_bags',
  row: { id, coffee_id: coffeeId, number: 1, initial_g: 250, opened_at: T, status: 'active', finished_at: null, updated_at: T },
})
const version = (id: string, coffeeId: string | null): SyncOp => ({
  table: 'recipe_versions',
  row: {
    id, recipe_id: `${coffeeId}:v60:equilibrado`, number: 1, parent_version_id: null, status: 'active', method: 'v60',
    objective: 'equilibrado', coffee_id: coffeeId, source: 'engine', seed_version: null, name: 'Finca A · Equilibrado',
    params: { doseG: 15, waterG: 240 }, traceability: { kind: 'regla_tecnica' }, engine_version: 'P-14.1', adjust_meta: null,
    locked_at: null, created_at: T, updated_at: T,
  },
})
const brew = (id: string, versionId: string, coffeeId: string | null, bagId: string | null, rating: number | null = null, updated = T): SyncOp => ({
  table: 'brew_sessions',
  row: {
    id, version_id: versionId, method: 'v60', coffee_id: coffeeId, bag_id: bagId, started_at: T, finished_at: T, grams_used: 15,
    duration_s: 170, outcome: 'completed', rating, symptoms: [], notes: null, updated_at: updated,
  },
})
const adjustment = (id: string, bagId: string): SyncOp => ({
  table: 'stock_adjustments',
  row: { id, bag_id: bagId, delta_g: -5, reason: 'manual', created_at: T, updated_at: T },
})
const profile: SyncOp = { table: 'profiles', row: { setup: { grinder: null, brewAltitudeM: 2850 }, haptics: true, updated_at: T } }

let A: { id: string; sb: SupabaseClient }
let B: { id: string; sb: SupabaseClient }

beforeAll(async () => {
  A = await testUser('a')
  B = await testUser('b')
  const res = await applyOps(A.sb, A.id, [
    profile, coffee('c1'), bag('bag1', 'c1'), adjustment('adj1', 'bag1'), version('v1', 'c1'), brew('s1', 'v1', 'c1', 'bag1'),
  ], now)
  expect(res.filter((r) => r.status !== 'applied')).toEqual([])
})

describe('sync idempotente (tech §0 fase 5)', () => {
  it('el mismo brew enviado 3 veces es 1 fila y el stock descuenta una vez', async () => {
    for (let i = 0; i < 3; i++) {
      const r = await applyOps(A.sb, A.id, [brew('s2', 'v1', 'c1', 'bag1')], now)
      expect(r[0]?.status).toBe('applied')
    }
    const { count } = await A.sb.from('brew_sessions').select('*', { count: 'exact', head: true }).eq('id', 's2')
    expect(count).toBe(1)
    const { data } = await A.sb.from('bag_stock').select('current_g').eq('bag_id', 'bag1').single()
    expect(Number(data?.current_g)).toBe(250 - 15 - 15 - 5) // s1 + s2 + ajuste −5
  })

  it('gana el cambio más reciente: uno viejo no pisa la evaluación nueva', async () => {
    await applyOps(A.sb, A.id, [brew('s1', 'v1', 'c1', 'bag1', 4, iso(now + 1000))], now)
    await applyOps(A.sb, A.id, [brew('s1', 'v1', 'c1', 'bag1', 2, iso(now - 1000))], now)
    const { data } = await A.sb.from('brew_sessions').select('rating').eq('id', 's1').single()
    expect(data?.rating).toBe(4)
  })

  it('un updated_at más de 5 min en el futuro se rechaza', async () => {
    const r = await applyOps(A.sb, A.id, [coffee('c-futuro', 'X', iso(now + 10 * 60_000))], now)
    expect(r[0]?.status).toBe('rejected')
  })

  it('una op inválida (FK) no bloquea las demás', async () => {
    const r = await applyOps(A.sb, A.id, [brew('s-huerfano', 'no-existe', null, null), coffee('c2', 'Otra')], now)
    expect(r.map((x) => x.status).sort()).toEqual(['applied', 'rejected'])
  })
})

describe('RLS: B no ve ni toca datos de A (SDD §9.5)', () => {
  it('B no lee ninguna fila de A en ninguna tabla ni en bag_stock', async () => {
    for (const t of [...SYNC_TABLES, 'bag_stock'] as const) {
      const { data, error } = await B.sb.from(t).select('*')
      expect(error).toBeNull()
      expect(data, t).toEqual([])
    }
  })

  it('B no puede editar ni borrar filas de A (0 filas afectadas)', async () => {
    const upd = await B.sb.from('coffees').update({ name: 'hackeado' }).eq('id', 'c1').select()
    expect(upd.data).toEqual([])
    const del = await B.sb.from('brew_sessions').delete().eq('id', 's1').select()
    expect(del.data).toEqual([])
    const { data } = await A.sb.from('coffees').select('name').eq('id', 'c1').single()
    expect(data?.name).toBe('Finca A')
    expect((await A.sb.from('brew_sessions').select('id').eq('id', 's1')).data).toHaveLength(1)
  })

  it('B no puede insertar filas a nombre de A', async () => {
    const { error } = await B.sb.from('coffees').insert({ ...coffee('c-b').row, user_id: A.id })
    expect(error).not.toBeNull()
  })

  it('B no puede apuntar su brew al café, la bolsa o la receta de A (FK compuesta)', async () => {
    await applyOps(B.sb, B.id, [version('vb', null)], now)
    for (const op of [brew('sb1', 'vb', 'c1', null), brew('sb2', 'vb', null, 'bag1'), brew('sb3', 'v1', null, null)]) {
      const r = await applyOps(B.sb, B.id, [op], now)
      expect(r[0]?.status).toBe('rejected')
    }
  })

  it('B escribiendo con user_id de A desde el sync: queda a nombre de B, nunca de A', async () => {
    // applyOps siempre usa el usuario de la sesión; y aunque se forzara, RLS lo rechaza
    const forced = await B.sb.from('coffees').upsert({ ...coffee('c1', 'pisado').row, user_id: A.id }, { onConflict: 'user_id,id' })
    expect(forced.error).not.toBeNull()
    const { data } = await A.sb.from('coffees').select('name').eq('id', 'c1').single()
    expect(data?.name).toBe('Finca A')
  })

  it('sin sesión (anon) no se lee nada', async () => {
    for (const t of SYNC_TABLES) {
      const { data } = await anon().from(t).select('*')
      expect(data ?? []).toEqual([])
    }
  })
})

describe('service_role nunca en el cliente', () => {
  it('ningún archivo de src/ la menciona', () => {
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (/service_role|SERVICE_ROLE/.test(readFileSync(p, 'utf8'))) hits.push(p)
      }
    }
    walk('src')
    expect(hits).toEqual([])
  })
})
