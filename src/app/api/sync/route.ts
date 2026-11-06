import { NextResponse } from 'next/server'
import { applyOps } from '@/lib/sync/apply'
import { SyncRequest } from '@/lib/sync/schema'
import { cloudConfigured } from '@/lib/supabase/env'
import { getServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status })

/** POST /api/sync — sube la cola de IndexedDB (SDD §4). Sesión en cookies; RLS con el JWT del usuario. */
export async function POST(request: Request) {
  if (!cloudConfigured()) return fail(503, 'sin_nube', 'La nube no está configurada')
  const sb = await getServerSupabase()
  const { data, error } = await sb.auth.getUser()
  if (error || !data.user) return fail(401, 'sin_sesion', 'Inicia sesión para sincronizar')

  const parsed = SyncRequest.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(400, 'validacion', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const results = await applyOps(sb, data.user.id, parsed.data.ops, Date.now())
  return NextResponse.json({ results })
}
