import { z } from 'zod'
import { AdjustMeta } from './evaluation'

/** Íconos de paso permitidos (DS §2.8). Nombres de Lucide en kebab-case. */
export const StepIcon = z.enum(['list-checks', 'droplet', 'citrus', 'bean', 'sparkles', 'hourglass', 'gauge'])
export type StepIcon = z.infer<typeof StepIcon>

export const StepType = z.enum(['prep', 'pour', 'wait', 'press', 'extract'])
export type StepType = z.infer<typeof StepType>

export const Method = z.enum(['v60', 'aeropress', 'espresso'])
export type Method = z.infer<typeof Method>

export const RecipeStep = z
  .object({
    id: z.string().min(1),
    type: StepType,
    name: z.string().min(1),
    icon: StepIcon,
    /** Solo prep: qué hacer con las manos libres */
    instruction: z.string().nullable(),
    /** Texto de propósito sensorial; null si el PRD no lo define (S-16) */
    purpose: z.string().nullable(),
    technique: z.string().nullable(),
    /** Meta ACUMULADA en la báscula; null en prep y en pasos sin meta */
    targetG: z.number().positive().nullable(),
    /** Ventana de referencia en segundos desde t0; null en prep (D-10) */
    startS: z.number().nonnegative().nullable(),
    endS: z.number().positive().nullable(),
    optional: z.boolean(),
  })
  .superRefine((s, ctx) => {
    const timed = s.type !== 'prep'
    if (timed && (s.startS === null || s.endS === null)) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: un paso con tiempo necesita startS y endS` })
    }
    if (!timed && (s.startS !== null || s.endS !== null || s.targetG !== null)) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: un paso prep no tiene ventana ni meta` })
    }
    if (timed && s.startS !== null && s.endS !== null && s.endS <= s.startS) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: endS debe ser mayor que startS` })
    }
  })
export type RecipeStep = z.infer<typeof RecipeStep>

export const RecipeParams = z
  .object({
    doseG: z.number().positive(),
    /** Agua total (espresso: gramos en taza) */
    waterG: z.number().positive(),
    tempC: z.number().min(80).max(100),
    grind: z.object({ descriptor: z.string(), clicks: z.number().positive().nullable() }),
    steps: z.array(RecipeStep).min(2),
    totalMinS: z.number().positive(),
    totalMaxS: z.number().positive(),
    warnings: z.array(z.string()),
  })
  .superRefine((p, ctx) => {
    const firstTimed = p.steps.findIndex((s) => s.type !== 'prep')
    if (firstTimed < 0) ctx.addIssue({ code: 'custom', message: 'La receta necesita al menos un paso con tiempo' })
    // Los prep van primero (D-10)
    if (p.steps.slice(firstTimed).some((s) => s.type === 'prep')) {
      ctx.addIssue({ code: 'custom', message: 'Los pasos prep van antes de los pasos con tiempo' })
    }
    const timed = p.steps.slice(firstTimed)
    if (timed[0]?.startS !== 0) ctx.addIssue({ code: 'custom', message: 'El primer paso con tiempo empieza en 0 (t0)' })
    let lastTarget = 0
    for (let i = 0; i < timed.length; i++) {
      const s = timed[i]!
      const next = timed[i + 1]
      if (next && s.endS !== null && next.startS !== null && next.startS < s.endS) {
        ctx.addIssue({ code: 'custom', message: `${s.id} y ${next.id} se solapan` })
      }
      if (s.targetG !== null) {
        if (s.targetG <= lastTarget) ctx.addIssue({ code: 'custom', message: `${s.id}: la meta acumulada debe crecer` })
        lastTarget = s.targetG
      }
    }
    if (p.totalMaxS < p.totalMinS) ctx.addIssue({ code: 'custom', message: 'totalMaxS < totalMinS' })
  })
export type RecipeParams = z.infer<typeof RecipeParams>

export const Traceability = z.object({
  kind: z.enum(['regla_tecnica', 'campeon', 'barista', 'historial', 'personal']),
  label: z.string(),
  status: z.enum(['observado', 'verificado', 'inferido']),
  url: z.string().url().nullable(),
  year: z.number().int().nullable(),
  championRef: z.string().nullable(),
})

export const RecipeVersion = z.object({
  id: z.string().min(1),
  recipeId: z.string().min(1),
  number: z.number().int().positive(),
  parentVersionId: z.string().nullable(),
  status: z.enum(['active', 'locked', 'reverted']),
  method: Method,
  objective: z.string().nullable(),
  coffeeId: z.string().nullable(),
  source: z.enum(['seed', 'engine', 'user']),
  seedVersion: z.string().nullable(),
  /** Nombre visible: "V60 · receta base" */
  name: z.string().min(1),
  params: RecipeParams,
  traceability: Traceability,
  /** Tablas con que el motor generó la V1 ("P-14.1"); null en seed y en versiones previas a P-14.1 */
  engineVersion: z.string().nullable().optional(),
  /** Solo en versiones creadas por el motor de ajuste (fase 4) */
  adjustMeta: AdjustMeta.nullable().optional(),
  lockedAtEpochMs: z.number().nullable().optional(),
})
export type RecipeVersion = z.infer<typeof RecipeVersion>

export const RecipeSeedFile = z.object({
  _meta: z.object({ version: z.string(), source: z.string(), updated: z.string() }),
  recipes: z.array(RecipeVersion).min(1),
})
export type RecipeSeedFile = z.infer<typeof RecipeSeedFile>
