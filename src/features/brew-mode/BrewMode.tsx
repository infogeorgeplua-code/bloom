'use client'

/**
 * Pantalla completa del Brew Mode (DS §4.3). Orquesta: carga o retoma el brew, el botón atrás
 * de Android como ✕, y las hojas de salir y de resumen. La lógica vive en brew-machine.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banner, BottomSheet, BrewSummarySheet, Button } from '@/components'
import { formatDuration, formatNumber } from '@/lib/format'
import { getDb } from '@/lib/offline-db'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { COUNTDOWN_MS, currentElapsed, restore } from './brew-machine'
import { useBrewStore } from './brew-store'
import { firstStepText, timedView } from './step-view'
import { useBrewRuntime } from './useBrewRuntime'
import { Countdown } from './screens/Countdown'
import { Paused } from './screens/Paused'
import { PrepStep } from './screens/PrepStep'
import { Preview } from './screens/Preview'
import { TimedStep } from './screens/TimedStep'

export function BrewMode({ recipe }: { recipe: RecipeVersion }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const { clock, announcement, wakeLockFailed } = useBrewRuntime()
  const state = useBrewStore((s) => s.state)
  const now = useBrewStore((s) => s.nowEpochMs)
  const dispatch = useBrewStore((s) => s.dispatch)

  // Cargar o retomar (SDD §3.4)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const store = useBrewStore.getState()
      const rec = await getDb().activeBrew.get('current')
      const t = clock.nowEpochMs()
      if (rec && rec.versionId === recipe.id) {
        const r = restore(rec, recipe.params, t)
        if (r.kind === 'offer') {
          store.setRecipe(recipe, r.state)
          store.setNow(t)
          if (!cancelled) setReady(true)
          return
        }
      }
      store.setRecipe(recipe)
      store.dispatch({ type: 'LOAD', versionId: recipe.id })
      store.setNow(t)
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [recipe, clock])

  const active = ['prep', 'countdown', 'running', 'paused'].includes(state.status)

  // Botón atrás de Android = ✕ con confirmación (DS §4.3)
  useEffect(() => {
    if (!active) return
    window.history.pushState({ brew: true }, '')
    const onPop = () => {
      setExitOpen(true)
      window.history.pushState({ brew: true }, '')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [active])

  const goHome = () => router.push('/')
  const nowMs = () => clock.nowEpochMs()

  if (!ready) return <div className="min-h-dvh bg-bg" aria-busy="true" />

  const p = recipe.params
  const elapsed = currentElapsed(state, now)
  let screen: React.ReactNode = null

  switch (state.status) {
    case 'idle':
    case 'preview':
      screen = <Preview recipe={recipe} onBack={goHome} onStart={() => dispatch({ type: 'START', nowEpochMs: nowMs() })} />
      break
    case 'prep':
      screen = (
        <PrepStep
          recipe={recipe}
          prepIndex={state.prepIndex}
          onClose={() => setExitOpen(true)}
          onDone={() => dispatch({ type: 'PREP_DONE', nowEpochMs: nowMs() })}
        />
      )
      break
    case 'countdown': {
      const left = Math.max(1, Math.ceil((COUNTDOWN_MS - (now - (state.countdownStartedAtEpochMs ?? now))) / 1000))
      screen = <Countdown seconds={left} firstStep={firstStepText(p, recipe.method)} onCancel={() => dispatch({ type: 'CANCEL_COUNTDOWN' })} />
      break
    }
    case 'running':
    case 'paused':
    case 'finished': {
      const view = timedView(p, elapsed, recipe.method)
      screen = (
        <>
          <TimedStep
            recipe={recipe}
            view={view}
            elapsedMs={elapsed}
            paused={state.status === 'paused'}
            onExit={() => setExitOpen(true)}
            onPause={() => dispatch({ type: 'PAUSE', nowEpochMs: nowMs() })}
            onFinish={() => dispatch({ type: 'FINISH', nowEpochMs: nowMs(), sessionId: crypto.randomUUID() })}
          />
          {state.status === 'paused' ? (
            <Paused
              elapsedMs={elapsed}
              stepLabel={`${view.step.name} · paso ${view.index + 1} de ${p.steps.length}`}
              onContinue={() => dispatch({ type: 'RESUME', nowEpochMs: nowMs() })}
              onNext={() => dispatch({ type: 'NEXT_STEP', nowEpochMs: nowMs(), sessionId: crypto.randomUUID() })}
              onRestart={() => dispatch({ type: 'RESTART_STEP', nowEpochMs: nowMs() })}
            />
          ) : null}
        </>
      )
      break
    }
    case 'abandoned':
      screen = <div className="min-h-dvh bg-bg" />
      break
  }

  return (
    <div data-mode="brew" data-status={state.status} data-elapsed-ms={Math.round(elapsed)} className="relative min-h-dvh bg-bg">
      {wakeLockFailed && active ? (
        <div className="px-5 pt-2">
          <Banner tone="neutral">No pudimos mantener la pantalla encendida. Revisa el ahorro de batería.</Banner>
        </div>
      ) : null}
      {screen}
      <p aria-live="assertive" className="sr-only-text">
        {announcement}
      </p>

      <BottomSheet
        open={exitOpen}
        onOpenChange={setExitOpen}
        title="¿Salir del brew?"
        description="Perderás el progreso de esta preparación."
      >
        <Button size="lg" fullWidth onClick={() => setExitOpen(false)}>
          Seguir preparando
        </Button>
        <Button
          variant="danger"
          size="lg"
          fullWidth
          onClick={() => {
            dispatch({ type: 'ABANDON' })
            setExitOpen(false)
            goHome()
          }}
        >
          Salir
        </Button>
      </BottomSheet>

      <BrewSummarySheet
        open={state.status === 'finished'}
        totalText={formatDuration((state.finishedElapsedMs ?? 0) / 1000)}
        coffeeG={formatNumber(p.doseG)}
        waterG={formatNumber(p.waterG)}
        tempC={formatNumber(p.tempC)}
        evaluateDisabled
        onEvaluate={() => {}}
        onLater={goHome}
      />
    </div>
  )
}
