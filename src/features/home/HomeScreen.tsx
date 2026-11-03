'use client'

/**
 * Home (DS §4.1, Figma 01 · 7:13) con lo que existe sin backend (S-08): retomar, tu café
 * habitual (la última receta usada), métricas del mes y las recetas base.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coffee } from 'lucide-react'
import {
  Banner,
  BottomNav,
  BottomSheet,
  Button,
  CoffeeHero,
  ListRow,
  Tile,
  Toggle,
  TopBar,
  type NavKey,
} from '@/components'
import { finishExpired, restore, type RestoreResult } from '@/features/brew-mode/brew-machine'
import { formatDuration, formatNumber, formatRatio } from '@/lib/format'
import {
  ensureSeed,
  getDb,
  getHapticsEnabled,
  setHapticsEnabled,
  type BrewSessionRecord,
} from '@/lib/offline-db'
import { seedRecipe, seedRecipes } from '@/lib/recipes'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { formatShare, METHOD_LABEL, monthlyStats, startOfMonth, type MonthlyStats } from './monthly-stats'

interface HomeData {
  dateText: string
  last: RecipeVersion | null
  stats: MonthlyStats
  resume: { recipe: RecipeVersion; result: RestoreResult } | null
  haptics: boolean
}

function dateLabel(now: number): string {
  const d = new Date(now)
  const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(d)
  const month = new Intl.DateTimeFormat('es', { month: 'short' }).format(d).replace('.', '')
  return `${weekday} · ${d.getDate()} ${month}`
}

const heroParams = (r: RecipeVersion) => [
  { value: formatNumber(r.params.doseG), unit: 'g', label: 'Café' },
  { value: formatNumber(r.params.waterG), unit: 'g', label: 'Agua' },
  { value: formatNumber(r.params.tempC), unit: '°C', label: 'Temp.' },
  { value: formatRatio(r.params.waterG, r.params.doseG), label: 'Ratio' },
]

export function HomeScreen() {
  const router = useRouter()
  const [data, setData] = useState<HomeData | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const load = useCallback(async () => {
    const db = getDb()
    const now = Date.now()
    await ensureSeed(db, now)
    const sessions: BrewSessionRecord[] = await db.brewSessions.orderBy('finishedAtEpochMs').toArray()
    const lastSession = [...sessions].reverse().find((s) => s.outcome === 'completed')
    const monthSessions = sessions.filter((s) => s.finishedAtEpochMs >= startOfMonth(now))
    const active = await db.activeBrew.get('current')
    let resume: HomeData['resume'] = null
    if (active) {
      const recipe = seedRecipe(active.versionId)
      const result = recipe ? restore(active, recipe.params, now) : ({ kind: 'discard' } as const)
      if (recipe && result.kind !== 'discard') resume = { recipe, result }
      else await db.activeBrew.delete('current')
    }
    setData({
      dateText: dateLabel(now),
      last: lastSession ? (seedRecipe(lastSession.versionId) ?? null) : null,
      stats: monthlyStats(monthSessions, now),
      resume,
      haptics: await getHapticsEnabled(db),
    })
  }, [])

  useEffect(() => {
    // Lectura inicial de IndexedDB (sistema externo); el estado se fija al resolver
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const open = (id: string) => router.push(`/brew-mode/${id}`)
  const fallbackId = data?.last?.id ?? 'v60-base-v1'

  const onNav = (key: NavKey) => {
    if (key === 'make') open(fallbackId)
  }

  if (!data) return <main className="min-h-dvh" aria-busy="true" />

  const { stats, resume } = data

  return (
    <>
      <main className="flex flex-col gap-6 px-5 pt-2 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+2rem)]">
        <TopBar variant="home" dateText={data.dateText} onSettings={() => setSettingsOpen(true)} />
        <h1 className="t-display text-fg">¿Qué preparamos?</h1>

        {resume ? (
          resume.result.kind === 'offer' ? (
            <Banner
              tone="neutral"
              action={
                <Button variant="tertiary" size="md" onClick={() => open(resume.recipe.id)}>
                  Retomar
                </Button>
              }
            >
              Retomar brew en <span className="num">{formatDuration(resume.result.resumeAtElapsedMs / 1000)}</span> ·{' '}
              {METHOD_LABEL[resume.recipe.method]}
            </Banner>
          ) : resume.result.kind === 'expired' ? (
            <Banner
              tone="warning"
              action={
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={async () => {
                    const r = resume.result
                    if (r.kind !== 'expired') return
                    const db = getDb()
                    for (const fx of finishExpired(r.state, { params: resume.recipe.params, method: resume.recipe.method }, crypto.randomUUID())) {
                      if (fx.type === 'saveSession') await db.brewSessions.put(fx.session)
                      if (fx.type === 'clearPersisted') await db.activeBrew.delete('current')
                    }
                    await load()
                  }}
                >
                  Guardar
                </Button>
              }
            >
              Este brew terminó hace <span className="num">{Math.round(resume.result.endedAgoMs / 60_000)}</span> min.{' '}
              <button
                type="button"
                className="t-body text-fg-2 underline"
                onClick={async () => {
                  await getDb().activeBrew.delete('current')
                  await load()
                }}
              >
                Descartar
              </button>
            </Banner>
          ) : null
        ) : null}

        {data.last ? (
          <CoffeeHero
            name={data.last.name}
            method={data.last.method}
            subtitle={`${METHOD_LABEL[data.last.method]} · Receta V${data.last.number}`}
            locked={data.last.status === 'locked'}
            params={heroParams(data.last)}
            onPrepare={() => open(data.last!.id)}
          />
        ) : (
          <CoffeeHero empty onPrepare={() => open('v60-base-v1')} />
        )}

        {/* Sin inventario hasta la fase 5: el tile Stock no se muestra (S-08) */}
        <div className="grid grid-cols-2 gap-3">
          <Tile content="orb" label="Este mes" value={String(stats.totalBrews)} caption={stats.totalBrews === 1 ? 'café' : 'cafés'} />
          {stats.topMethods.map((m) => (
            <Tile
              key={m.method}
              content="bar"
              label={METHOD_LABEL[m.method]}
              value={String(m.brews)}
              unit={m.brews === 1 ? 'brew' : 'brews'}
              share={m.share}
              caption={formatShare(m.share)}
            />
          ))}
        </div>

        <section className="flex flex-col gap-1" aria-labelledby="recetas-base">
          <h2 id="recetas-base" className="t-label text-fg-3">
            Recetas base
          </h2>
          <div>
            {seedRecipes().map((r) => (
              <ListRow
                key={r.id}
                thumb={<Coffee size={24} strokeWidth={1.5} aria-hidden="true" />}
                title={METHOD_LABEL[r.method]}
                subtitle={`${formatNumber(r.params.doseG)} g · ${formatNumber(r.params.waterG)} g · ${formatNumber(r.params.tempC)} °C`}
                onClick={() => open(r.id)}
              />
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-(--app-max-width)">
        <BottomNav active="home" onSelect={onNav} disabled={['stock', 'setup']} />
      </div>

      <BottomSheet open={settingsOpen} onOpenChange={setSettingsOpen} title="Ajustes del Brew Mode">
        {/* TODO(ds-pendiente): hoja temporal hasta la pantalla de Setup (fase 3) */}
        <Toggle
          label="Vibración"
          checked={data.haptics}
          onChange={async (v) => {
            await setHapticsEnabled(getDb(), v)
            setData({ ...data, haptics: v })
          }}
        />
        <p className="t-caption text-fg-3">El aviso en pantalla siempre está, con o sin vibración.</p>
      </BottomSheet>
    </>
  )
}

