import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/** Tests contra la base local de Supabase (Docker): `npx supabase start` y luego `npm run test:cloud` */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/cloud/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
