/**
 * Textos de la evaluación (DS §4.4, product §10.4). Plantillas puras, sin LLM: el motor decide
 * los números y aquí solo se redactan.
 */
import type { AdjustChange, RatingLevel, Symptom } from '@/lib/schemas/evaluation'
import { formatNumber } from '@/lib/format'
import { SYMPTOM_LABEL, VARIABLE_LABEL } from './adjust-tables'

const RATING_TEXT: Record<RatingLevel, string> = {
  1: 'No me gustó',
  2: 'Le falta algo',
  3: 'Quedó bien',
  4: 'Muy rica',
  5: 'De campeonato',
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** "Quedó bien · falta dulzor" / "No me gustó · muy amargo y vacío" */
export function reportedText(rating: RatingLevel, symptoms: Symptom[]): string {
  const syms = symptoms.map((s) => lower(SYMPTOM_LABEL[s]))
  return syms.length ? `${RATING_TEXT[rating]} · ${syms.join(' y ')}` : RATING_TEXT[rating]
}

/** "Basado en tu última taza de esta receta" / "Basado en tus últimas 3 tazas de esta receta" */
export function basedOnText(evaluated: number): string {
  return evaluated <= 1 ? 'Basado en tu última taza de esta receta' : `Basado en tus últimas ${evaluated} tazas de esta receta`
}

const UNIT: Record<Exclude<AdjustChange['variable'], 'agitation'>, string> = {
  tempC: '°C',
  grindClicks: 'clicks',
  waterG: 'g',
  bloomS: 's',
}

export interface DiffRow {
  label: string
  before: string
  value: string
  unit: string
}

/** Filas numéricas para RecipeParams diff (la técnica va aparte, como texto) */
export function diffRows(changes: AdjustChange[]): DiffRow[] {
  return changes
    .filter((c): c is AdjustChange & { variable: keyof typeof UNIT } => c.variable !== 'agitation')
    .map((c) => ({
      label: VARIABLE_LABEL[c.variable],
      before: formatNumber(Number(c.before)),
      value: formatNumber(Number(c.after)),
      unit: UNIT[c.variable],
    }))
}

export function symptomList(symptoms: Symptom[]): string {
  return symptoms.map((s) => `«${lower(SYMPTOM_LABEL[s])}»`).join(' y ')
}
