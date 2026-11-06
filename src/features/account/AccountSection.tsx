'use client'

/** Sección "Cuenta" de Setup (fase 5): entrar, estado del sync, sincronizar ahora y salir. */
import { useRouter } from 'next/navigation'
import { Cloud } from 'lucide-react'
import { Button } from '@/components'
import { syncNow } from '@/lib/sync/agent'
import { getSupabase } from '@/lib/supabase/client'
import { useSyncStatus } from './SyncAgent'

function ago(epochMs: number): string {
  const min = Math.round((Date.now() - epochMs) / 60_000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`
}

export function AccountSection() {
  const router = useRouter()
  const s = useSyncStatus()
  if (s.kind === 'off') return null

  return (
    <section className="flex flex-col gap-3" aria-label="Cuenta">
      <h2 className="t-label text-fg-3">Cuenta</h2>
      {s.kind === 'signed_out' ? (
        <>
          <p className="t-body text-fg-2">Guarda tus cafés, recetas y brews en la nube y úsalos en otro teléfono.</p>
          <Button variant="secondary" size="md" icon={Cloud} onClick={() => router.push('/entrar')}>
            Entrar
          </Button>
        </>
      ) : (
        <>
          <p className="t-body text-fg">{s.email ?? 'Sesión iniciada'}</p>
          <p className="t-caption text-fg-3" aria-live="polite">
            {s.kind === 'syncing' ? (
              'Sincronizando…'
            ) : s.pending ? (
              <>
                <span className="num">{s.pending}</span> {s.pending === 1 ? 'cambio por subir' : 'cambios por subir'}
              </>
            ) : s.lastSyncAtEpochMs ? (
              `Todo sincronizado · ${ago(s.lastSyncAtEpochMs)}`
            ) : (
              'Todo sincronizado'
            )}
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="md" fullWidth disabled={s.kind === 'syncing'} onClick={() => void syncNow()}>
              Sincronizar ahora
            </Button>
            <Button variant="tertiary" size="md" fullWidth onClick={() => void getSupabase()?.auth.signOut()}>
              Salir
            </Button>
          </div>
          <p className="t-caption text-fg-3">Al salir, lo que tienes en este teléfono se queda.</p>
        </>
      )}
    </section>
  )
}
