import { expect, test } from '@playwright/test'

/**
 * Deriva real del timer: 3 minutos de reloj real (DS §9.4). No corre en `npm run e2e`;
 * se lanza con `npm run e2e:drift`.
 */
test('@drift el timer no deriva más de 100 ms en 3 min reales', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/brew-mode/v60-base-v1')
  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  const brew = page.locator('[data-mode="brew"]')
  await expect(page.locator('[data-status="running"]')).toBeVisible({ timeout: 6000 })

  const sample = () =>
    page.evaluate(() => ({
      app: Number(document.querySelector('[data-mode="brew"]')!.getAttribute('data-elapsed-ms')),
      real: performance.now(),
    }))

  const first = await sample()
  let maxDrift = 0
  for (let i = 0; i < 18; i++) {
    await page.waitForTimeout(10_000)
    const s = await sample()
    // El atributo se actualiza por frame (~16 ms): se descuenta un frame de margen
    maxDrift = Math.max(maxDrift, Math.abs(s.app - first.app - (s.real - first.real)))
  }
  console.log(`Deriva máxima en 3 min: ${maxDrift.toFixed(1)} ms`)
  expect(maxDrift).toBeLessThan(100)
  await expect(brew).toBeVisible()
})
