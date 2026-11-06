// Solo servidor: usa next/headers (falla si se importa desde el cliente)
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/** Cliente de servidor con el JWT del usuario (cookies): RLS aplica siempre (nunca la clave de administrador, D-03). */
export async function getServerSupabase() {
  const store = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) store.set(name, value, options)
      },
    },
  })
}
