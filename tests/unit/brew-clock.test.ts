import { describe, expect, it } from 'vitest'
import { createClock, elapsedMs } from '@/features/brew-mode/brew-clock'

describe('brew-clock', () => {
  it('elapsed = (pausedAt ?? now) − t0 − totalPausedMs', () => {
    expect(elapsedMs({ t0EpochMs: 1000, pausedAtEpochMs: null, totalPausedMs: 0 }, 6000)).toBe(5000)
    expect(elapsedMs({ t0EpochMs: 1000, pausedAtEpochMs: 4000, totalPausedMs: 0 }, 9000)).toBe(3000)
    expect(elapsedMs({ t0EpochMs: 1000, pausedAtEpochMs: null, totalPausedMs: 2000 }, 9000)).toBe(6000)
  })

  it('nunca es negativo', () => {
    expect(elapsedMs({ t0EpochMs: 5000, pausedAtEpochMs: null, totalPausedMs: 0 }, 1000)).toBe(0)
  })

  it('el reloj monótono no se mueve si cambia la hora del sistema', () => {
    let epoch = 1_000_000
    let perf = 0
    const clock = createClock({ epoch: () => epoch, perf: () => perf })
    perf += 500
    epoch -= 3_600_000 // alguien atrasa el reloj del sistema una hora
    expect(clock.nowEpochMs()).toBe(1_000_500)
  })

  it('deriva < 100 ms en 3 min con ticks irregulares, un hueco de 5 s y pausas (DS §9.4)', () => {
    // Tiempo real simulado; los ticks llegan con jitter de ±50 ms y un hueco de 5 s (pestaña en segundo plano)
    let perf = 0
    const clock = createClock({ epoch: () => 1_700_000_000_000, perf: () => perf })
    const t0 = clock.nowEpochMs()
    let pausedAt: number | null = null
    let totalPaused = 0
    let realBrewMs = 0
    let maxError = 0
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 100 - 50

    while (perf < 190_000) {
      const step = perf > 60_000 && perf < 65_000 ? 5_000 : 16 + rand()
      perf += step
      const now = clock.nowEpochMs()
      // Pausa de 2 s a los 100 s
      if (pausedAt === null && perf >= 100_000 && perf < 100_100) pausedAt = now
      if (pausedAt !== null && now - pausedAt >= 2_000) {
        totalPaused += now - pausedAt
        pausedAt = null
      }
      if (pausedAt === null) realBrewMs = now - t0 - totalPaused
      const elapsed = elapsedMs({ t0EpochMs: t0, pausedAtEpochMs: pausedAt, totalPausedMs: totalPaused }, now)
      maxError = Math.max(maxError, Math.abs(elapsed - realBrewMs))
    }
    expect(realBrewMs).toBeGreaterThan(180_000)
    expect(maxError).toBeLessThan(100)
  })
})
