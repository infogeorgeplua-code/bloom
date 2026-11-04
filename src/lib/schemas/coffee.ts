import { z } from 'zod'

/** Fichas de café, bolsas y Setup (fase 3, P-25). Campo desconocido = null, nunca "N/A". */

export const ProcessType = z.enum(['lavado', 'natural', 'honey', 'anaerobico', 'otro'])
export type ProcessType = z.infer<typeof ProcessType>

export const RoastLevel = z.enum(['claro', 'medio', 'medio_oscuro', 'oscuro'])
export type RoastLevel = z.infer<typeof RoastLevel>

export const PROCESS_LABEL: Record<ProcessType, string> = {
  lavado: 'Lavado',
  natural: 'Natural',
  honey: 'Honey',
  anaerobico: 'Anaeróbico',
  otro: 'Otro',
}

export const ROAST_LABEL: Record<RoastLevel, string> = {
  claro: 'Claro',
  medio: 'Medio',
  medio_oscuro: 'Medio-oscuro',
  oscuro: 'Oscuro',
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Lo que el formulario "Tengo un café nuevo" entrega (validado antes de guardar) */
export const CoffeeInput = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre').max(80),
  roaster: z.string().trim().max(80).nullable(),
  originCountry: z.string().trim().max(60).nullable(),
  variety: z.string().trim().max(60).nullable(),
  process: ProcessType.nullable(),
  roastLevel: RoastLevel.nullable(),
  roastDateISO: z.string().regex(ISO_DATE, 'Fecha no válida').nullable(),
  altitudeM: z.number().int().min(0, 'Revisa la altitud').max(3000, 'Revisa la altitud').nullable(),
})
export type CoffeeInput = z.infer<typeof CoffeeInput>

export const BagInput = z.object({
  initialG: z.number().int().min(1, 'Revisa los gramos').max(5000, 'Revisa los gramos'),
})

export interface CoffeeRecord extends CoffeeInput {
  id: string
  createdAtEpochMs: number
  /** Oculto de la biblioteca (no se borra: sus brews siguen contando) */
  archived: boolean
}

export interface BagRecord {
  id: string
  coffeeId: string
  /** 1, 2, 3… por café */
  number: number
  initialG: number
  openedAtEpochMs: number
  status: 'active' | 'finished'
  finishedAtEpochMs: number | null
}

/** Ajuste manual de gramos (P-11, adelantado por P-25): positivo suma, negativo resta */
export interface StockAdjustmentRecord {
  id: string
  bagId: string
  deltaG: number
  createdAtEpochMs: number
  reason: 'manual'
}

/** Molino registrado en Setup (product §21). Posición 1 = más fina. */
export const GrinderSetup = z.object({
  presetId: z.string().nullable(),
  name: z.string().trim().min(1).max(60),
  minClicks: z.number().int().min(0),
  maxClicks: z.number().int().positive(),
  /** Cuántas posiciones equivale "un paso" de molienda en el motor */
  clicksPerStep: z.number().int().positive(),
  /** Punto de partida por método (calibrable por el usuario) */
  base: z.object({ v60: z.number().int(), aeropress: z.number().int(), espresso: z.number().int() }),
})
export type GrinderSetup = z.infer<typeof GrinderSetup>

export const SetupRecord = z.object({
  grinder: GrinderSetup.nullable(),
  /** Altitud donde preparas, para el punto de ebullición (no la del cultivo) */
  brewAltitudeM: z.number().int().min(0).max(5000).nullable(),
})
export type SetupRecord = z.infer<typeof SetupRecord>

export const EMPTY_SETUP: SetupRecord = { grinder: null, brewAltitudeM: null }
