/**
 * Tablas de mapeo del motor de recetas (P-14, propuesta de Claude por confirmar con George).
 * Dirección y límites: product §11. Cambiar un número aquí no toca la lógica; cada fila tiene test.
 */
import type { ProcessType, RoastLevel } from '@/lib/schemas/coffee'
import type { Method } from '@/lib/schemas/recipe-seed'

export type Objective = 'equilibrado' | 'brillante' | 'dulce' | 'cuerpo' | 'claridad' | 'para_alguien_mas'
export type Preference = 'dulce' | 'intenso' | 'floral' | 'suave' | 'sorprendeme'
/** Objetivo técnico al que se reduce "para alguien más" */
export type TechnicalObjective = Exclude<Objective, 'para_alguien_mas'>

export const OBJECTIVES: Objective[] = ['equilibrado', 'brillante', 'dulce', 'cuerpo', 'claridad', 'para_alguien_mas']
export const PREFERENCES: Preference[] = ['dulce', 'intenso', 'floral', 'suave', 'sorprendeme']

export const OBJECTIVE_LABEL: Record<Objective, string> = {
  equilibrado: 'Equilibrado',
  brillante: 'Brillante',
  dulce: 'Dulce',
  cuerpo: 'Con cuerpo',
  claridad: 'Claridad máxima',
  para_alguien_mas: 'Para alguien más',
}

export const PREFERENCE_LABEL: Record<Preference, string> = {
  dulce: 'Dulce',
  intenso: 'Intenso',
  floral: 'Floral',
  suave: 'Suave',
  sorprendeme: 'Sorpréndeme',
}

/** Máximo 2 variables por objetivo (product §11). `technique` es texto de plantilla, no un número. */
export interface ObjectiveDelta {
  tempC: number
  /** Pasos de molienda: negativo = más fina */
  grindSteps: number
  /** Suma al ratio (agua / café) */
  ratio: number
  /** Segundos que se quitan al final del bloom (solo V60 y AeroPress) */
  bloomShorterS: number
  technique: 'agitar' | 'lento' | null
}

const NONE: ObjectiveDelta = { tempC: 0, grindSteps: 0, ratio: 0, bloomShorterS: 0, technique: null }

export const OBJECTIVE_DELTAS: Record<TechnicalObjective, Record<Method, ObjectiveDelta>> = {
  equilibrado: { v60: NONE, aeropress: NONE, espresso: NONE },
  dulce: {
    v60: { ...NONE, tempC: 1, grindSteps: -1 },
    aeropress: { ...NONE, tempC: 1, grindSteps: -1 },
    espresso: { ...NONE, tempC: 1, grindSteps: -1 },
  },
  brillante: {
    v60: { ...NONE, tempC: -1, bloomShorterS: 5 },
    aeropress: { ...NONE, tempC: -1, bloomShorterS: 5 },
    espresso: { ...NONE, tempC: -1 },
  },
  cuerpo: {
    v60: { ...NONE, grindSteps: 1, technique: 'agitar' },
    aeropress: { ...NONE, grindSteps: 1, technique: 'agitar' },
    espresso: { ...NONE, grindSteps: 1 },
  },
  claridad: {
    v60: { ...NONE, ratio: 1, technique: 'lento' },
    aeropress: { ...NONE, ratio: 1, technique: 'lento' },
    espresso: { ...NONE, ratio: 0.5 },
  },
}

/** Product §11: "para alguien más" prioriza dulzor y contiene la acidez */
export const PREFERENCE_TO_OBJECTIVE: Record<Preference, TechnicalObjective> = {
  dulce: 'dulce',
  intenso: 'cuerpo',
  floral: 'brillante',
  suave: 'equilibrado',
  sorprendeme: 'dulce',
}

export const ROAST_TEMP_ADJUST: Record<RoastLevel, number> = { claro: 1, medio: 0, medio_oscuro: -1, oscuro: -2 }

export const PROCESS_TEMP_ADJUST: Record<ProcessType, number> = { lavado: 0, honey: 0, natural: -1, anaerobico: -1, otro: 0 }

/** Altitud del cultivo (m) → °C. Se evalúa en orden; gana la primera fila que cumple. */
export const COFFEE_ALTITUDE_TEMP_ADJUST: { minM: number; tempC: number }[] = [
  { minM: 1800, tempC: 1 },
  { minM: 1200, tempC: 0 },
  { minM: 0, tempC: -1 },
]

/** Días desde el tueste: [inicio de la ventana ideal, fin] por tipo de método */
export const ROAST_WINDOW_DAYS: Record<'filtrado' | 'espresso', [number, number]> = {
  filtrado: [7, 21],
  espresso: [14, 30],
}

export const TEMP_LIMITS_C: [number, number] = [80, 100]

/** Texto de técnica por plantilla (no LLM) */
export const TECHNIQUE_TEXT: Record<'agitar' | 'lento', string> = {
  agitar: 'Vierte desde un poco más alto para agitar la cama de café.',
  lento: 'Vierte lento y al centro, sin agitar.',
}

/** "Esta receta prioriza X porque…" (plantilla) */
export const PRIORITY_TEXT: Record<TechnicalObjective, string> = {
  equilibrado: 'Esta receta prioriza el equilibrio: parte de la receta base y solo la ajusta a tu café.',
  dulce: 'Esta receta prioriza el dulzor: más temperatura y molienda más fina extraen más azúcares.',
  brillante: 'Esta receta prioriza el brillo: menos temperatura y un bloom más corto conservan la acidez.',
  cuerpo: 'Esta receta prioriza el cuerpo: molienda más gruesa y más agitación en los vertidos.',
  claridad: 'Esta receta prioriza la claridad: más agua por gramo y vertidos lentos, sin agitar.',
}
