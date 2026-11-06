/**
 * Base local de Supabase (Docker) para los tests de RLS y sync. Las claves son las del stack local
 * (públicas por diseño en desarrollo), nunca las del proyecto en la nube.
 */
import { execSync } from 'node:child_process'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function localEnv(): Record<string, string> {
  const out = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return Object.fromEntries(
    out
      .split(/\r?\n/)
      .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((m): m is RegExpMatchArray => Boolean(m))
      .map((m) => [m[1]!, m[2]!]),
  )
}

const env = localEnv()
export const API_URL = env.API_URL!
const ANON = env.ANON_KEY!
const SERVICE = env.SERVICE_ROLE_KEY!
if (!API_URL?.startsWith('http://127.0.0.1')) throw new Error('Los tests de nube solo corren contra el stack local')

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
export const admin = (): SupabaseClient => createClient(API_URL, SERVICE, opts)
export const anon = (): SupabaseClient => createClient(API_URL, ANON, opts)

/** Crea un usuario de prueba y devuelve un cliente autenticado con su JWT (RLS aplica) */
export async function testUser(tag: string): Promise<{ id: string; sb: SupabaseClient }> {
  const email = `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@bloom.test`
  const password = `pw-${Math.random().toString(36).slice(2)}A1!`
  const created = await admin().auth.admin.createUser({ email, password, email_confirm: true })
  if (created.error || !created.data.user) throw created.error ?? new Error('no se creó el usuario')
  const sb = anon()
  const signed = await sb.auth.signInWithPassword({ email, password })
  if (signed.error) throw signed.error
  return { id: created.data.user.id, sb }
}
