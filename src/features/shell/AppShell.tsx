'use client'

import type { ReactNode } from 'react'
import { BottomNav, type NavKey } from '@/components'

/** Rutas de la navegación principal (product §19). Diario sigue deshabilitado (P-01). */
export const NAV_HREFS: Partial<Record<NavKey, string>> = {
  home: '/',
  stock: '/stock',
  make: '/hacer-cafe',
  setup: '/setup',
}

/** Pantalla con BottomNav fija: Inicio, Stock y Setup */
export function AppShell({ active, children }: { active: NavKey; children: ReactNode }) {
  return (
    <>
      <main className="flex flex-col gap-6 px-5 pt-2 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+2rem)]">{children}</main>
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-(--app-max-width)">
        <BottomNav active={active} hrefs={NAV_HREFS} />
      </div>
    </>
  )
}

/** Pantalla de flujo (sin BottomNav) con CTA fija abajo */
export function FlowShell({ header, children, footer }: { header: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <main className="flex flex-col gap-6 px-5 pt-2 pb-[calc(var(--cta-height)+env(safe-area-inset-bottom)+3rem)]">
        {header}
        {children}
      </main>
      {footer ? (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-(--app-max-width) border-t border-line bg-bg px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {footer}
        </div>
      ) : null}
    </>
  )
}
