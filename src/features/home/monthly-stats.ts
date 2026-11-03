/**
 * Métricas del mes para el Home (tech §4, D-15, SDD §5.8). Puro: recibe las sesiones y la
 * fecha. No guarda contadores: un brew que se sincroniza tarde nunca deja un número viejo.
 */
import type { Method } from '@/lib/schemas/recipe-seed'
import type { BrewSessionRecord } from '@/lib/offline-db'

export interface MethodUsage {
  method: Method
  brews: number
  /** 0..1 del total del mes */
  share: number
}

export interface MonthlyStats {
  monthStartEpochMs: number
  totalBrews: number
  /** De más a menos usado */
  byMethod: MethodUsage[]
  /** Los 2 primeros → tiles de método */
  topMethods: MethodUsage[]
}

const ORDER: Method[] = ['v60', 'aeropress', 'espresso']

/** Inicio del mes calendario en la zona horaria del dispositivo. */
export function startOfMonth(nowEpochMs: number): number {
  const d = new Date(nowEpochMs)
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime()
}

export function monthlyStats(
  sessions: Pick<BrewSessionRecord, 'method' | 'finishedAtEpochMs' | 'outcome'>[],
  nowEpochMs: number,
): MonthlyStats {
  const from = startOfMonth(nowEpochMs)
  const inMonth = sessions.filter(
    (s) => s.outcome === 'completed' && s.finishedAtEpochMs >= from && s.finishedAtEpochMs <= nowEpochMs,
  )
  const total = inMonth.length
  const counts = new Map<Method, number>()
  for (const s of inMonth) counts.set(s.method, (counts.get(s.method) ?? 0) + 1)
  const byMethod = [...counts.entries()]
    .map(([method, brews]) => ({ method, brews, share: total ? brews / total : 0 }))
    .sort((a, b) => b.brews - a.brews || ORDER.indexOf(a.method) - ORDER.indexOf(b.method))
  return { monthStartEpochMs: from, totalBrews: total, byMethod, topMethods: byMethod.slice(0, 2) }
}

/** 0.6 → "60% del mes" */
export const formatShare = (share: number): string => `${Math.round(share * 100)}% del mes`

export const METHOD_LABEL: Record<Method, string> = {
  v60: 'V60',
  aeropress: 'AeroPress',
  espresso: 'Espresso',
}
