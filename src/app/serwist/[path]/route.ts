import { randomUUID } from 'node:crypto'
import { createSerwistRoute } from '@serwist/turbopack'
import { SEED_IDS } from '@/lib/recipes'

// Una revisión por build: cada despliegue renueva el precache de las páginas
const revision = randomUUID()

/** Páginas que deben abrir en modo avión tras la primera visita (DS §4.3, fase 2) */
const OFFLINE_PAGES = [
  '/',
  ...SEED_IDS.map((id) => `/brew-mode/${id}`),
  // Fase 3: flujo completo sin conexión (los parámetros de la URL se ignoran en el precache)
  '/brew',
  '/hacer-cafe',
  '/stock',
  '/cafe',
  '/cafe/nuevo',
  '/setup',
]

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: 'src/sw/sw.ts',
  useNativeEsbuild: true,
  additionalPrecacheEntries: OFFLINE_PAGES.map((url) => ({ url, revision })),
})
