import { z } from 'zod'

/** Síntomas post-brew (product §10.1). Máximo 2 se usan para el ajuste. */
export const Symptom = z.enum([
  'muy_acido',
  'muy_amargo',
  'seco_final',
  'vacio',
  'astringente',
  'plano',
  'muy_intenso',
  'falta_dulzor',
  'falta_cuerpo',
])
export type Symptom = z.infer<typeof Symptom>

/** Variables que el motor de ajuste puede mover (SDD §5.4) */
export const AdjustVariable = z.enum(['tempC', 'grindClicks', 'waterG', 'bloomS', 'agitation'])
export type AdjustVariable = z.infer<typeof AdjustVariable>

export const RatingLevel = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
export type RatingLevel = z.infer<typeof RatingLevel>

/**
 * Un cambio concreto: valor antes y después. tempC en °C, grindClicks en posiciones del molino,
 * waterG en g, bloomS = duración del bloom en s, agitation = texto de técnica del paso `stepId`.
 */
export const AdjustChange = z.object({
  variable: AdjustVariable,
  before: z.union([z.number(), z.string()]),
  after: z.union([z.number(), z.string()]),
  stepId: z.string().nullable(),
})
export type AdjustChange = z.infer<typeof AdjustChange>

/** Por qué existe una versión ajustada: lo necesita R6 para revertir y probar la otra candidata */
export const AdjustMeta = z.object({
  rule: z.enum(['R3', 'R4', 'R5', 'R6']),
  symptoms: z.array(Symptom).max(2),
  /** Nivel con el que se originó el cambio: 1–2 paso completo; 3–4 medio paso */
  ratingLevel: RatingLevel,
  changes: z.array(AdjustChange).max(2),
  /** Variables ya probadas para estos síntomas (no se repiten tras revertir) */
  tried: z.array(AdjustVariable),
  /** Brew evaluado que originó el cambio */
  fromSessionId: z.string(),
})
export type AdjustMeta = z.infer<typeof AdjustMeta>
