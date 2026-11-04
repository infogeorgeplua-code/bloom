'use client'

/**
 * Conecta la máquina con el navegador: loop de rAF (TICK por timestamps), latido de
 * persistencia cada 1 s (D-08), efectos (IndexedDB, vibración, anuncios) y wake lock.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { saveBrewSession } from '@/lib/library-db'
import { getDb, getHapticsEnabled } from '@/lib/offline-db'
import { createClock } from './brew-clock'
import { toRecord, type BrewState } from './brew-machine'
import { useBrewStore } from './brew-store'
import { vibrate } from './haptics'
import { useWakeLock } from './useWakeLock'

const LIVE: BrewState['status'][] = ['countdown', 'running', 'paused']
const ACTIVE: BrewState['status'][] = ['prep', 'countdown', 'running', 'paused']

export function useBrewRuntime() {
  const clock = useMemo(() => createClock(), [])
  const status = useBrewStore((s) => s.state.status)
  const [announcement, setAnnouncement] = useState('')
  const haptics = useRef(true)

  // Preferencia de vibración (Setup temporal del Home)
  useEffect(() => {
    void getHapticsEnabled(getDb()).then((v) => {
      haptics.current = v
    })
  }, [])

  // Efectos que devuelve la máquina
  useEffect(() => {
    const db = getDb()
    useBrewStore.getState().setHandlers({
      run: (effects, state) => {
        for (const fx of effects) {
          switch (fx.type) {
            case 'haptic':
              vibrate(fx.kind, haptics.current)
              break
            case 'announce':
              setAnnouncement(fx.text)
              break
            case 'persist': {
              const rec = toRecord(state, clock.nowEpochMs())
              if (rec) void db.activeBrew.put(rec)
              break
            }
            case 'clearPersisted':
              void db.activeBrew.delete('current')
              break
            case 'saveSession':
              // Vincula el brew al café y a su bolsa activa: el stock se descuenta solo
              void saveBrewSession(db, fx.session)
              break
            case 'wakeLock':
              // El wake lock se deriva del estado (abajo); el efecto queda como registro
              break
          }
        }
      },
    })
    return () => useBrewStore.getState().setHandlers(null)
  }, [clock])

  // Loop de rAF: el tiempo sale de timestamps; si la pestaña se oculta y vuelve, se recalcula
  useEffect(() => {
    if (!LIVE.includes(status)) return
    let raf = 0
    const loop = () => {
      const now = clock.nowEpochMs()
      const { setNow, dispatch } = useBrewStore.getState()
      setNow(now)
      dispatch({ type: 'TICK', nowEpochMs: now })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [status, clock])

  // Latido de persistencia cada 1 s mientras el brew está activo (D-08)
  useEffect(() => {
    if (!ACTIVE.includes(status)) return
    const db = getDb()
    const id = window.setInterval(() => {
      const rec = toRecord(useBrewStore.getState().state, clock.nowEpochMs())
      if (rec) void db.activeBrew.put(rec)
    }, 1000)
    return () => window.clearInterval(id)
  }, [status, clock])

  // Wake lock mientras el brew está activo, también al retomar sin pasar por START
  const { failed: wakeLockFailed } = useWakeLock(ACTIVE.includes(status))

  return { clock, announcement, wakeLockFailed }
}
