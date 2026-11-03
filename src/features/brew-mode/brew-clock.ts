/**
 * Reloj del brew (SDD §5.1, S-05). El tiempo transcurrido sale siempre de anclas,
 * nunca de sumar ticks: elapsed = (pausedAt ?? now) − t0 − totalPausedMs.
 */
export interface ClockAnchors {
  t0EpochMs: number
  pausedAtEpochMs: number | null
  totalPausedMs: number
}

export function elapsedMs(a: ClockAnchors, nowEpochMs: number): number {
  return Math.max(0, (a.pausedAtEpochMs ?? nowEpochMs) - a.t0EpochMs - a.totalPausedMs)
}

/**
 * Reloj monótono anclado a epoch: en la sesión mide con performance.now() (inmune a cambios
 * de hora del sistema) y se expresa en epoch para poder persistirlo y retomarlo.
 */
export function createClock(opts?: { epoch?: () => number; perf?: () => number }) {
  const epoch = opts?.epoch ?? (() => Date.now())
  const perf = opts?.perf ?? (() => performance.now())
  const epochAtMount = epoch()
  const perfAtMount = perf()
  return {
    nowEpochMs: () => epochAtMount + (perf() - perfAtMount),
  }
}
