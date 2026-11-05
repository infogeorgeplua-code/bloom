/**
 * Evaluación y aprendizaje en IndexedDB (fase 4): guardar la calificación, correr el motor de
 * ajuste, crear la versión nueva, revertir, bloquear. La lógica vive en features/evaluation.
 */
import {
  applyChanges,
  bestStart,
  proposeAdjustment,
  type AdjustOutcome,
  type AdjustVersion,
  type EvaluatedBrew,
} from '@/features/evaluation/brew-adjust'
import { seedRecipe } from '@/lib/recipes'
import { Symptom, type AdjustChange, type AdjustMeta, type RatingLevel } from '@/lib/schemas/evaluation'
import type { Method, RecipeVersion } from '@/lib/schemas/recipe-seed'
import { getSetup } from './library-db'
import { ensureSeed, type BloomDB, type BrewSessionRecord, type RecipeVersionRecord } from './offline-db'

const uuid = () => crypto.randomUUID()

/** Brews evaluados (con calificación) de un conjunto de versiones, del más viejo al más nuevo */
export async function evaluatedBrews(db: BloomDB, versionIds: string[]): Promise<EvaluatedBrew[]> {
  if (!versionIds.length) return []
  const rows = await db.brewSessions.where('versionId').anyOf(versionIds).toArray()
  return rows
    .filter((b): b is BrewSessionRecord & { rating: RatingLevel } => b.rating !== null && b.outcome === 'completed')
    .map((b) => ({
      sessionId: b.id,
      versionId: b.versionId,
      rating: b.rating,
      symptoms: b.symptoms.filter((x): x is Symptom => Symptom.safeParse(x).success),
      finishedAtEpochMs: b.finishedAtEpochMs,
    }))
    .sort((a, b) => a.finishedAtEpochMs - b.finishedAtEpochMs)
}

/** Una versión (IndexedDB o seed) con todas las versiones de su receta y sus brews evaluados */
export async function loadLineage(db: BloomDB, versionId: string) {
  const seed = seedRecipe(versionId)
  const row: AdjustVersion | null = (await db.recipes.get(versionId)) ?? (seed ? { ...seed, createdAtEpochMs: 0 } : null)
  if (!row) return null
  const versions: AdjustVersion[] = await db.recipes.where('recipeId').equals(row.recipeId).toArray()
  if (!versions.some((v) => v.id === row.id)) versions.push(row)
  const history = await evaluatedBrews(db, versions.map((v) => v.id))
  return { current: versions.find((v) => v.id === row.id) ?? row, versions, history }
}

export interface EvaluationResult {
  outcome: AdjustOutcome
  current: AdjustVersion
  /** Brews evaluados de esta receta, incluido este ("Basado en tus últimas N tazas") */
  evaluatedCount: number
  /** Número que tendría la versión nueva si aceptas la propuesta */
  nextNumber: number
}

/**
 * Guarda la calificación del brew y corre el motor de ajuste. Si la versión salió peor que su
 * padre (R6) queda revertida aquí mismo; la versión nueva solo se crea si aceptas (acceptProposal).
 */
export async function evaluateBrew(
  db: BloomDB,
  args: { sessionId: string; rating: RatingLevel; symptoms: Symptom[]; notes: string | null; todayISO: string },
): Promise<EvaluationResult | null> {
  const session = await db.brewSessions.get(args.sessionId)
  if (!session) return null
  // Una receta base preparada sin pasar por el Home aún no está en IndexedDB
  await ensureSeed(db, Date.now())
  await db.brewSessions.update(session.id, { rating: args.rating, symptoms: args.symptoms, notes: args.notes })
  const lineage = await loadLineage(db, session.versionId)
  if (!lineage) return null
  const { current, versions, history } = lineage
  const latest = history.find((b) => b.sessionId === session.id)
  if (!latest) return null
  const [setup, coffee] = await Promise.all([getSetup(db), current.coffeeId ? db.coffees.get(current.coffeeId) : undefined])
  const outcome = proposeAdjustment({
    current,
    versions,
    history,
    latest,
    ctx: { method: current.method, grinder: setup.grinder, prepAltitudeM: setup.brewAltitudeM },
    roastDateISO: coffee?.roastDateISO ?? null,
    todayISO: args.todayISO,
  })
  if (outcome.kind === 'revert' && (await db.recipes.get(outcome.revertedVersionId))) {
    await db.recipes.update(outcome.revertedVersionId, { status: 'reverted' })
  }
  return {
    outcome,
    current,
    evaluatedCount: history.length,
    nextNumber: Math.max(0, ...versions.map((v) => v.number)) + 1,
  }
}

/** "Usar Vn la próxima vez": crea la versión nueva, hija de la base, con los cambios aplicados */
export async function acceptProposal(
  db: BloomDB,
  args: { base: AdjustVersion; changes: AdjustChange[]; meta: AdjustMeta; nowEpochMs?: number },
): Promise<string> {
  const { base, changes, meta, nowEpochMs = Date.now() } = args
  await ensureSeed(db, nowEpochMs)
  const siblings = await db.recipes.where('recipeId').equals(base.recipeId).toArray()
  const id = uuid()
  await db.recipes.add({
    id,
    recipeId: base.recipeId,
    number: Math.max(0, ...siblings.map((r) => r.number)) + 1,
    parentVersionId: base.id,
    status: 'active',
    method: base.method,
    objective: base.objective,
    coffeeId: base.coffeeId,
    source: 'engine',
    seedVersion: null,
    name: base.name,
    params: applyChanges(base.params, changes, base.method),
    traceability: {
      kind: 'historial',
      label: 'Ajustada con tus calificaciones de esta receta',
      status: 'observado',
      url: null,
      year: null,
      championRef: null,
    },
    engineVersion: base.engineVersion ?? null,
    adjustMeta: meta,
    lockedAtEpochMs: null,
    createdAtEpochMs: nowEpochMs,
  })
  return id
}

/** R2: bloquea la versión (una sola bloqueada por receta) */
export async function lockVersion(db: BloomDB, versionId: string, nowEpochMs = Date.now()): Promise<void> {
  const lineage = await loadLineage(db, versionId)
  if (!lineage) return
  await db.transaction('rw', db.recipes, async () => {
    for (const v of lineage.versions.filter((x) => x.status === 'locked' && x.id !== versionId)) {
      await db.recipes.update(v.id, { status: 'active', lockedAtEpochMs: null })
    }
    if (!(await db.recipes.get(versionId))) await db.recipes.put(lineage.current)
    await db.recipes.update(versionId, { status: 'locked', lockedAtEpochMs: nowEpochMs })
  })
}

/** R7: desbloquear para que vuelva a aprender */
export async function unlockVersion(db: BloomDB, versionId: string): Promise<void> {
  await db.recipes.update(versionId, { status: 'active', lockedAtEpochMs: null })
}

/** R1 para el Home: dada una versión ya preparada, qué versión de esa receta toca ahora */
export async function nextVersionFor(db: BloomDB, versionId: string): Promise<RecipeVersion | null> {
  const lineage = await loadLineage(db, versionId)
  const best = lineage ? bestStart(lineage.versions, lineage.history) : null
  if (!best) return null
  const { createdAtEpochMs: _omit, ...rest } = best
  void _omit
  return rest
}

/** El brew más reciente, si está sin evaluar y es de las últimas 24 h ("Más tarde" lo deja pendiente) */
export async function pendingEvaluation(db: BloomDB, nowEpochMs: number): Promise<BrewSessionRecord | null> {
  const last = await db.brewSessions.orderBy('finishedAtEpochMs').last()
  if (!last || last.outcome !== 'completed' || last.rating !== null) return null
  return nowEpochMs - last.finishedAtEpochMs <= 24 * 3_600_000 ? last : null
}

export interface VersionSummary {
  id: string
  number: number
  status: RecipeVersion['status']
  avg: number | null
  brews: number
  lockedAtEpochMs: number | null
}

export interface RecipeHistory {
  recipeId: string
  method: Method
  objective: string | null
  versions: VersionSummary[]
}

/** Historial de versiones por receta de un café (product §10.5); solo recetas con brews evaluados */
export async function loadRecipeHistory(db: BloomDB, coffeeId: string): Promise<RecipeHistory[]> {
  const rows = await db.recipes.where('coffeeId').equals(coffeeId).toArray()
  const history = await evaluatedBrews(db, rows.map((r) => r.id))
  const byRecipe = new Map<string, RecipeVersionRecord[]>()
  for (const r of rows) byRecipe.set(r.recipeId, [...(byRecipe.get(r.recipeId) ?? []), r])
  return [...byRecipe.entries()]
    .map(([recipeId, vs]) => {
      const sorted = [...vs].sort((a, b) => a.number - b.number)
      return {
        recipeId,
        method: sorted[0]!.method,
        objective: sorted[0]!.objective,
        versions: sorted.map((v) => {
          const own = history.filter((b) => b.versionId === v.id)
          return {
            id: v.id,
            number: v.number,
            status: v.status,
            avg: own.length ? own.reduce((a, b) => a + b.rating, 0) / own.length : null,
            brews: own.length,
            lockedAtEpochMs: v.lockedAtEpochMs ?? null,
          }
        }),
      }
    })
    .filter((r) => r.versions.some((v) => v.brews > 0))
}
