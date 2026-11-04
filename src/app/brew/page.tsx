import { Suspense } from 'react'
import { BrewFromDb } from '@/features/brew-mode/BrewFromDb'

/** Brew Mode para recetas guardadas en IndexedDB (motor, fase 3). Precacheada: abre sin conexión. */
export default function BrewPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" aria-busy="true" />}>
      <BrewFromDb />
    </Suspense>
  )
}
