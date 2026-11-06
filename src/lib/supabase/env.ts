/**
 * Entorno de Supabase (fase 5). Solo variables públicas: la publishable/anon key está hecha para
 * el cliente y RLS protege los datos (D-03). Sin variables, la app funciona igual, solo sin nube.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? ''
/** Google OAuth se muestra solo cuando el proveedor está activo en Supabase */
export const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === '1'

export const cloudConfigured = (): boolean => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
