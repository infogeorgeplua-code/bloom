import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { BloomDB, ensureSeed, type BrewSessionRecord } from '@/lib/offline-db'
import { createCoffee, findActiveVersion, saveBrewSession, saveEngineVersion, saveSetup } from '@/lib/library-db'
import {
  acceptProposal,
  evaluateBrew,
  loadRecipeHistory,
  lockVersion,
  nextVersionFor,
  pendingEvaluation,
  unlockVersion,
} from '@/lib/evaluation-db'
import { generateRecipe } from '@/features/recipes/recipe-engine'
import { LEBURRY_38, setupFromPreset } from '@/features/recipes/grinders'
import type { RatingLevel, Symptom } from '@/lib/schemas/evaluation'

let n = 0
let db: BloomDB
const fresh = () => (db = new BloomDB(`bloom-eval-${++n}`))
afterEach(() => db?.close())

const TODAY = '2026-11-04'
const SETUP = { grinder: setupFromPreset(LEBURRY_38), brewAltitudeM: null }
const COFFEE = {
  name: 'Finca Prueba', roaster: null, originCountry: 'Ecuador', variety: null,
  process: 'lavado' as const, roastLevel: 'medio' as const, roastDateISO: '2026-10-20', altitudeM: null,
}
let t = 100
const session = (versionId: string): BrewSessionRecord => ({
  id: `s${++t}`, versionId, method: 'v60', coffeeId: null, bagId: null, startedAtEpochMs: t, finishedAtEpochMs: ++t,
  gramsUsed: 15, durationS: 170, outcome: 'completed', rating: null, symptoms: [], notes: null, syncState: 'local',
})

async function brewAndRate(versionId: string, rating: RatingLevel, symptoms: Symptom[] = []) {
  const s = session(versionId)
  await saveBrewSession(db, s)
  return evaluateBrew(db, { sessionId: s.id, rating, symptoms, notes: null, todayISO: TODAY })
}

async function setupCoffee() {
  fresh()
  await ensureSeed(db, 1)
  await saveSetup(db, SETUP)
  const coffeeId = await createCoffee(db, COFFEE, 250, 10)
  const coffee = (await db.coffees.get(coffeeId))!
  const out = generateRecipe({ method: 'v60', objective: 'equilibrado', coffee, setup: SETUP, todayISO: TODAY })
  const v1 = await saveEngineVersion(db, { coffee, method: 'v60', objective: 'equilibrado', output: out, nowEpochMs: 20 })
  return { coffeeId, v1 }
}

describe('evaluación de punta a punta en IndexedDB (V1 → V2 revertida → V3 ⭐)', () => {
  it('guarda calificaciones, versiones, revierte y bloquea', async () => {
    const { coffeeId, v1 } = await setupCoffee()
    expect((await db.recipes.get(v1))?.engineVersion).toBe('P-14.1')

    // V1 "Quedó bien" + falta dulzor → +0,5 °C
    const r1 = await brewAndRate(v1, 3, ['falta_dulzor'])
    expect(r1?.outcome.kind).toBe('propose')
    expect(r1?.nextNumber).toBe(2)
    expect(r1?.evaluatedCount).toBe(1)
    if (r1?.outcome.kind !== 'propose') return
    const v2 = await acceptProposal(db, { base: r1.outcome.base, changes: r1.outcome.changes, meta: r1.outcome.meta, nowEpochMs: 30 })
    expect(await db.recipes.get(v2)).toMatchObject({ number: 2, parentVersionId: v1, params: { tempC: 92.5 }, traceability: { kind: 'historial' } })
    expect((await nextVersionFor(db, v1))?.id).toBe(v2)
    expect((await findActiveVersion(db, coffeeId, 'v60', 'equilibrado'))?.id).toBe(v2)

    // V2 peor → revertida; la propuesta es medio paso más fino (1 posición del LEBURRY)
    const r2 = await brewAndRate(v2, 2, ['muy_amargo'])
    expect(r2?.outcome.kind).toBe('revert')
    expect((await db.recipes.get(v2))?.status).toBe('reverted')
    if (r2?.outcome.kind !== 'revert' || !r2.outcome.meta) return
    expect(r2.outcome.changes).toEqual([{ variable: 'grindClicks', before: 15, after: 14, stepId: null }])
    expect((await nextVersionFor(db, v2))?.id).toBe(v1) // sin aceptar, vuelve a V1
    const v3 = await acceptProposal(db, { base: r2.outcome.base, changes: r2.outcome.changes, meta: r2.outcome.meta, nowEpochMs: 40 })
    expect(await db.recipes.get(v3)).toMatchObject({ number: 3, parentVersionId: v1, params: { tempC: 92, grind: { clicks: 14 } } })

    expect((await brewAndRate(v3, 4))?.outcome).toEqual({ kind: 'keep', hint: null })
    expect((await brewAndRate(v3, 5))?.outcome).toEqual({ kind: 'lock_proposal', versionId: v3 })
    await lockVersion(db, v3, 50)
    expect(await db.recipes.get(v3)).toMatchObject({ status: 'locked', lockedAtEpochMs: 50 })
    expect((await nextVersionFor(db, v1))?.id).toBe(v3)

    // Calificación guardada en el brew
    const rated = (await db.brewSessions.toArray()).filter((s) => s.rating !== null)
    expect(rated.map((s) => s.rating)).toEqual([3, 2, 4, 5])
    expect(rated[0]?.symptoms).toEqual(['falta_dulzor'])

    // Historial por café (product §10.5)
    const [h] = await loadRecipeHistory(db, coffeeId)
    expect(h?.versions.map((v) => [v.number, v.status, v.avg])).toEqual([
      [1, 'active', 3],
      [2, 'reverted', 2],
      [3, 'locked', 4.5],
    ])

    // R7: dos tazas flojas seguidas sobre la bloqueada → sugerir desbloquear
    await brewAndRate(v3, 3)
    const r7 = await brewAndRate(v3, 2)
    expect(r7?.outcome).toEqual({ kind: 'unlock_suggestion', versionId: v3, daysSinceRoast: 15 })
    await unlockVersion(db, v3)
    expect((await db.recipes.get(v3))?.status).toBe('active')
  })

  it('bloquear una nueva desbloquea la anterior', async () => {
    const { v1 } = await setupCoffee()
    const r = await brewAndRate(v1, 2, ['muy_amargo'])
    if (r?.outcome.kind !== 'propose') throw new Error('se esperaba propuesta')
    const v2 = await acceptProposal(db, { base: r.outcome.base, changes: r.outcome.changes, meta: r.outcome.meta })
    await lockVersion(db, v1, 1)
    await lockVersion(db, v2, 2)
    expect((await db.recipes.get(v1))?.status).toBe('active')
    expect((await db.recipes.get(v2))?.status).toBe('locked')
  })
})

describe('recetas base (seed) y motor anterior', () => {
  it('evaluar una receta base crea versiones dentro de la misma receta', async () => {
    fresh()
    await ensureSeed(db, 1)
    const r = await brewAndRate('v60-base-v1', 2, ['muy_intenso'])
    if (r?.outcome.kind !== 'propose') throw new Error('se esperaba propuesta')
    const v2 = await acceptProposal(db, { base: r.outcome.base, changes: r.outcome.changes, meta: r.outcome.meta })
    expect(await db.recipes.get(v2)).toMatchObject({ recipeId: 'v60-base', number: 2, params: { waterG: 250 } })
    expect((await nextVersionFor(db, 'v60-base-v1'))?.id).toBe(v2)
  })

  it('receta base preparada sin pasar por el Home (seed aún no en IndexedDB): la propuesta es V2 y gana después', async () => {
    fresh()
    const r = await brewAndRate('v60-base-v1', 3, ['falta_dulzor'])
    expect(r?.nextNumber).toBe(2)
    if (r?.outcome.kind !== 'propose') throw new Error('se esperaba propuesta')
    const v2 = await acceptProposal(db, { base: r.outcome.base, changes: r.outcome.changes, meta: r.outcome.meta, nowEpochMs: 5 })
    expect((await db.recipes.get(v2))?.number).toBe(2)
    await db.meta.delete('seedVersion') // simula una actualización del seed
    await ensureSeed(db, 999)
    expect((await nextVersionFor(db, 'v60-base-v1'))?.id).toBe(v2)
  })

  it('actualizar el seed conserva el bloqueo y la fecha de una receta base', async () => {
    fresh()
    await ensureSeed(db, 1)
    await lockVersion(db, 'v60-base-v1', 7)
    await db.meta.delete('seedVersion')
    await ensureSeed(db, 999)
    expect(await db.recipes.get('v60-base-v1')).toMatchObject({ status: 'locked', lockedAtEpochMs: 7, createdAtEpochMs: 1 })
  })

  it('una V1 del motor P-14 sin evaluar no se reutiliza; con brews evaluados sí', async () => {
    const { coffeeId, v1 } = await setupCoffee()
    await db.recipes.update(v1, { engineVersion: null })
    expect(await findActiveVersion(db, coffeeId, 'v60', 'equilibrado')).toBeNull()
    await brewAndRate(v1, 4)
    expect((await findActiveVersion(db, coffeeId, 'v60', 'equilibrado'))?.id).toBe(v1)
  })
})

describe('evaluación pendiente en Home', () => {
  it('el último brew sin evaluar de las últimas 24 h', async () => {
    fresh()
    const s = session('v60-base-v1')
    await saveBrewSession(db, s)
    expect((await pendingEvaluation(db, s.finishedAtEpochMs + 1000))?.id).toBe(s.id)
    expect(await pendingEvaluation(db, s.finishedAtEpochMs + 25 * 3_600_000)).toBeNull()
    await evaluateBrew(db, { sessionId: s.id, rating: 4, symptoms: [], notes: 'rica', todayISO: TODAY })
    expect(await pendingEvaluation(db, s.finishedAtEpochMs + 1000)).toBeNull()
    expect((await db.brewSessions.get(s.id))?.notes).toBe('rica')
  })
})
