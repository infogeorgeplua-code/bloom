import type { MetadataRoute } from 'next'
import { appBackground } from '@/lib/brand-colors'

export const dynamic = 'force-static'

/** Manifest de la PWA (tech §4). Colores leídos de tokens.css (P-09); íconos del logo de George. */
export default function manifest(): MetadataRoute.Manifest {
  const bg = appBackground()
  return {
    name: 'Bloom',
    short_name: 'Bloom',
    description: 'Copiloto de café de especialidad',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: bg,
    theme_color: bg,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
