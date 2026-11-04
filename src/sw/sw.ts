/// <reference lib="webworker" />
/**
 * Service worker (tech §4, Serwist con Turbopack, P-23). Precache del app shell, las fuentes,
 * los íconos y las páginas que Brew Mode necesita sin conexión; el resto con la caché por
 * defecto de Serwist (red primero para páginas, caché para estáticos).
 */
import { defaultCache } from '@serwist/turbopack/worker'
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // Las páginas leen su estado de la URL en el cliente (?v=, ?id=, ?cafe=): una sola entrada precacheada por ruta
  precacheOptions: { ignoreURLParametersMatching: [/.*/] },
})

serwist.addEventListeners()
