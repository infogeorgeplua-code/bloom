import { expect, test } from '@playwright/test'

test('modo avión: tras la primera visita, el Home y Brew Mode abren sin red', async ({ context, page }) => {
  await page.goto('/')
  // Espera a que el service worker esté activo y controlando la página
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
    }
    return reg.active?.state
  })
  // Espera a que el precache tenga el Home y las páginas de Brew Mode (no un tiempo fijo)
  await page.waitForFunction(
    async () =>
      Boolean(
        (await caches.match('/brew-mode/aeropress-base-v1')) &&
          (await caches.match('/')) &&
          (await caches.match('/brew')) &&
          (await caches.match('/hacer-cafe')),
      ),
    undefined,
    { timeout: 20_000, polling: 250 },
  )

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: '¿Qué preparamos?' })).toBeVisible()

  await page.goto('/brew-mode/aeropress-base-v1')
  await expect(page.getByText('Tiempo objetivo')).toBeVisible()
  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.locator('[data-status="running"]')).toBeVisible({ timeout: 6000 })
  // Brew Mode nunca muestra "Sin conexión"
  await expect(page.getByText(/Sin conexión/)).toHaveCount(0)

  // Fase 3: Hacer café y las recetas guardadas en IndexedDB (`/brew?v=`) también abren sin red
  await page.goto('/hacer-cafe')
  await expect(page.getByRole('heading', { name: '¿Qué café preparas?' })).toBeVisible()
  await page.goto('/brew?v=v60-base-v1')
  await expect(page.getByText('Tiempo objetivo')).toBeVisible()
  await context.setOffline(false)
})

test('manifest instalable con íconos y colores de los tokens', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.ok()).toBe(true)
  const m = await res.json()
  expect(m).toMatchObject({ name: 'Bloom', display: 'standalone', lang: 'es', start_url: '/' })
  expect(m.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512', '512x512'])
  for (const icon of m.icons) expect((await request.get(icon.src)).ok()).toBe(true)
})
