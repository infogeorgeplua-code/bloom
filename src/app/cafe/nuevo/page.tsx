import { Suspense } from 'react'
import { CoffeeFormScreen } from '@/features/coffees/CoffeeFormScreen'

export default function NewCoffeePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy="true" />}>
      <CoffeeFormScreen />
    </Suspense>
  )
}
