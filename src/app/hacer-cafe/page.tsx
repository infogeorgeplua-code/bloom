import { Suspense } from 'react'
import { MakeCoffeeScreen } from '@/features/recipes/MakeCoffeeScreen'

export default function MakeCoffeePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy="true" />}>
      <MakeCoffeeScreen />
    </Suspense>
  )
}
