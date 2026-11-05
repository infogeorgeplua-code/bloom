'use client'

/**
 * Hacer café (Flujo 1, product §6): café → método → objetivo → receta → Brew Mode.
 * La receta sale del motor determinista (o de tu versión existente, R1). Sin frame en Figma:
 * TopBar flow + ChipGrid + RecipeParams del DS. El botón atrás de Android retrocede un paso.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Coffee, Package, Plus } from 'lucide-react'
import { Banner, Button, ChipGrid, ListRow, RecipeParams, TopBar, TrustBadge, type ParamRow } from '@/components'
import { FlowShell } from '@/features/shell/AppShell'
import { CoffeeRow } from '@/features/coffees/StockScreen'
import { todayISO } from '@/features/coffees/coffee-form'
import { inStock, type CoffeeSummary } from '@/features/inventory/library'
import { METHOD_LABEL } from '@/features/home/monthly-stats'
import { findActiveVersion, getSetup, loadSummaries, saveEngineVersion } from '@/lib/library-db'
import { ensureSeed, getDb } from '@/lib/offline-db'
import { brewHref } from '@/lib/recipes'
import { formatNumber, formatRange, formatRatio } from '@/lib/format'
import { EMPTY_SETUP, type SetupRecord } from '@/lib/schemas/coffee'
import type { Method, RecipeParams as Params } from '@/lib/schemas/recipe-seed'
import { OBJECTIVE_LABEL, OBJECTIVES, PREFERENCE_LABEL, PREFERENCES, type Objective, type Preference } from './engine-tables'
import { ENGINE_TRACEABILITY, generateRecipe, type Change, type RecipeOutput } from './recipe-engine'

type Step = 1 | 2 | 3 | 4
const METHODS: Method[] = ['v60', 'aeropress', 'espresso']

function paramRows(p: Params): ParamRow[] {
  // Sin molino, la molienda va en el aviso de abajo (descriptor), no como fila vacía
  const rows: ParamRow[] = [
    { label: 'Café', value: formatNumber(p.doseG), unit: 'g' },
    { label: 'Agua', value: formatNumber(p.waterG), unit: 'g' },
    { label: 'Temperatura', value: formatNumber(p.tempC), unit: '°C' },
    { label: 'Ratio', value: formatRatio(p.waterG, p.doseG) },
  ]
  if (p.grind.clicks) rows.push({ label: `Molienda ${p.grind.descriptor}`, value: formatNumber(p.grind.clicks), unit: 'clicks' })
  return rows
}

export function MakeCoffeeScreen() {
  const router = useRouter()
  const preselected = useSearchParams().get('cafe')
  const [list, setList] = useState<CoffeeSummary[] | null>(null)
  const [setup, setSetup] = useState<SetupRecord>(EMPTY_SETUP)
  const [step, setStep] = useState<Step>(preselected ? 2 : 1)
  const [coffeeId, setCoffeeId] = useState<string | null>(preselected)
  const [method, setMethod] = useState<Method | null>(null)
  const [objective, setObjective] = useState<Objective>('equilibrado')
  const [preference, setPreference] = useState<Preference | null>(null)
  const [existing, setExisting] = useState<{ id: string; number: number; params: Params; locked: boolean } | null>(null)
  const [starting, setStarting] = useState(false)
  const firstStep: Step = preselected ? 2 : 1

  useEffect(() => {
    void (async () => {
      const db = getDb()
      await ensureSeed(db, Date.now())
      const [summaries, s] = await Promise.all([loadSummaries(db, Date.now()), getSetup(db)])
      setSetup(s)
      setList(summaries)
      const pre = summaries.find((x) => x.coffee.id === preselected)
      if (pre?.lastMethod) setMethod(pre.lastMethod)
    })()
  }, [preselected])

  // Pasos en el historial: el atrás de Android vuelve al paso anterior
  const goTo = useCallback((n: Step) => {
    window.history.pushState({ paso: n }, '')
    setStep(n)
  }, [])
  useEffect(() => {
    const onPop = (e: PopStateEvent) => setStep(((e.state as { paso?: Step } | null)?.paso ?? firstStep) as Step)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [firstStep])
  const back = () => (step > firstStep ? window.history.back() : router.push('/'))

  const selected = list?.find((s) => s.coffee.id === coffeeId) ?? null
  const coffee = selected?.coffee ?? null

  // Puro y barato: se recalcula en cada render
  const output: RecipeOutput | null = method
    ? generateRecipe({
        method,
        objective,
        preference: objective === 'para_alguien_mas' ? preference : null,
        coffee,
        setup,
        todayISO: todayISO(),
      })
    : null

  // R1: si ya existe esta receta (café + método + objetivo), parte de tu versión
  useEffect(() => {
    if (step !== 4 || !method) return
    let cancelled = false
    void (async () => {
      const v = await findActiveVersion(getDb(), coffeeId, method, objective)
      if (!cancelled) setExisting(v ? { id: v.id, number: v.number, params: v.params, locked: v.status === 'locked' } : null)
    })()
    return () => {
      cancelled = true
    }
  }, [step, coffeeId, method, objective])

  const start = async () => {
    if (!method || !output) return
    setStarting(true)
    const id = existing?.id ?? (await saveEngineVersion(getDb(), { coffee, method, objective, output }))
    router.push(brewHref(id))
  }

  if (!list) return <main className="min-h-dvh" aria-busy="true" />

  const available = inStock(list)
  const header = <TopBar variant="flow" onBack={back} current={step} total={4} />

  // 1 · Café
  if (step === 1) {
    return (
      <FlowShell header={header}>
        <h1 className="t-title-lg text-fg">¿Qué café preparas?</h1>
        {available.length ? (
          <div>
            {available.map((s) => (
              <CoffeeRow
                key={s.coffee.id}
                s={s}
                onOpen={() => {
                  setCoffeeId(s.coffee.id)
                  setMethod((m) => m ?? s.lastMethod)
                  goTo(2)
                }}
              />
            ))}
          </div>
        ) : (
          <p className="t-body text-fg-2">Aún no tienes cafés con stock. Agrega uno o prepara una receta base.</p>
        )}
        <div>
          <ListRow
            thumb={<Coffee size={24} strokeWidth={1.5} aria-hidden="true" />}
            title="Sin café registrado"
            subtitle="Receta base del método"
            onClick={() => {
              setCoffeeId(null)
              goTo(2)
            }}
          />
        </div>
        <Button variant="secondary" size="lg" fullWidth icon={Plus} onClick={() => router.push('/cafe/nuevo')}>
          Tengo un café nuevo
        </Button>
      </FlowShell>
    )
  }

  // 2 · Método
  if (step === 2) {
    return (
      <FlowShell
        header={header}
        footer={
          <Button size="lg" fullWidth disabled={!method} onClick={() => goTo(3)}>
            Siguiente
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="t-label flex items-center gap-1.5 text-fg-3">
            {coffee ? <Package size={14} strokeWidth={1.5} aria-hidden="true" /> : null}
            {coffee?.name ?? 'Receta base'}
          </p>
          <h1 className="t-title-lg text-fg">¿Con qué lo preparas?</h1>
        </div>
        <ChipGrid
          aria-label="Método"
          columns={3}
          options={METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
          value={method}
          onChange={(v) => setMethod(v as Method)}
        />
      </FlowShell>
    )
  }

  // 3 · Objetivo
  if (step === 3) {
    return (
      <FlowShell
        header={header}
        footer={
          <Button size="lg" fullWidth onClick={() => goTo(4)}>
            Ver receta
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="t-label text-fg-3">{[coffee?.name ?? 'Receta base', method ? METHOD_LABEL[method] : null].filter(Boolean).join(' · ')}</p>
          <h1 className="t-title-lg text-fg">¿Cómo quieres la taza?</h1>
        </div>
        <ChipGrid
          aria-label="Objetivo de la taza"
          columns={2}
          options={OBJECTIVES.map((o) => ({ value: o, label: OBJECTIVE_LABEL[o] }))}
          value={objective}
          onChange={(v) => setObjective(v as Objective)}
        />
        {objective === 'para_alguien_mas' ? (
          <section className="flex flex-col gap-3" aria-labelledby="pref">
            <div className="flex flex-col gap-1">
              <h2 id="pref" className="t-label text-fg-3">
                ¿Qué le gusta?
              </h2>
              <p className="t-caption text-fg-3">No se guarda nada de la otra persona.</p>
            </div>
            <ChipGrid
              aria-label="Qué le gusta"
              columns={3}
              options={PREFERENCES.map((p) => ({ value: p, label: PREFERENCE_LABEL[p] }))}
              value={preference}
              onChange={(v) => setPreference(v as Preference)}
            />
          </section>
        ) : null}
      </FlowShell>
    )
  }

  // 4 · Receta
  if (!output || !method) return null
  const params = existing?.params ?? output.params
  const changes: Change[] = existing ? [] : output.changes
  const short = selected?.stock && selected.stock.grams < params.doseG

  return (
    <FlowShell
      header={header}
      footer={
        <Button size="lg" fullWidth loading={starting} disabled={Boolean(short)} onClick={() => void start()}>
          Preparar ahora
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="t-label text-fg-3">
          {[coffee?.name ?? 'Receta base', METHOD_LABEL[method], OBJECTIVE_LABEL[objective]].join(' · ')}
        </p>
        <h1 className="t-title-lg text-fg">{existing ? `Tu receta V${existing.number}` : 'Tu receta'}</h1>
      </div>

      <section className="flex flex-col gap-0.5">
        <p className="t-label text-fg-3">Tiempo objetivo</p>
        <p className="t-num-window text-fg">{formatRange(params.totalMinS, params.totalMaxS)}</p>
      </section>

      {short ? <Banner tone="danger">No alcanza para esta receta: quedan {formatNumber(selected!.stock!.grams)} g.</Banner> : null}

      <RecipeParams rows={paramRows(params)} />

      {!params.grind.clicks ? (
        <Banner
          tone="neutral"
          action={
            <Button variant="tertiary" size="md" onClick={() => router.push('/setup')}>
              Configurar
            </Button>
          }
        >
          Molienda {params.grind.descriptor}. Configura tu molino para ver los clicks.
        </Banner>
      ) : null}

      <section className="flex flex-col gap-3">
        <p className="t-body-lg text-fg">
          {existing
            ? existing.locked
              ? 'Tu receta bloqueada: es tu punto de partida y Bloom no la ajusta sola.'
              : 'Partes de tu mejor versión de esta receta. Tus calificaciones la siguen ajustando.'
            : output.priority}
        </p>
        {changes.length ? (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {changes.map((c) => (
              <li key={c.label} className="t-caption text-fg-2">
                {c.label}
              </li>
            ))}
          </ul>
        ) : null}
        {!existing && output.objectiveEvidence === 'heuristica' ? (
          <p className="t-caption text-fg-3">Punto de partida: tu primera cata lo afina.</p>
        ) : null}
        {!existing && output.objectiveEvidence === 'hipotesis' ? <p className="t-caption text-warning">Experimento</p> : null}
        <p className="t-caption flex flex-wrap items-center gap-2 text-fg-3">
          <TrustBadge status={ENGINE_TRACEABILITY.status} inline />
          {ENGINE_TRACEABILITY.label}
        </p>
      </section>
    </FlowShell>
  )
}
