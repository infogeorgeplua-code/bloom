import type { HapticKind } from './brew-machine'

/** Patrones de DS §2.7. El aviso visual siempre basta por sí solo. */
export const HAPTIC_PATTERN: Record<HapticKind, number[]> = {
  warn3s: [40],
  step: [60, 80, 60],
  finish: [120, 80, 120],
  pause: [30],
  prepDone: [20],
}

export function vibrate(kind: HapticKind, enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(HAPTIC_PATTERN[kind])
  } catch {
    // Sin vibración disponible: el aviso visual cubre el evento
  }
}
