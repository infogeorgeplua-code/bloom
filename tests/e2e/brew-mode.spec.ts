import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Avanza el reloj falso. El timer se deriva de timestamps, así que basta con saltar el tiempo
 * y dejar correr unos frames para que la pantalla se actualice.
 */
async function advance(page: Page, seconds: number) {
  await page.clock.fastForward(seconds * 1000)
  await page.clock.runFor(100)
}

async function startTimed(page: Page, id: string, preps: number) {
  await page.goto(`/brew-mode/${id}`)
  await page.getByRole('button', { name: 'Empezar' }).click()
  for (let i = 0; i < preps; i++) await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Empieza en', { exact: true })).toBeVisible()
  await advance(page, 3)
  await expect(page.locator('[data-status="running"]')).toBeVisible()
}

test.describe('Brew Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-03T08:00:00') })
  })

  test('V60 completo: vista previa → prep → 3-2-1 → pasos → "Terminar brew" → resumen → Home', async ({ page }) => {
    await page.goto('/brew-mode/v60-base-v1')
    await expect(page.getByText('Tiempo objetivo')).toBeVisible()
    await expect(page.getByText('2:40 – 3:00').first()).toBeVisible()
    await expect(page.getByRole('list', { name: 'Pasos de la receta' }).getByRole('listitem')).toHaveCount(6)

    await page.getByRole('button', { name: 'Empezar' }).click()
    await expect(page.getByRole('heading', { name: 'Prepara' })).toBeVisible()
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Paso 1 de 6')
    await page.getByRole('button', { name: 'Listo' }).click()

    await expect(page.getByText('Primer paso: vierte 45 g de agua a 92 °C')).toBeVisible()
    await advance(page, 3)
    await expect(page.getByRole('heading', { name: 'Bloom' })).toBeVisible()
    await expect(page.getByText('Vierte agua hasta', { exact: true })).toBeVisible()
    await expect(page.getByText('Paso 2 de 6')).toBeVisible()

    // Últimos 3 s antes del vertido 1 (P-06)
    await advance(page, 42)
    await expect(page.getByText(/Cambia en \d s/)).toBeVisible()
    await advance(page, 3)
    await expect(page.getByRole('heading', { name: 'Primer vertido' })).toBeVisible()
    await expect(page.getByText('Segundo vertido → 200 g de agua')).toBeVisible()

    // Tocar la pantalla no pausa
    await page.getByRole('heading', { name: 'Primer vertido' }).click()
    await expect(page.locator('[data-status="running"]')).toBeVisible()

    // Último paso: no termina solo (D-17)
    await advance(page, 110)
    await expect(page.getByRole('heading', { name: 'Decantación' })).toBeVisible()
    await expect(page.getByText('En la ventana objetivo')).toBeVisible()
    await advance(page, 60)
    await expect(page.locator('[data-status="running"]')).toBeVisible()
    await expect(page.getByText(/sobre la meta/)).toBeVisible()

    await page.getByRole('button', { name: 'Terminar brew' }).click()
    const sheet = page.getByRole('dialog', { name: 'Tu café está listo' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByText('Temp.')).toBeVisible()
    await expect(sheet.getByRole('button', { name: 'Evaluar receta' })).toBeDisabled()
    await sheet.getByRole('button', { name: 'Más tarde' }).click()

    // El Home refleja el brew recién terminado
    await expect(page.getByRole('heading', { name: '¿Qué preparamos?' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'V60 · receta base' })).toBeVisible()
    await expect(page.getByText('100% del mes')).toBeVisible()
  })

  test('pausa: congela el timer y permite continuar, saltar o reiniciar', async ({ page }) => {
    await startTimed(page, 'v60-base-v1', 1)
    await advance(page, 10)
    await page.getByRole('button', { name: 'Pausar' }).click()
    const paused = page.getByRole('dialog', { name: 'Brew pausado' })
    await expect(paused.getByText('El timer está congelado')).toBeVisible()
    const frozen = await page.locator('[data-mode="brew"]').getAttribute('data-elapsed-ms')
    await advance(page, 5)
    await expect(page.locator('[data-mode="brew"]')).toHaveAttribute('data-elapsed-ms', frozen!)
    await paused.getByRole('button', { name: 'Siguiente paso' }).click()
    await expect(page.getByRole('heading', { name: 'Primer vertido' })).toBeVisible()
  })

  test('espresso: dos pasos prep, aviso de calibración y extracción que terminas tú', async ({ page }) => {
    await page.goto('/brew-mode/espresso-base-v1')
    await expect(page.getByText(/requiere calibración/)).toBeVisible()
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.getByRole('button', { name: 'Listo' }).click()
    await expect(page.getByRole('heading', { name: 'Distribuye y tampea' })).toBeVisible()
    await page.getByRole('button', { name: 'Listo' }).click()
    await advance(page, 3)
    await expect(page.getByRole('heading', { name: 'Pre-infusión' })).toBeVisible()
    await advance(page, 9)
    await expect(page.getByRole('heading', { name: 'Extracción' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Terminar brew' })).toBeVisible()
  })

  test('AeroPress: cada paso con tiempo muestra su propósito (P-13)', async ({ page }) => {
    await startTimed(page, 'aeropress-base-v1', 1)
    await expect(page.getByText(/Hidrata el café/)).toBeVisible()
    await advance(page, 31)
    await expect(page.getByText(/satura todo el café/)).toBeVisible()
    await advance(page, 20)
    await expect(page.getByText(/Inmersión completa/)).toBeVisible()
    await advance(page, 40)
    await expect(page.getByRole('heading', { name: 'Presiona' })).toBeVisible()
  })

  test('botón atrás de Android = ✕ con confirmación; "Salir" vuelve al Home', async ({ page }) => {
    await startTimed(page, 'v60-base-v1', 1)
    await page.goBack()
    const exit = page.getByRole('dialog', { name: '¿Salir del brew?' })
    await expect(exit).toBeVisible()
    await exit.getByRole('button', { name: 'Seguir preparando' }).click()
    await expect(page.locator('[data-status="running"]')).toBeVisible()
    await page.getByRole('button', { name: 'Salir del brew' }).click()
    await page.getByRole('dialog', { name: '¿Salir del brew?' }).getByRole('button', { name: 'Salir' }).click()
    await expect(page.getByRole('heading', { name: '¿Qué preparamos?' })).toBeVisible()
  })

  test('accesibilidad: sin violaciones en vista previa y paso con tiempo', async ({ page }) => {
    await page.goto('/brew-mode/v60-base-v1')
    let r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 2).join(' | ')}`)).toEqual([])
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.getByRole('button', { name: 'Listo' }).click()
    await advance(page, 3)
    // La entrada del paso es un fade (dur-slow, en tiempo real): axe mide el contraste al terminar
    await page.waitForTimeout(600)
    r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 2).join(' | ')}`)).toEqual([])
  })
})
