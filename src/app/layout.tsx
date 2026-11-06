import type { Metadata, Viewport } from 'next'
import { SerwistProvider } from '@serwist/turbopack/react'
import { appBackground } from '@/lib/brand-colors'
import { SyncAgent } from '@/features/account/SyncAgent'
import '@/styles/tailwind.css'
import '@/styles/fonts.css'
import '@/styles/base.css'

export const metadata: Metadata = {
  title: 'Bloom',
  description: 'Copiloto de café de especialidad',
  applicationName: 'Bloom',
  appleWebApp: { capable: true, title: 'Bloom', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark light',
  // Barra del sistema con el fondo de la app; el color sale de tokens.css (P-09)
  themeColor: appBackground(),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Geist Mono (peso 300) es la fuente del timer: se precarga */}
        <link rel="preload" href="/fonts/GeistMono-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        {/* El service worker solo en producción: en desarrollo cachearía código viejo */}
        {/* reloadOnOnline apagado: recargar al volver la señal cortaría un brew en curso (Brew Mode no depende de la red) */}
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== 'production'} reloadOnOnline={false}>
          <div className="app-shell">{children}</div>
          {/* Fase 5: sincroniza en segundo plano si hay sesión; sin sesión o sin red no hace nada */}
          <SyncAgent />
        </SerwistProvider>
      </body>
    </html>
  )
}
