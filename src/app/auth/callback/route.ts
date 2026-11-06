import { NextResponse, type NextRequest } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Vuelta del enlace del correo o de Google (PKCE): cambia el código por la sesión en cookies */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next')
  // Solo rutas internas: nada de redirecciones abiertas
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/setup'
  if (code) {
    const sb = await getServerSupabase()
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(target, url.origin))
  }
  return NextResponse.redirect(new URL('/entrar?error=1', url.origin))
}
