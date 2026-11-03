'use client'

import { useEffect, useState } from 'react'

/**
 * Screen Wake Lock (DS §4.3): se pide al entrar, se libera al salir y se vuelve a pedir en
 * `visibilitychange`, porque el navegador lo suelta cuando la pestaña queda oculta.
 * Devuelve `failed` para mostrar un aviso discreto si el navegador lo niega.
 */
export function useWakeLock(active: boolean): { failed: boolean } {
  const [failed, setFailed] = useState(false)
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  useEffect(() => {
    if (!active || !supported) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) await sentinel.release()
        else setFailed(false)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release().catch(() => {})
    }
  }, [active, supported])

  return { failed: active && (!supported || failed) }
}
