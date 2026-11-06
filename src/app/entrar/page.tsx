import { Suspense } from 'react'
import { SignInScreen } from '@/features/account/SignInScreen'

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy="true" />}>
      <SignInScreen />
    </Suspense>
  )
}
