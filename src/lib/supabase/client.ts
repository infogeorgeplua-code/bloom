'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, cloudConfigured } from './env'

let client: SupabaseClient | null = null

/** Cliente del navegador con la sesión del usuario (cookies). null si la nube no está configurada. */
export function getSupabase(): SupabaseClient | null {
  if (!cloudConfigured()) return null
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}
