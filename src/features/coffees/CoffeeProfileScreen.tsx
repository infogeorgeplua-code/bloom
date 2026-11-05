'use client'

/**
 * Perfil de café (product §18 "CAFÉ", versión fase 3): ficha, bolsa activa con stock (D-09),
 * ajustar gramos, bolsa nueva y "Preparar este café". Sin frame en Figma: patrones del DS.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Package, Pencil, Star } from 'lucide-react'
import { RATING_LABEL, Banner, BottomSheet, Button, ChipGrid, IconButton, StockMeter, TextField, TopBar, TrustBadge } from '@/components'
import { FlowShell } from '@/features/shell/AppShell'
import type { CoffeeSummary } from '@/features/inventory/library'
import { roastWindow } from '@/features/recipes/recipe-engine'
import { METHOD_LABEL } from '@/features/home/monthly-stats'
import { adjustStockTo, archiveCoffee, finishBag, loadSummary, openBag } from '@/lib/library-db'
import { getDb } from '@/lib/offline-db'
import { loadRecipeHistory, type RecipeHistory } from '@/lib/evaluation-db'
import { OBJECTIVE_LABEL, type Objective } from '@/features/recipes/engine-tables'
import type { RatingLevel } from '@/lib/schemas/evaluation'
import { formatNumber } from '@/lib/format'
import { PROCESS_LABEL, ROAST_LABEL } from '@/lib/schemas/coffee'
import { BAG_SIZES, daysWord, parseNumber, todayISO, ROAST_STATE_TEXT } from './coffee-form'

type Sheet = null | 'adjust' | 'bag' | 'archive'

function relativeDays(epochMs: number, now: number): string {
  const d = Math.floor((now - epochMs) / 86_400_000)
  return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`
}

export function CoffeeProfileScreen() {
  const router = useRouter()
  const id = useSearchParams().get('id') ?? ''
  const [s, setS] = useState<CoffeeSummary | null | undefined>(undefined)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [gramsText, setGramsText] = useState('')
  const [gramsError, setGramsError] = useState<string>()
  // "Ahora" se fija al cargar (los textos relativos no cambian entre renders)
  const [now, setNow] = useState(0)
  const [recipes, setRecipes] = useState<RecipeHistory[]>([])

  const load = useCallback(async () => {
    const t = Date.now()
    setNow(t)
    const db = getDb()
    const [summary, history] = await Promise.all([loadSummary(db, id, t), loadRecipeHistory(db, id)])
    setS(summary)
    setRecipes(history)
  }, [id])
  useEffect(() => {
    // Lectura de IndexedDB (sistema externo)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const back = () => (window.history.length > 1 ? router.back() : router.push('/stock'))

  if (s === undefined) return <main className="min-h-dvh" aria-busy="true" />
  if (s === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
        <p className="t-title text-fg">No encontramos este café</p>
        <Button onClick={() => router.push('/stock')}>Ir a Stock</Button>
      </main>
    )
  }

  const { coffee: c, activeBag, stock } = s
  const today = todayISO()
  const roast = c.roastDateISO ? roastWindow(c.roastDateISO, today, s.lastMethod ?? 'v60') : null
  const facts = [
    ['Tostador', c.roaster],
    ['País', c.originCountry],
    ['Variedad', c.variety],
    ['Proceso', c.process ? PROCESS_LABEL[c.process] : null],
    ['Tueste', c.roastLevel ? ROAST_LABEL[c.roastLevel] : null],
    ['Altitud', c.altitudeM !== null ? `${formatNumber(c.altitudeM)} m` : null],
  ].filter((f): f is [string, string] => Boolean(f[1]))
  const missing = 6 - facts.length

  const openSheet = (k: Sheet) => {
    setGramsError(undefined)
    setGramsText(k === 'adjust' && s.grams !== null ? String(s.grams) : '')
    setSheet(k)
  }

  const saveGrams = async () => {
    const g = parseNumber(gramsText)
    if (g === null || Number.isNaN(g) || g < 0 || g > 5000 || !Number.isInteger(g)) {
      setGramsError('Escribe los gramos en números enteros')
      return
    }
    const db = getDb()
    if (sheet === 'adjust' && activeBag && s.grams !== null) await adjustStockTo(db, activeBag.id, s.grams, g, Date.now())
    if (sheet === 'bag') {
      if (g < 1) return setGramsError('La bolsa necesita gramos')
      await openBag(db, c.id, g, Date.now())
    }
    setSheet(null)
    await load()
  }

  const bagChip = BAG_SIZES.map(String).includes(gramsText.trim()) ? gramsText.trim() : null

  return (
    <FlowShell
      header={
        <TopBar
          onBack={back}
          action={<IconButton label="Editar café" icon={Pencil} variant="ghost" onClick={() => router.push(`/cafe/nuevo?id=${encodeURIComponent(c.id)}`)} />}
        />
      }
      footer={
        <Button size="lg" fullWidth onClick={() => router.push(`/hacer-cafe?cafe=${encodeURIComponent(c.id)}`)} disabled={stock?.level === 'depleted'}>
          Preparar este café
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <h1 className="t-title-lg text-fg">{c.name}</h1>
        {c.process || c.originCountry ? (
          <p className="t-label text-fg-3">{[c.process ? PROCESS_LABEL[c.process] : null, c.originCountry].filter(Boolean).join(' · ')}</p>
        ) : null}
      </div>

      <section className="flex flex-col gap-4 rounded-tile bg-surface-2 p-4" aria-labelledby="bolsa">
        <h2 id="bolsa" className="t-label text-fg-3">
          {activeBag ? `Bolsa ${activeBag.number}` : 'Bolsa'}
        </h2>
        {activeBag && stock ? (
          <>
            <StockMeter
              size="profile"
              level={stock.level}
              gramsText={`${formatNumber(stock.grams)} g`}
              preparations={stock.preparations}
              fill={s.fill}
              onMarkFinished={async () => {
                await finishBag(getDb(), activeBag.id, Date.now())
                await load()
              }}
            />
            <p className="t-caption text-fg-3">
              De <span className="num">{formatNumber(activeBag.initialG)}</span> g · abierta {relativeDays(activeBag.openedAtEpochMs, now)}
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="secondary" size="md" fullWidth onClick={() => openSheet('adjust')}>
                Ajustar gramos
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={() => openSheet('bag')}>
                Bolsa nueva
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="t-body text-fg-2">Sin bolsa abierta. Agrega una para que Bloom descuente cada taza.</p>
            <Button variant="secondary" size="md" icon={Package} onClick={() => openSheet('bag')}>
              Abrir bolsa
            </Button>
          </>
        )}
      </section>

      {roast ? (
        roast.state === 'en_ventana' ? (
          <p className="t-body text-fg-2">
            Tostado hace <span className="num">{roast.days}</span> {daysWord(roast.days)} · {ROAST_STATE_TEXT.en_ventana}
          </p>
        ) : (
          <Banner tone="warning">
            Tostado hace <span className="num">{roast.days}</span> {daysWord(roast.days)} · {ROAST_STATE_TEXT[roast.state]}
          </Banner>
        )
      ) : null}

      <section className="flex flex-col gap-2" aria-labelledby="ficha">
        <div className="flex items-center gap-2">
          <h2 id="ficha" className="t-label text-fg-3">
            Ficha
          </h2>
          {facts.length ? <TrustBadge status="observado" inline /> : null}
        </div>
        {facts.length ? (
          <dl className="m-0 divide-y divide-line">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="t-body text-fg-3">{k}</dt>
                <dd className="t-body m-0 text-right text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {missing ? (
          <Button variant="tertiary" size="md" onClick={() => router.push(`/cafe/nuevo?id=${encodeURIComponent(c.id)}`)}>
            {facts.length ? 'Completar ficha' : 'Agregar datos de la bolsa'}
          </Button>
        ) : null}
      </section>

      <section className="flex flex-col gap-1" aria-labelledby="brews">
        <h2 id="brews" className="t-label text-fg-3">
          Tus brews
        </h2>
        <p className="t-body text-fg-2">
          {s.brewCount ? (
            <>
              <span className="num">{s.brewCount}</span> {s.brewCount === 1 ? 'preparación' : 'preparaciones'}
              {s.lastMethod && s.lastBrewAtEpochMs ? ` · la última en ${METHOD_LABEL[s.lastMethod]}, ${relativeDays(s.lastBrewAtEpochMs, now)}` : ''}
            </>
          ) : (
            'Aún no lo preparas.'
          )}
        </p>
      </section>

      {recipes.length ? (
        <section className="flex flex-col gap-4" aria-labelledby="recetas">
          <h2 id="recetas" className="t-label text-fg-3">
            Tus recetas
          </h2>
          {recipes.map((r) => (
            <div key={r.recipeId} className="flex flex-col gap-1">
              <h3 className="t-body m-0 font-medium text-fg">
                {METHOD_LABEL[r.method]} · {OBJECTIVE_LABEL[r.objective as Objective] ?? 'Receta base'}
              </h3>
              <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                {r.versions.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-2">
                    <span className="num t-body w-10 text-fg">V{v.number}</span>
                    <span className="t-body flex flex-1 items-center gap-1.5 text-fg-2">
                      {v.status === 'locked' ? (
                        <>
                          <Star size={16} strokeWidth={1.5} className="fill-accent text-accent" aria-hidden="true" />
                          Bloqueada
                        </>
                      ) : v.status === 'reverted' ? (
                        'Revertida'
                      ) : v.avg !== null ? (
                        RATING_LABEL[Math.round(v.avg) as RatingLevel]
                      ) : (
                        'Sin evaluar'
                      )}
                    </span>
                    {v.brews ? (
                      <span className="t-caption text-fg-3">
                        <span className="num">{v.brews}</span> {v.brews === 1 ? 'taza' : 'tazas'}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <Button variant="tertiary" size="md" onClick={() => setSheet('archive')}>
        {c.archived ? 'Volver a mostrar en Stock' : 'Archivar café'}
      </Button>

      <BottomSheet
        open={sheet === 'adjust' || sheet === 'bag'}
        onOpenChange={(o) => !o && setSheet(null)}
        title={sheet === 'adjust' ? 'Ajustar gramos' : 'Bolsa nueva'}
        description={
          sheet === 'adjust'
            ? 'Pesa la bolsa y escribe cuánto café queda. Bloom guarda la diferencia.'
            : activeBag
              ? 'La bolsa actual pasa a terminada.'
              : undefined
        }
      >
        {sheet === 'bag' ? (
          <ChipGrid
            aria-label="Tamaño de la bolsa"
            columns={2}
            options={BAG_SIZES.map((g) => ({ value: String(g), label: `${g} g` }))}
            value={bagChip}
            onChange={(v) => {
              setGramsText(v)
              setGramsError(undefined)
            }}
          />
        ) : null}
        <TextField
          label={sheet === 'adjust' ? 'Gramos que quedan' : 'Gramos de la bolsa'}
          numeric
          suffix="g"
          value={gramsText}
          onChange={(e) => {
            setGramsText(e.target.value)
            setGramsError(undefined)
          }}
          error={gramsError}
        />
        <Button size="lg" fullWidth onClick={() => void saveGrams()}>
          Guardar
        </Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === 'archive'}
        onOpenChange={(o) => !o && setSheet(null)}
        title={c.archived ? '¿Mostrarlo otra vez?' : '¿Archivar este café?'}
        description={c.archived ? undefined : 'Sale de Stock y del Home. Sus brews siguen contando en tus métricas.'}
      >
        <Button
          size="lg"
          fullWidth
          onClick={async () => {
            await archiveCoffee(getDb(), c.id, !c.archived)
            setSheet(null)
            await load()
          }}
        >
          {c.archived ? 'Mostrar en Stock' : 'Archivar'}
        </Button>
        <Button variant="tertiary" size="lg" fullWidth onClick={() => setSheet(null)}>
          Cancelar
        </Button>
      </BottomSheet>
    </FlowShell>
  )
}
