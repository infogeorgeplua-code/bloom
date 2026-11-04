'use client'

/**
 * Home (DS §4.1, Figma 01 · 7:13). El contenido de Figma es demo: "Tu café habitual" lo elige
 * el sistema (SDD §5.9) y Stock/recientes salen del inventario local (P-25, fase 3).
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banner, BottomNav, Button, CoffeeHero, Tile, TopBar, type HeroParam } from '@/components'
import { CoffeeRow } from '@/features/coffees/StockScreen'
import { finishExpired, restore, type RestoreResult } from '@/features/brew-mode/brew-machine'
import { pickHabitual, recentCoffees, stockTotals, type CoffeeSummary } from '@/features/inventory/library'
import { todayISO } from '@/features/coffees/coffee-form'
import { generateRecipe } from '@/features/recipes/recipe-engine'
import { OBJECTIVE_LABEL } from '@/features/recipes/engine-tables'
import { NAV_HREFS } from '@/features/shell/AppShell'
import { getRecipeVersion, getSetup, loadSummaries, saveBrewSession } from '@/lib/library-db'
import { formatDuration, formatNumber, formatRatio } from '@/lib/format'
import { ensureSeed, getDb, type BrewSessionRecord } from '@/lib/offline-db'
import { brewHref } from '@/lib/recipes'
import type { RecipeParams, RecipeVersion } from '@/lib/schemas/recipe-seed'
import { formatShare, METHOD_LABEL, monthlyStats, startOfMonth, type MonthlyStats } from './monthly-stats'

/** Lo que muestra la tarjeta "Tu café habitual" */
type Hero =
  | { kind: 'empty' }
  | { kind: 'filled'; name: string; method: RecipeVersion['method']; subtitle: string; locked: boolean; params: RecipeParams; href: string }

interface HomeData {
  dateText: string
  hero: Hero
  stats: MonthlyStats
  coffees: CoffeeSummary[]
  resume: { recipe: RecipeVersion; result: RestoreResult } | null
}

function dateLabel(now: number): string {
  const d = new Date(now)
  const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(d)
  const month = new Intl.DateTimeFormat('es', { month: 'short' }).format(d).replace('.', '')
  return `${weekday} · ${d.getDate()} ${month}`
}

const heroParams = (p: RecipeParams): HeroParam[] => [
  { value: formatNumber(p.doseG), unit: 'g', label: 'Café' },
  { value: formatNumber(p.waterG), unit: 'g', label: 'Agua' },
  { value: formatNumber(p.tempC), unit: '°C', label: 'Temp.' },
  { value: formatRatio(p.waterG, p.doseG), label: 'Ratio' },
]

const versionSubtitle = (v: RecipeVersion) => `${METHOD_LABEL[v.method]} · Receta V${v.number}`

export function HomeScreen() {
  const router = useRouter()
  const [data, setData] = useState<HomeData | null>(null)

  const load = useCallback(async () => {
    const db = getDb()
    const now = Date.now()
    await ensureSeed(db, now)
    const sessions: BrewSessionRecord[] = await db.brewSessions.orderBy('finishedAtEpochMs').toArray()
    const coffees = await loadSummaries(db, now)
    const habitual = pickHabitual(coffees)

    // Tu café habitual: el café que el sistema elige; si no hay, la última receta usada
    let hero: Hero = { kind: 'empty' }
    if (habitual) {
      const v = habitual.lastVersionId ? await getRecipeVersion(db, habitual.lastVersionId) : null
      if (v) {
        hero = { kind: 'filled', name: habitual.coffee.name, method: v.method, subtitle: versionSubtitle(v), locked: v.status === 'locked', params: v.params, href: brewHref(v.id) }
      } else {
        const method = habitual.lastMethod ?? 'v60'
        const out = generateRecipe({ method, objective: 'equilibrado', coffee: habitual.coffee, setup: await getSetup(db), todayISO: todayISO() })
        hero = {
          kind: 'filled',
          name: habitual.coffee.name,
          method,
          subtitle: `${METHOD_LABEL[method]} · ${OBJECTIVE_LABEL.equilibrado}`,
          locked: false,
          params: out.params,
          href: `/hacer-cafe?cafe=${encodeURIComponent(habitual.coffee.id)}`,
        }
      }
    } else {
      const last = [...sessions].reverse().find((s) => s.outcome === 'completed')
      const v = last ? await getRecipeVersion(db, last.versionId) : null
      if (v) hero = { kind: 'filled', name: v.name, method: v.method, subtitle: versionSubtitle(v), locked: v.status === 'locked', params: v.params, href: brewHref(v.id) }
    }

    const active = await db.activeBrew.get('current')
    let resume: HomeData['resume'] = null
    if (active) {
      const recipe = await getRecipeVersion(db, active.versionId)
      const result = recipe ? restore(active, recipe.params, now) : ({ kind: 'discard' } as const)
      if (recipe && result.kind !== 'discard') resume = { recipe, result }
      else await db.activeBrew.delete('current')
    }
    setData({
      dateText: dateLabel(now),
      hero,
      stats: monthlyStats(sessions.filter((s) => s.finishedAtEpochMs >= startOfMonth(now)), now),
      coffees,
      resume,
    })
  }, [])

  useEffect(() => {
    // Lectura inicial de IndexedDB (sistema externo); el estado se fija al resolver
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!data) return <main className="min-h-dvh" aria-busy="true" />

  const { stats, resume, hero, coffees } = data
  const totals = stockTotals(coffees)
  const hasStock = coffees.some((s) => !s.coffee.archived && s.activeBag)
  const recent = recentCoffees(coffees)

  return (
    <>
      <main className="flex flex-col gap-6 px-5 pt-2 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+2rem)]">
        <TopBar variant="home" dateText={data.dateText} onSettings={() => router.push('/setup')} />
        <h1 className="t-display text-fg">¿Qué preparamos?</h1>

        {resume ? (
          resume.result.kind === 'offer' ? (
            <Banner
              tone="neutral"
              action={
                <Button variant="tertiary" size="md" onClick={() => router.push(brewHref(resume.recipe.id))}>
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
                      if (fx.type === 'saveSession') await saveBrewSession(db, fx.session)
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

        {hero.kind === 'filled' ? (
          <CoffeeHero
            name={hero.name}
            method={hero.method}
            subtitle={hero.subtitle}
            locked={hero.locked}
            params={heroParams(hero.params)}
            onPrepare={() => router.push(hero.href)}
          />
        ) : (
          <CoffeeHero empty onPrepare={() => router.push('/hacer-cafe')} />
        )}

        <div className="grid grid-cols-2 gap-3">
          {hasStock ? (
            <Tile
              content="meter"
              variant="interactive"
              onClick={() => router.push('/stock')}
              label="Stock"
              value={formatNumber(totals.grams)}
              unit="g"
              caption={`${totals.coffeesInStock} ${totals.coffeesInStock === 1 ? 'café' : 'cafés'} en stock`}
              level={totals.level}
              fill={totals.fill}
            />
          ) : null}
          <Tile content="orb" label="Este mes" value={String(stats.totalBrews)} caption={stats.totalBrews === 1 ? 'café' : 'cafés'} />
          {stats.topMethods.map((m, i) => (
            <Tile
              key={m.method}
              content="bar"
              label={METHOD_LABEL[m.method]}
              value={String(m.brews)}
              unit={m.brews === 1 ? 'brew' : 'brews'}
              share={m.share}
              barTone={i === 0 ? 'primary' : 'secondary'}
              caption={formatShare(m.share)}
            />
          ))}
        </div>

        <Button variant="secondary" size="lg" fullWidth onClick={() => router.push('/cafe/nuevo')}>
          Tengo un café nuevo
        </Button>

        {recent.length ? (
          <section className="flex flex-col gap-1" aria-labelledby="cafes-recientes">
            <h2 id="cafes-recientes" className="t-label text-fg-3">
              Cafés recientes
            </h2>
            <div>
              {recent.map((s) => (
                <CoffeeRow key={s.coffee.id} s={s} onOpen={() => router.push(`/cafe?id=${encodeURIComponent(s.coffee.id)}`)} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-(--app-max-width)">
        <BottomNav active="home" hrefs={NAV_HREFS} />
      </div>
    </>
  )
}
