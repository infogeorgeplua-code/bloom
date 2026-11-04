import { Suspense } from 'react'
import { CoffeeProfileScreen } from '@/features/coffees/CoffeeProfileScreen'

export default function CoffeePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy="true" />}>
      <CoffeeProfileScreen />
    </Suspense>
  )
}
