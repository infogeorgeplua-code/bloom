/**
 * Tablas del motor de ajuste (fase 4): diagnóstico de product §10.2, tamaños de paso y textos.
 * Cambiar un número aquí no toca la lógica; cada fila tiene test (brew-adjust.test.ts).
 * Textos según P-14.1 principio 6: describen la mecánica, no prometen un sabor.
 */
import type { AdjustVariable, Symptom } from '@/lib/schemas/evaluation'
import type { Method } from '@/lib/schemas/recipe-seed'

export type Agitation = 'no_agitate_last' | 'agitate_pour2'

/** Candidata de ajuste. grindClicks en pasos del molino (−1 = un paso más fino, S-15). */
export type Candidate =
  | { variable: 'tempC'; delta: number }
  | { variable: 'grindClicks'; delta: number }
  | { variable: 'waterG'; delta: number }
  | { variable: 'bloomS'; delta: number }
  | { variable: 'agitation'; mode: Agitation }

/** product §10.2: [candidata 1, candidata 2] */
export const DIAGNOSIS: Record<Symptom, [Candidate, Candidate]> = {
  muy_acido: [{ variable: 'tempC', delta: 1 }, { variable: 'grindClicks', delta: -1 }],
  muy_amargo: [{ variable: 'tempC', delta: -1 }, { variable: 'grindClicks', delta: 1 }],
  seco_final: [{ variable: 'agitation', mode: 'no_agitate_last' }, { variable: 'tempC', delta: -1 }],
  vacio: [{ variable: 'grindClicks', delta: -1 }, { variable: 'waterG', delta: -10 }],
  astringente: [{ variable: 'tempC', delta: -2 }, { variable: 'grindClicks', delta: 1 }],
  plano: [{ variable: 'bloomS', delta: 10 }, { variable: 'grindClicks', delta: -1 }],
  muy_intenso: [{ variable: 'waterG', delta: 10 }, { variable: 'grindClicks', delta: 1 }],
  falta_dulzor: [{ variable: 'tempC', delta: 1 }, { variable: 'grindClicks', delta: -1 }],
  falta_cuerpo: [{ variable: 'agitation', mode: 'agitate_pour2' }, { variable: 'grindClicks', delta: 1 }],
}

export const SYMPTOMS = Object.keys(DIAGNOSIS) as Symptom[]

export const SYMPTOM_LABEL: Record<Symptom, string> = {
  muy_acido: 'Muy ácido',
  muy_amargo: 'Muy amargo',
  seco_final: 'Seco al final',
  vacio: 'Vacío',
  astringente: 'Astringente',
  plano: 'Plano',
  muy_intenso: 'Muy intenso',
  falta_dulzor: 'Falta dulzor',
  falta_cuerpo: 'Falta cuerpo',
}

/** Máximo de síntomas que se usan por nivel (DS §4.4) */
export const MAX_SYMPTOMS: Record<1 | 2 | 3 | 4, number> = { 1: 2, 2: 2, 3: 1, 4: 1 }

/** R4 / R3: el paso se reduce a la mitad. La agitación no se divide. */
export const HALF_STEP_FACTOR = 0.5

/**
 * Espresso (P-27): ±10 g de agua es un 28 % sobre 36 g. En espresso el paso de "agua" se toma
 * como el 10 % de la bebida en taza, el mismo paso relativo que P-14.1 usa para su ratio.
 */
export const ESPRESSO_WATER_STEP_PCT = 10

/** Límites de agua (SDD §5.4 punto 9): filtrado ≥ 2 × dosis; espresso entre 1:1,5 y 1:3 (P-27). */
export const WATER_LIMITS_X_DOSE: Record<Method, [number, number]> = {
  v60: [2, Infinity],
  aeropress: [2, Infinity],
  espresso: [1.5, 3],
}

/** Bloom mínimo tras acortar (s) */
export const MIN_BLOOM_S = 10

/**
 * Agitación: solo V60 (P-27). El seed de AeroPress ya agita en sus dos vertidos y el espresso
 * no tiene vertidos. El "vertido 2" es el paso "Segundo vertido" de la receta.
 */
export const AGITATION_METHODS: Method[] = ['v60']
export const AGITATION_TEXT: Record<Agitation, string> = {
  no_agitate_last: 'Vierte lento y al centro, sin agitar.',
  agitate_pour2: 'Al terminar el vertido, agita suave la cama de café una vez.',
}

/** "Por qué" del cambio: plantilla por variable y signo (SDD §5.4). Sin promesas de sabor. */
export const REASON_TEXT: Record<`${AdjustVariable}:${'up' | 'down'}`, string> = {
  'tempC:up': 'Más temperatura extrae un poco más del café.',
  'tempC:down': 'Menos temperatura extrae un poco menos del café.',
  'grindClicks:down': 'Una molienda más fina extrae un poco más.',
  'grindClicks:up': 'Una molienda más gruesa extrae un poco menos.',
  'waterG:up': 'Más agua por gramo: la taza sale menos concentrada.',
  'waterG:down': 'Menos agua por gramo: la taza sale más concentrada.',
  'bloomS:up': 'Un bloom más largo deja salir más gas antes de los vertidos.',
  'bloomS:down': 'Un bloom más corto adelanta los vertidos.',
  'agitation:up': 'Agitar en el segundo vertido mueve más la cama de café.',
  'agitation:down': 'Sin agitar al final, el último vertido extrae menos.',
}

export const VARIABLE_LABEL: Record<AdjustVariable, string> = {
  tempC: 'Temperatura',
  grindClicks: 'Molienda',
  waterG: 'Agua',
  bloomS: 'Bloom',
  agitation: 'Técnica',
}
