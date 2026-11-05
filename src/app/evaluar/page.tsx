import { Suspense } from 'react'
import { EvaluationScreen } from '@/features/evaluation/EvaluationScreen'

export default function EvaluatePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy="true" />}>
      <EvaluationScreen />
    </Suspense>
  )
}
