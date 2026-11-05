import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Capturas 390×844: SHOTS=<carpeta> npm run e2e -- fase-4 */
async function shot(page: Page, name: string) {
  const dir = process.env.SHOTS
  if (dir) await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true })
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
}

/** Recorre un V60 completo y toca "Evaluar receta" */
async function brewAndEvaluate(page: Page) {
  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.clock.fastForward(3_000)
  await page.clock.runFor(100)
  await page.clock.fastForward(170_000)
  await page.clock.runFor(100)
  await page.getByRole('button', { name: 'Terminar brew' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Evaluar receta' }).click()
  await expect(page).toHaveURL(/\/evaluar\?s=/)
  await expect(page.getByRole('heading', { name: '¿Qué tal esta receta?' })).toBeVisible()
}

test.describe('Fase 4 · evaluación y aprendizaje (product §10.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-05T08:00:00') })
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test('V1 → V2 revertida → V3 bloqueada, de punta a punta', async ({ page }) => {
    // Molino configurado para que el motor pueda mover la molienda
    await page.goto('/setup')
    await page.getByRole('tab', { name: 'LEBURRY' }).click()
    await expect(page.getByText('Guardado')).toBeVisible()

    // V1 · receta base del V60: "Quedó bien" + falta dulzor → +0,5 °C
    await page.goto('/brew-mode/v60-base-v1')
    await brewAndEvaluate(page)
    await shot(page, '20-evaluar')
    await axe(page)
    await page.getByRole('radio', { name: 'Quedó bien' }).click()
    await expect(page.getByRole('heading', { name: '¿Qué le faltó?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver ajuste' })).toBeDisabled()
    await page.getByRole('button', { name: 'Falta dulzor' }).click()
    await shot(page, '21-sintomas')
    await axe(page)
    await page.getByRole('button', { name: 'Ver ajuste' }).click()
    await expect(page.getByText('Para la próxima taza')).toBeVisible()
    await expect(page.getByText('Reportaste: Quedó bien · falta dulzor')).toBeVisible()
    await expect(page.locator('dd', { hasText: '92,5' })).toBeVisible()
    await expect(page.getByText('Más temperatura extrae un poco más del café.')).toBeVisible()
    await expect(page.getByText('Basado en tu última taza de esta receta')).toBeVisible()
    await shot(page, '22-ajuste')
    await axe(page)
    await page.getByRole('button', { name: 'Usar V2 la próxima vez' }).click()

    // Home: el hero ya apunta a V2 (R1: la propuesta aceptada se prueba primero)
    await expect(page.getByRole('heading', { name: '¿Qué preparamos?' })).toBeVisible()
    await expect(page.getByText('V60 · Receta V2')).toBeVisible()
    await page.getByRole('button', { name: 'Preparar ahora' }).click()
    await expect(page).toHaveURL(/\/brew\?v=/)

    // V2 · "Le falta algo" + muy amargo → peor que V1: revertir y probar la molienda (½ paso = 1 posición)
    await brewAndEvaluate(page)
    await page.getByRole('radio', { name: 'Le falta algo' }).click()
    await page.getByRole('button', { name: 'Muy amargo' }).click()
    await page.getByRole('button', { name: 'Ver ajuste' }).click()
    await expect(page.getByText('V2 salió peor que V1. Volvemos a V1 y probamos otra cosa.')).toBeVisible()
    await expect(page.locator('dd', { hasText: '17' })).toBeVisible()
    await expect(page.getByText('Una molienda más fina extrae un poco más.')).toBeVisible()
    await shot(page, '23-revertir')
    await axe(page)
    await page.getByRole('button', { name: 'Usar V3 la próxima vez' }).click()

    // V3 · "De campeonato" → ¿Bloqueamos? → bloqueada
    await expect(page.getByText('V60 · Receta V3')).toBeVisible()
    await page.getByRole('button', { name: 'Preparar ahora' }).click()
    await brewAndEvaluate(page)
    await page.getByRole('radio', { name: 'De campeonato' }).click()
    const sheet = page.getByRole('dialog', { name: '¿Bloqueamos esta receta?' })
    await expect(sheet).toBeVisible()
    await shot(page, '24-bloquear')
    await axe(page)
    await sheet.getByRole('button', { name: 'Bloquear receta' }).click()
    await expect(page.getByRole('heading', { name: /Receta bloqueada/ })).toBeVisible()
    await page.getByRole('button', { name: 'Listo' }).click()
    await expect(page.getByRole('img', { name: 'Receta bloqueada' })).toBeVisible()
    await expect(page.getByText('V60 · Receta V3')).toBeVisible()
  })

  test('"Más tarde" deja la evaluación pendiente en Home; sin síntoma no se inventa ajuste (R8)', async ({ page }) => {
    await page.goto('/brew-mode/v60-base-v1')
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.getByRole('button', { name: 'Listo' }).click()
    await page.clock.fastForward(3_000)
    await page.clock.runFor(100)
    await page.clock.fastForward(170_000)
    await page.clock.runFor(100)
    await page.getByRole('button', { name: 'Terminar brew' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Más tarde' }).click()

    await expect(page.getByText('Tu último V60 está sin evaluar.')).toBeVisible()
    await page.getByRole('button', { name: 'Evaluar' }).click()
    await page.getByRole('radio', { name: 'Le falta algo' }).click()
    await page.getByRole('button', { name: 'Agregar nota' }).click()
    await page.getByLabel('Nota').fill('Agua del grifo')
    await page.getByRole('button', { name: 'Guardar sin ajuste' }).click()
    await expect(page.getByRole('heading', { name: '¿Qué preparamos?' })).toBeVisible()
    await expect(page.getByText('Tu último V60 está sin evaluar.')).toHaveCount(0)
  })

  test('nivel 4: el detalle va colapsado y una pista se guarda (R3)', async ({ page }) => {
    await page.goto('/brew-mode/v60-base-v1')
    await brewAndEvaluate(page)
    await page.getByRole('radio', { name: 'Muy rica' }).click()
    await expect(page.getByRole('heading', { name: '¿Algún detalle?' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Síntomas' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Agregar detalle' }).click()
    await page.getByRole('button', { name: 'Plano' }).click()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText(/Anoté «plano» como pista/)).toBeVisible()
    await axe(page)
  })
})
