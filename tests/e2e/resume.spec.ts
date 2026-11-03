import { expect, test } from '@playwright/test'

test('retomar tras cerrar la app: el Home ofrece "Retomar brew en m:ss" y vuelve al paso', async ({ context }) => {
  const page = await context.newPage()
  await page.goto('/brew-mode/v60-base-v1')
  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.locator('[data-status="running"]')).toBeVisible({ timeout: 6000 })
  // Espera a que el latido de 1 s persista el estado en IndexedDB
  await page.waitForTimeout(1500)
  await page.close()

  // "Reabrir la app": nueva pestaña del mismo perfil (misma IndexedDB)
  const again = await context.newPage()
  await again.goto('/')
  const banner = again.getByRole('status').filter({ hasText: 'Retomar brew en' })
  await expect(banner).toBeVisible()
  await expect(banner).toContainText(/0:0\d/)
  await banner.getByRole('button', { name: 'Retomar' }).click()
  await expect(again.locator('[data-status="running"]')).toBeVisible()
  await expect(again.getByRole('heading', { name: 'Bloom' })).toBeVisible()
  const elapsed = Number(await again.locator('[data-mode="brew"]').getAttribute('data-elapsed-ms'))
  expect(elapsed).toBeGreaterThan(1500)
})

test('un brew en pausa se retoma congelado', async ({ context }) => {
  const page = await context.newPage()
  await page.goto('/brew-mode/v60-base-v1')
  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.locator('[data-status="running"]')).toBeVisible({ timeout: 6000 })
  await page.getByRole('button', { name: 'Pausar' }).click()
  const frozen = Number(await page.locator('[data-mode="brew"]').getAttribute('data-elapsed-ms'))
  await page.waitForTimeout(1200)
  await page.close()

  const again = await context.newPage()
  await again.goto('/brew-mode/v60-base-v1')
  await expect(again.locator('[data-status="paused"]')).toBeVisible()
  const resumed = Number(await again.locator('[data-mode="brew"]').getAttribute('data-elapsed-ms'))
  expect(Math.abs(resumed - frozen)).toBeLessThan(100)
})
