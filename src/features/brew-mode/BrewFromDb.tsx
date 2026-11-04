'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components'
import { getRecipeVersion } from '@/lib/library-db'
import { getDb } from '@/lib/offline-db'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { BrewMode } from './BrewMode'

/** Carga la versión desde IndexedDB por `?v=` y abre Brew Mode */
export function BrewFromDb() {
  const id = useSearchParams().get('v')
  const router = useRouter()
  const [recipe, setRecipe] = useState<RecipeVersion | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const r = id ? await getRecipeVersion(getDb(), id) : null
      if (!cancelled) setRecipe(r)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (recipe === undefined) return <div className="min-h-dvh bg-bg" aria-busy="true" />
  if (recipe === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-5 text-center">
        <p className="t-title text-fg">No encontramos esta receta</p>
        <Button onClick={() => router.push('/hacer-cafe')}>Elegir otra receta</Button>
      </main>
    )
  }
  return <BrewMode recipe={recipe} />
}
