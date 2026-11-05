'use client'

/**
 * Evaluación "¿Qué tal esta receta?" (DS §4.4, product §10): calificación → detalle → ajuste
 * propuesto. El motor de ajuste (brew-adjust) decide; esta pantalla solo pinta y guarda.
 * Funciona sin conexión: todo vive en IndexedDB. El botón atrás de Android vuelve un paso.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquarePlus, Plus, Star } from 'lucide-react'
import { Banner, BottomSheet, Button, Chip, ChipGrid, RATING_LABEL, RatingScale, RecipeParams, TextField, TopBar } from '@/components'
import { FlowShell } from '@/features/shell/AppShell'
import { todayISO } from '@/features/coffees/coffee-form'
import { getRecipeVersion, getSetup } from '@/lib/library-db'
import { acceptProposal, evaluateBrew, lockVersion, unlockVersion, type EvaluationResult } from '@/lib/evaluation-db'
import { getDb } from '@/lib/offline-db'
import type { RatingLevel, Symptom } from '@/lib/schemas/evaluation'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { MAX_SYMPTOMS, SYMPTOMS, SYMPTOM_LABEL } from './adjust-tables'
import { reasonFor } from './brew-adjust'
import { basedOnText, diffRows, reportedText, symptomList } from './evaluation-copy'

type Phase = 'rate' | 'detail' | 'result'

const DETAIL_TITLE: Record<1 | 2 | 3 | 4, string> = {
  1: '¿Qué notaste?',
  2: '¿Qué notaste?',
  3: '¿Qué le faltó?',
  4: '¿Algún detalle?',
}

export function EvaluationScreen() {
  const router = useRouter()
  const sessionId = useSearchParams().get('s') ?? ''
  const [loaded, setLoaded] = useState<{ recipe: RecipeVersion | null; alreadyRated: boolean } | null>(null)
  const [phase, setPhase] = useState<Phase>('rate')
  const [rating, setRating] = useState<RatingLevel | null>(null)
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [showDetail, setShowDetail] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [lockOpen, setLockOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [hasGrinder, setHasGrinder] = useState(true)

  useEffect(() => {
    void (async () => {
      const db = getDb()
      const s = await db.brewSessions.get(sessionId)
      const [recipe, setup] = await Promise.all([s ? getRecipeVersion(db, s.versionId) : null, getSetup(db)])
      setHasGrinder(Boolean(setup.grinder))
      setLoaded({ recipe: s ? recipe : null, alreadyRated: Boolean(s && s.rating !== null) })
    })()
  }, [sessionId])

  // Android atrás: detalle → calificación; desde el resultado (ya guardado) → Home
  const goDetail = useCallback(() => {
    window.history.pushState({ eval: 'detail' }, '')
    setPhase('detail')
  }, [])
  useEffect(() => {
    const onPop = () => {
      if (phase === 'detail') setPhase('rate')
      else if (phase === 'result') router.push('/')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [phase, router])

  const home = () => router.push('/')

  const save = async (r: RatingLevel, syms: Symptom[]) => {
    setBusy(true)
    const res = await evaluateBrew(getDb(), { sessionId, rating: r, symptoms: syms, notes: note.trim() || null, todayISO: todayISO() })
    setBusy(false)
    return res
  }

  const onRate = async (r: RatingLevel) => {
    setRating(r)
    if (r !== 5) {
      const max = MAX_SYMPTOMS[r]
      setSymptoms((s) => s.slice(-max))
      return goDetail()
    }
    const res = await save(5, [])
    setResult(res)
    if (res?.outcome.kind === 'lock_proposal') setLockOpen(true)
    else {
      setMessage(res?.current.status === 'locked' ? 'Guardado. Tu receta sigue bloqueada.' : 'Guardado.')
      setPhase('result')
    }
  }

  const showAdjust = async () => {
    if (!rating || rating === 5) return
    const res = await save(rating, symptoms)
    setResult(res)
    setMessage(null)
    setPhase('result')
  }

  const saveWithoutAdjust = async () => {
    if (!rating) return
    await save(rating, symptoms)
    home()
  }

  if (!loaded) return <main className="min-h-dvh" aria-busy="true" />
  if (!loaded.recipe || (loaded.alreadyRated && !result)) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
        <p className="t-title text-fg">{loaded.recipe ? 'Ya evaluaste esta taza' : 'No encontramos esta taza'}</p>
        <Button onClick={home}>Ir al inicio</Button>
      </main>
    )
  }

  const recipe = loaded.recipe
  const header = <TopBar onClose={home} meta={`${recipe.name} · V${recipe.number}`} />

  // 1 · Calificación
  if (phase === 'rate') {
    return (
      <FlowShell header={header}>
        <h1 className="t-display text-fg">¿Qué tal esta receta?</h1>
        <RatingScale value={rating} onChange={(r) => void onRate(r)} />
        <LockSheet
          open={lockOpen}
          busy={busy}
          onLock={async () => {
            setBusy(true)
            await lockVersion(getDb(), recipe.id)
            setBusy(false)
            setLockOpen(false)
            setMessage('Receta bloqueada. Será tu punto de partida y Bloom no la ajustará sola.')
            setPhase('result')
          }}
          onSkip={() => {
            setLockOpen(false)
            setMessage('Guardado.')
            setPhase('result')
          }}
        />
      </FlowShell>
    )
  }

  // 2 · Detalle según el nivel
  if (phase === 'detail' && rating && rating < 5) {
    const level = rating as 1 | 2 | 3 | 4
    const max = MAX_SYMPTOMS[level]
    const chips = (
      <ChipGrid
        aria-label="Síntomas"
        multiple
        columns={3}
        options={SYMPTOMS.map((s) => ({ value: s, label: SYMPTOM_LABEL[s] }))}
        value={symptoms}
        onChange={(v) => setSymptoms((v as Symptom[]).slice(-max))}
      />
    )
    return (
      <FlowShell
        header={header}
        footer={
          level === 4 ? (
            <Button size="lg" fullWidth loading={busy} onClick={() => void showAdjust()}>
              Guardar
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button size="lg" fullWidth loading={busy} disabled={!symptoms.length} onClick={() => void showAdjust()}>
                Ver ajuste
              </Button>
              <Button variant="tertiary" size="md" fullWidth disabled={busy} onClick={() => void saveWithoutAdjust()}>
                Guardar sin ajuste
              </Button>
            </div>
          )
        }
      >
        <div className="flex flex-col gap-2">
          <p className="t-label text-fg-3">{RATING_LABEL[level]}</p>
          <h1 className="t-title-lg text-fg">{DETAIL_TITLE[level]}</h1>
          <p className="t-caption text-fg-3">
            {level === 3 ? 'Opcional · elige uno' : level === 4 ? 'Opcional' : `Elige hasta ${max}: con eso te propongo un ajuste`}
          </p>
        </div>
        {level === 4 && !showDetail ? (
          <div>
            <Chip icon={Plus} onClick={() => setShowDetail(true)}>
              Agregar detalle
            </Chip>
          </div>
        ) : (
          chips
        )}
        {showNote ? (
          <TextField multiline label="Nota" value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} />
        ) : (
          <div>
            <Chip icon={MessageSquarePlus} onClick={() => setShowNote(true)}>
              Agregar nota
            </Chip>
          </div>
        )}
      </FlowShell>
    )
  }

  // 3 · Resultado
  const done = (
    <Button size="lg" fullWidth onClick={home}>
      Listo
    </Button>
  )
  const o = result?.outcome

  if (message || !o) {
    return (
      <FlowShell header={header} footer={done}>
        <h1 className="t-title-lg flex items-center gap-2 text-fg">
          {message?.startsWith('Receta bloqueada') ? (
            <Star size={24} strokeWidth={1.5} className="fill-accent text-accent" aria-label="Receta bloqueada" />
          ) : null}
          {message ?? 'Guardado.'}
        </h1>
      </FlowShell>
    )
  }

  if (o.kind === 'unlock_suggestion') {
    return (
      <FlowShell
        header={header}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              fullWidth
              onClick={async () => {
                await unlockVersion(getDb(), o.versionId)
                home()
              }}
            >
              Desbloquear receta
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={home}>
              Mantener bloqueada
            </Button>
          </div>
        }
      >
        <h1 className="t-title-lg text-fg">¿Desbloqueamos la receta?</h1>
        <p className="t-body-lg text-fg">Tu receta bloqueada salió floja dos veces seguidas.</p>
        {o.daysSinceRoast !== null ? (
          <p className="t-body text-fg-2">
            El café lleva <span className="num">{o.daysSinceRoast}</span> {o.daysSinceRoast === 1 ? 'día' : 'días'} desde el tueste: puede
            estar perdiendo frescura. Desbloqueada, Bloom vuelve a ajustarla con tus catas.
          </p>
        ) : (
          <p className="t-body text-fg-2">Desbloqueada, Bloom vuelve a ajustarla con tus catas.</p>
        )}
      </FlowShell>
    )
  }

  if ((o.kind === 'propose' || o.kind === 'revert') && o.changes.length && o.meta) {
    const base = o.base
    const meta = o.meta
    const textChanges = o.changes.filter((c) => c.variable === 'agitation')
    return (
      <FlowShell
        header={header}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              fullWidth
              loading={busy}
              onClick={async () => {
                setBusy(true)
                await acceptProposal(getDb(), { base, changes: o.changes, meta })
                home()
              }}
            >
              {`Usar V${result?.nextNumber ?? base.number + 1} la próxima vez`}
            </Button>
            <Button variant="secondary" size="lg" fullWidth disabled={busy} onClick={home}>
              {`Mantener V${base.number}`}
            </Button>
          </div>
        }
      >
        <p className="t-label text-fg-3">Para la próxima taza</p>
        {o.kind === 'revert' ? (
          <Banner tone="neutral">
            V{recipe.number} salió peor que V{base.number}. Volvemos a V{base.number} y probamos otra cosa.
          </Banner>
        ) : null}
        <p className="t-body text-fg-2">Reportaste: {reportedText(rating ?? 3, symptoms)}</p>
        {diffRows(o.changes).length ? (
          <RecipeParams variant="diff" rows={diffRows(o.changes).map((r) => ({ label: r.label, before: r.before, value: r.value, unit: r.unit }))} />
        ) : null}
        {textChanges.map((c) => (
          <p key={c.stepId} className="t-body text-fg">
            Técnica: {String(c.after)}
          </p>
        ))}
        <div className="flex flex-col gap-2">
          {o.changes.map((c) => (
            <p key={c.variable} className="t-body-lg text-fg">
              {reasonFor(c)}
            </p>
          ))}
        </div>
        <p className="t-caption text-fg-3">{basedOnText(result?.evaluatedCount ?? 1)}</p>
      </FlowShell>
    )
  }

  // Sin propuesta: R8, pista (R3), revertida sin otra variable o sin opción con tu equipo
  let body: React.ReactNode
  if (o.kind === 'revert') {
    body = (
      <>
        <Banner tone="neutral">
          V{recipe.number} salió peor que V{o.base.number}. Volvemos a V{o.base.number}.
        </Banner>
        <p className="t-body text-fg-2">Ya probamos las dos variables de la tabla para este síntoma. La próxima cata nos dice cómo seguir.</p>
      </>
    )
  } else if (o.kind === 'keep' && o.hint) {
    body = (
      <p className="t-body text-fg-2">
        Anoté {symptomList([o.hint])} como pista: si se repite en tu próxima taza de esta receta, te propongo un cambio.
      </p>
    )
  } else if (o.kind === 'no_option') {
    body = (
      <>
        <p className="t-body text-fg-2">
          Para {symptomList(o.symptoms)} no hay un ajuste posible dentro de los límites de esta receta
          {hasGrinder ? '.' : ' sin un molino configurado.'}
        </p>
        {!hasGrinder ? (
          <Banner
            tone="neutral"
            action={
              <Button variant="tertiary" size="md" onClick={() => router.push('/setup')}>
                Configurar
              </Button>
            }
          >
            Con tu molino en Setup, Bloom también puede ajustar la molienda.
          </Banner>
        ) : null}
      </>
    )
  } else if (o.kind === 'no_symptom') {
    body = <p className="t-body text-fg-2">La próxima vez te pregunto de nuevo.</p>
  }

  return (
    <FlowShell header={header} footer={done}>
      <h1 className="t-title-lg text-fg">Guardado.</h1>
      {body}
    </FlowShell>
  )
}

function LockSheet({ open, busy, onLock, onSkip }: { open: boolean; busy: boolean; onLock: () => void; onSkip: () => void }) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => !o && onSkip()}
      variant="inverse"
      title={
        <span className="flex items-center gap-2">
          <Star size={24} strokeWidth={1.5} className="fill-accent text-accent" aria-hidden="true" />
          ¿Bloqueamos esta receta?
        </span>
      }
      description="Será tu punto de partida y Bloom no la ajustará sola."
    >
      <Button size="lg" fullWidth loading={busy} onClick={onLock}>
        Bloquear receta
      </Button>
      <Button variant="tertiary" size="lg" fullWidth onClick={onSkip}>
        Ahora no
      </Button>
    </BottomSheet>
  )
}
