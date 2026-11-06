'use client'

/**
 * "Entrar" (fase 5). La cuenta es opcional: sirve para guardar tus datos en la nube y usarlos en
 * otro teléfono. Enlace por correo (sin contraseña) y Google cuando esté activo (D-03).
 * Sin frame en Figma: TopBar + TextField + Button + Banner del DS.
 */
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { Banner, Button, TextField, TopBar } from '@/components'
import { FlowShell } from '@/features/shell/AppShell'
import { getSupabase } from '@/lib/supabase/client'
import { GOOGLE_ENABLED } from '@/lib/supabase/env'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignInScreen() {
  const router = useRouter()
  const failed = useSearchParams().get('error') === '1'
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const sb = getSupabase()
  const back = () => (window.history.length > 1 ? router.back() : router.push('/setup'))
  const callback = () => `${window.location.origin}/auth/callback?next=/setup`

  const sendLink = async () => {
    if (!EMAIL.test(email.trim())) return setError('Escribe un correo válido')
    if (!sb) return setError('La nube no está configurada')
    setBusy(true)
    const { error: e } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback() } })
    setBusy(false)
    if (e) return setError(navigator.onLine ? 'No pudimos enviar el correo. Intenta en unos minutos.' : 'Necesitas conexión para entrar.')
    setSent(true)
  }

  const google = async () => {
    if (!sb) return
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback() } })
  }

  if (sent) {
    return (
      <FlowShell header={<TopBar onBack={back} />}>
        <h1 className="t-title-lg text-fg">Revisa tu correo</h1>
        <p className="t-body text-fg-2">
          Te enviamos un enlace a <span className="text-fg">{email.trim()}</span>. Ábrelo en este teléfono para entrar.
        </p>
        <Button variant="tertiary" size="md" onClick={() => setSent(false)}>
          Usar otro correo
        </Button>
      </FlowShell>
    )
  }

  return (
    <FlowShell
      header={<TopBar onBack={back} />}
      footer={
        <Button size="lg" fullWidth icon={Mail} loading={busy} onClick={() => void sendLink()}>
          Enviarme el enlace
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <h1 className="t-title-lg text-fg">Guarda tu café en la nube</h1>
        <p className="t-body text-fg-2">
          Tus cafés, recetas y brews quedan respaldados y los ves en otro teléfono. Sin contraseña: te llega un enlace al correo.
        </p>
      </div>
      {failed ? <Banner tone="warning">El enlace venció o ya se usó. Pide uno nuevo.</Banner> : null}
      {!sb ? <Banner tone="neutral">La nube aún no está configurada en esta versión.</Banner> : null}
      <TextField
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setError(undefined)
        }}
        error={error}
      />
      {GOOGLE_ENABLED ? (
        <Button variant="secondary" size="lg" fullWidth onClick={() => void google()}>
          Continuar con Google
        </Button>
      ) : null}
      <p className="t-caption text-fg-3">La app sigue funcionando igual sin cuenta y sin conexión.</p>
    </FlowShell>
  )
}
