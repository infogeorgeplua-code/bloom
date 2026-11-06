import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

async function axe(page: import('@playwright/test').Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
}

test.describe('Fase 5 · cuenta opcional', () => {
  test.beforeEach(async ({ page }) => page.setViewportSize({ width: 390, height: 844 }))

  test('Setup ofrece entrar; "Entrar" pide el correo y confirma el envío', async ({ page }) => {
    // Nunca se toca el proyecto real: la llamada de envío del enlace se responde aquí
    let otpCalls = 0
    await page.route('**/auth/v1/otp**', async (route) => {
      otpCalls++
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.goto('/setup')
    const cuenta = page.getByRole('region', { name: 'Cuenta' })
    await expect(cuenta.getByText('Guarda tus cafés, recetas y brews en la nube')).toBeVisible()
    await axe(page)
    await cuenta.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/entrar/)
    await expect(page.getByRole('heading', { name: 'Guarda tu café en la nube' })).toBeVisible()
    await axe(page)
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page.getByText('Escribe un correo válido')).toBeVisible()
    await page.getByLabel('Correo').fill('george@example.com')
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible()
    expect(otpCalls).toBe(1)
  })

  test('el enlace vencido vuelve a "Entrar" con aviso', async ({ page }) => {
    await page.goto('/auth/callback?code=no-valido')
    await expect(page).toHaveURL(/\/entrar\?error=1/)
    await expect(page.getByText('El enlace venció o ya se usó. Pide uno nuevo.')).toBeVisible()
  })
})
