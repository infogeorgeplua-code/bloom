'use client'

/**
 * "Tengo un café nuevo" (product §6 C, §18). Sin frame en Figma: diseñado con componentes
 * y patrones del DS. UX: un solo campo obligatorio, el resto opcional y agrupado de lo que
 * está en la etiqueta de la bolsa a lo que no; chips para listas cerradas; CTA fija.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, ChipGrid, TextField, TopBar } from '@/components'
import { FlowShell } from '@/features/shell/AppShell'
import { roastWindow } from '@/features/recipes/recipe-engine'
import { createCoffee, updateCoffee } from '@/lib/library-db'
import { getDb } from '@/lib/offline-db'
import { PROCESS_LABEL, ROAST_LABEL, type ProcessType, type RoastLevel } from '@/lib/schemas/coffee'
import {
  BAG_SIZES,
  daysWord,
  EMPTY_FORM,
  fromRecord,
  todayISO,
  validateCoffeeForm,
  type CoffeeFormValues,
  type FormErrors,
} from './coffee-form'

const PROCESS_OPTIONS = (Object.keys(PROCESS_LABEL) as ProcessType[]).map((v) => ({ value: v, label: PROCESS_LABEL[v] }))
const ROAST_OPTIONS = (Object.keys(ROAST_LABEL) as RoastLevel[]).map((v) => ({ value: v, label: ROAST_LABEL[v] }))
const ROAST_STATE_TEXT = { reposo: 'aún reposando', ideal: 'en su punto', pasada: 'pasado su mejor momento' } as const

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex flex-col gap-1">
        <h2 className="t-label text-fg-3">{title}</h2>
        {hint ? <p className="t-caption text-fg-3">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function CoffeeFormScreen() {
  const router = useRouter()
  const editId = useSearchParams().get('id')
  const [values, setValues] = useState<CoffeeFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(!editId)
  const formRef = useRef<HTMLFormElement>(null)
  const today = todayISO()

  useEffect(() => {
    if (!editId) return
    void (async () => {
      const c = await getDb().coffees.get(editId)
      if (c) setValues(fromRecord(c))
      setLoaded(true)
    })()
  }, [editId])

  const set = <K extends keyof CoffeeFormValues>(key: K, value: CoffeeFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }
  /** En chips de una opción, tocar la elegida la quita (el dato vuelve a "no lo sé") */
  const toggle = <K extends 'process' | 'roastLevel'>(key: K, value: CoffeeFormValues[K]) =>
    set(key, values[key] === value ? null : value)

  const back = () => (window.history.length > 1 ? router.back() : router.push('/stock'))

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const r = validateCoffeeForm(values, today)
    if (!r.ok) {
      setErrors(r.errors)
      // Lleva el foco al primer campo con error
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setSaving(true)
    const db = getDb()
    if (editId) {
      await updateCoffee(db, editId, r.coffee)
      router.replace(`/cafe?id=${encodeURIComponent(editId)}`)
    } else {
      const id = await createCoffee(db, r.coffee, r.bagG)
      router.replace(`/cafe?id=${encodeURIComponent(id)}`)
    }
  }

  const roast = values.roastDateISO && values.roastDateISO <= today ? roastWindow(values.roastDateISO, today, 'v60') : null
  const bagChip = BAG_SIZES.map(String).includes(values.bagG.trim()) ? values.bagG.trim() : null

  if (!loaded) return <main className="min-h-dvh" aria-busy="true" />

  return (
    <FlowShell
      header={<TopBar onClose={back} title={editId ? 'Editar café' : 'Café nuevo'} />}
      footer={
        <Button size="lg" fullWidth loading={saving} onClick={() => void submit()}>
          {editId ? 'Guardar cambios' : 'Guardar café'}
        </Button>
      }
    >
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-8">
        <p className="t-body text-fg-2">
          Solo el nombre es obligatorio. Lo demás afina la receta; si no lo sabes, déjalo vacío.
        </p>

        <Group title="Café">
          <TextField
            label="Nombre del café"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            required
          />
          <TextField label="Tostador (opcional)" value={values.roaster} onChange={(e) => set('roaster', e.target.value)} autoCapitalize="words" />
        </Group>

        <Group title="Tueste" hint="Mueve la temperatura de la receta.">
          <ChipGrid
            aria-label="Nivel de tueste"
            columns={2}
            options={ROAST_OPTIONS}
            value={values.roastLevel}
            onChange={(v) => toggle('roastLevel', v as RoastLevel)}
          />
          <div className="flex flex-col gap-1">
            <TextField
              label="Fecha de tueste (opcional)"
              type="date"
              max={today}
              value={values.roastDateISO}
              onChange={(e) => set('roastDateISO', e.target.value)}
              error={errors.roastDateISO}
            />
            {roast ? (
              <p className="t-caption px-1 text-fg-2" aria-live="polite">
                Tostado hace <span className="num">{roast.days}</span> {daysWord(roast.days)} · {ROAST_STATE_TEXT[roast.state]}
              </p>
            ) : null}
          </div>
        </Group>

        <Group title="Proceso">
          <ChipGrid
            aria-label="Proceso"
            columns={3}
            options={PROCESS_OPTIONS}
            value={values.process}
            onChange={(v) => toggle('process', v as ProcessType)}
          />
        </Group>

        <Group title="Origen">
          <TextField label="País (opcional)" value={values.originCountry} onChange={(e) => set('originCountry', e.target.value)} autoCapitalize="words" />
          <TextField label="Variedad (opcional)" value={values.variety} onChange={(e) => set('variety', e.target.value)} autoCapitalize="words" />
          <TextField
            label="Altitud del cultivo (opcional)"
            numeric
            suffix="m"
            value={values.altitudeM}
            onChange={(e) => set('altitudeM', e.target.value)}
            error={errors.altitudeM}
          />
        </Group>

        {editId ? null : (
          <Group title="Bolsa" hint="Con los gramos, Bloom descuenta cada taza y te avisa cuando quede poco.">
            <ChipGrid
              aria-label="Tamaño de la bolsa"
              columns={2}
              options={BAG_SIZES.map((g) => ({ value: String(g), label: `${g} g` }))}
              value={bagChip}
              onChange={(v) => set('bagG', bagChip === v ? '' : v)}
            />
            <TextField
              label="Otros gramos (opcional)"
              numeric
              suffix="g"
              value={bagChip ? '' : values.bagG}
              onChange={(e) => set('bagG', e.target.value)}
              error={errors.bagG}
            />
          </Group>
        )}
      </form>
    </FlowShell>
  )
}
