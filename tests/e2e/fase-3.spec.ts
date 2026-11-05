import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Capturas 390×844 para comparar con Figma: SHOTS=<carpeta> npm run e2e -- fase-3 */
async function shot(page: Page, name: string) {
  const dir = process.env.SHOTS
  if (dir) await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true })
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
}

test.describe('Fase 3 · café nuevo → Hacer café → Brew → stock', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-04T08:00:00') })
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test('flujo completo con inventario local', async ({ page }) => {
    // Home vacío: sin cafés, sin Stock
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '¿Qué preparamos?' })).toBeVisible()
    await expect(page.getByText('Prepara tu primer café')).toBeVisible()
    await expect(page.getByRole('button', { name: /Stock/ })).toHaveCount(0)

    // Tengo un café nuevo
    await page.getByRole('button', { name: 'Tengo un café nuevo' }).click()
    await expect(page).toHaveURL(/\/cafe\/nuevo/)
    await page.getByRole('button', { name: 'Guardar café' }).click()
    await expect(page.getByText('Ponle un nombre para reconocerlo')).toBeVisible()
    await page.getByLabel('Nombre del café').fill('El Paraíso Sidra')
    await page.getByRole('radio', { name: 'Claro' }).click()
    await page.getByRole('radio', { name: 'Anaeróbico' }).click()
    await page.getByLabel('País (opcional)').fill('Colombia')
    await page.getByLabel('Altitud del cultivo (opcional)').fill('1950')
    await page.getByLabel('Fecha de tueste (opcional)').fill('2026-10-20')
    await expect(page.getByText(/Tostado hace 15\sdías · dentro de su ventana/)).toBeVisible()
    await page.getByRole('radio', { name: '250 g' }).click()
    await shot(page, '11-cafe-nuevo')
    await axe(page)
    await page.getByRole('button', { name: 'Guardar café' }).click()

    // Perfil del café
    await expect(page).toHaveURL(/\/cafe\?id=/)
    await expect(page.getByRole('heading', { name: 'El Paraíso Sidra' })).toBeVisible()
    await expect(page.getByText('250 g · ~16 preparaciones')).toBeVisible()
    await shot(page, '12-perfil-cafe')
    await axe(page)

    // Hacer café: método → objetivo → receta del motor
    await page.getByRole('button', { name: 'Preparar este café' }).click()
    await expect(page.getByRole('heading', { name: '¿Con qué lo preparas?' })).toBeVisible()
    await page.getByRole('radio', { name: 'V60' }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page.getByRole('heading', { name: '¿Cómo quieres la taza?' })).toBeVisible()
    await page.getByRole('radio', { name: 'Dulce' }).click()
    await shot(page, '13-objetivo')
    await page.getByRole('button', { name: 'Ver receta' }).click()
    await expect(page.getByRole('heading', { name: 'Tu receta' })).toBeVisible()
    // P-14.1: 92 base +1 tueste claro = 93 °C; "Dulce" mueve solo el agua (+6 %: 254 g); proceso y altitud del cultivo no mueven °C
    await expect(page.getByText('Tueste claro: +1 °C')).toBeVisible()
    await expect(page.locator('dd', { hasText: '93' })).toBeVisible()
    await expect(page.locator('dd', { hasText: '254' })).toBeVisible()
    await expect(page.getByText('Objetivo: más agua por gramo (+6 %)')).toBeVisible()
    await expect(page.getByText('Configura tu molino para ver los clicks.', { exact: false })).toBeVisible()
    await shot(page, '14-receta')
    await axe(page)

    // Brew Mode (receta guardada en IndexedDB)
    await page.getByRole('button', { name: 'Preparar ahora' }).click()
    await expect(page).toHaveURL(/\/brew\?v=/)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.getByRole('button', { name: 'Listo' }).click()
    await page.clock.fastForward(3_000)
    await page.clock.runFor(100)
    await page.clock.fastForward(170_000)
    await page.clock.runFor(100)
    await page.getByRole('button', { name: 'Terminar brew' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Más tarde' }).click()

    // Home con datos reales: café habitual, stock descontado, recientes
    await expect(page.getByRole('heading', { name: '¿Qué preparamos?' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'El Paraíso Sidra' })).toBeVisible()
    await expect(page.getByText('V60 · Receta V1')).toBeVisible()
    await expect(page.getByText('1 café en stock')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cafés recientes' })).toBeVisible()
    await expect(page.getByRole('button', { name: /El Paraíso Sidra.*235/ })).toBeVisible()
    await shot(page, '01-home')
    await axe(page)

    // R1: la misma receta se reutiliza
    await page.goto('/hacer-cafe')
    await page.getByRole('button', { name: /El Paraíso Sidra/ }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.getByRole('radio', { name: 'Dulce' }).click()
    await page.getByRole('button', { name: 'Ver receta' }).click()
    await expect(page.getByRole('heading', { name: 'Tu receta V1' })).toBeVisible()

    // Stock y Setup
    await page.goto('/stock')
    await expect(page.getByRole('heading', { name: 'Stock' })).toBeVisible()
    await shot(page, '15-stock')
    await axe(page)
    await page.goto('/setup')
    await page.getByRole('tab', { name: 'LEBURRY' }).click()
    await expect(page.getByRole('group', { name: 'Clicks para V60' })).toBeVisible()
    await shot(page, '16-setup')
    await axe(page)
  })
})
