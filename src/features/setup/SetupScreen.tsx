'use client'

/**
 * Setup (product §18, fase 3): molino y punto de partida por método, altitud donde
 * preparas y vibración del Brew Mode. Se guarda solo al cambiar (sin botón "Guardar").
 */
import { useEffect, useState } from 'react'
import { SegmentedControl, Stepper, TextField, Toggle, TrustBadge } from '@/components'
import { AppShell } from '@/features/shell/AppShell'
import { parseNumber } from '@/features/coffees/coffee-form'
import { METHOD_LABEL } from '@/features/home/monthly-stats'
import { localBoilingPointC } from '@/features/recipes/engine-tables'
import { LEBURRY_38, presetById, setupFromPreset } from '@/features/recipes/grinders'
import { getSetup, saveSetup } from '@/lib/library-db'
import { getDb, getHapticsEnabled, setHapticsEnabled } from '@/lib/offline-db'
import { formatNumber } from '@/lib/format'
import type { GrinderSetup, SetupRecord } from '@/lib/schemas/coffee'
import type { Method } from '@/lib/schemas/recipe-seed'

const METHODS: Method[] = ['v60', 'aeropress', 'espresso']
type GrinderMode = 'preset' | 'otro' | 'ninguno'

const CUSTOM_DEFAULT: GrinderSetup = {
  presetId: null,
  name: 'Mi molino',
  minClicks: 1,
  maxClicks: 40,
  clicksPerStep: 1,
  base: { v60: 20, aeropress: 15, espresso: 5 },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h2 className="t-label text-fg-3">{title}</h2>
      {children}
    </section>
  )
}

export function SetupScreen() {
  const [setup, setSetup] = useState<SetupRecord | null>(null)
  const [haptics, setHaptics] = useState(true)
  const [altitudeText, setAltitudeText] = useState('')
  const [altitudeError, setAltitudeError] = useState<string>()
  const [rangeText, setRangeText] = useState({ min: '', max: '' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    void (async () => {
      const db = getDb()
      const [s, h] = await Promise.all([getSetup(db), getHapticsEnabled(db)])
      setSetup(s)
      setHaptics(h)
      setAltitudeText(s.brewAltitudeM === null ? '' : String(s.brewAltitudeM))
      if (s.grinder) setRangeText({ min: String(s.grinder.minClicks), max: String(s.grinder.maxClicks) })
    })()
  }, [])

  if (!setup) return <main className="min-h-dvh" aria-busy="true" />

  const commit = async (next: SetupRecord) => {
    setSetup(next)
    await saveSetup(getDb(), next)
    setStatus('Guardado')
  }

  const g = setup.grinder
  const mode: GrinderMode = !g ? 'ninguno' : g.presetId ? 'preset' : 'otro'
  const preset = presetById(g?.presetId ?? null)

  const setMode = (m: GrinderMode) => {
    const grinder = m === 'ninguno' ? null : m === 'preset' ? setupFromPreset(LEBURRY_38) : CUSTOM_DEFAULT
    if (grinder) setRangeText({ min: String(grinder.minClicks), max: String(grinder.maxClicks) })
    void commit({ ...setup, grinder })
  }
  const setGrinder = (patch: Partial<GrinderSetup>) => g && void commit({ ...setup, grinder: { ...g, ...patch } })

  const commitRange = () => {
    if (!g) return
    const min = parseNumber(rangeText.min)
    const max = parseNumber(rangeText.max)
    if (min === null || max === null || Number.isNaN(min) || Number.isNaN(max) || min >= max || !Number.isInteger(min) || !Number.isInteger(max)) return
    const clamp = (n: number) => Math.min(max, Math.max(min, n))
    setGrinder({ minClicks: min, maxClicks: max, base: { v60: clamp(g.base.v60), aeropress: clamp(g.base.aeropress), espresso: clamp(g.base.espresso) } })
  }

  const commitAltitude = () => {
    const a = parseNumber(altitudeText)
    if (a !== null && (Number.isNaN(a) || a > 5000 || !Number.isInteger(a))) {
      setAltitudeError('Escribe la altitud en metros, hasta 5000')
      return
    }
    setAltitudeError(undefined)
    void commit({ ...setup, brewAltitudeM: a })
  }
  const boiling = setup.brewAltitudeM ? localBoilingPointC(setup.brewAltitudeM) : null

  return (
    <AppShell active="setup">
      <header className="flex min-h-12 items-center justify-between pt-[env(safe-area-inset-top)]">
        <h1 className="t-title-lg text-fg">Setup</h1>
        <p className="t-caption text-fg-3" aria-live="polite">
          {status}
        </p>
      </header>

      <Section title="Molino">
        <SegmentedControl
          aria-label="Molino"
          options={[
            { value: 'preset', label: 'LEBURRY' },
            { value: 'otro', label: 'Otro' },
            { value: 'ninguno', label: 'Sin molino' },
          ]}
          value={mode}
          onChange={(v) => setMode(v as GrinderMode)}
        />

        {mode === 'ninguno' ? (
          <p className="t-body text-fg-2">Las recetas muestran la molienda como descripción (“media-fina”), sin clicks.</p>
        ) : null}

        {g && mode === 'preset' ? (
          <p className="t-body text-fg-2">
            <span className="num">{g.maxClicks}</span> posiciones; la <span className="num">1</span> es la más fina. Un ajuste de
            la receta mueve <span className="num">{g.clicksPerStep}</span> posiciones.
          </p>
        ) : null}

        {g && mode === 'otro' ? (
          <div className="flex flex-col gap-3">
            <TextField label="Nombre del molino" value={g.name} onChange={(e) => setGrinder({ name: e.target.value || 'Mi molino' })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Más fina" numeric value={rangeText.min} onChange={(e) => setRangeText((r) => ({ ...r, min: e.target.value }))} onBlur={commitRange} />
              <TextField label="Más gruesa" numeric value={rangeText.max} onChange={(e) => setRangeText((r) => ({ ...r, max: e.target.value }))} onBlur={commitRange} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="t-body text-fg-2">Clicks por ajuste</p>
              <Stepper aria-label="Clicks por ajuste" value={g.clicksPerStep} min={1} max={5} onChange={(v) => setGrinder({ clicksPerStep: v })} />
            </div>
          </div>
        ) : null}

        {g ? (
          <div className="flex flex-col">
            <p className="t-caption text-fg-3">Punto de partida por método. Calíbralo con tu primera taza.</p>
            {METHODS.map((m) => {
              const range = preset?.ranges[m]
              return (
                <div key={m} className="flex items-center justify-between gap-4 border-b border-line py-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="t-body text-fg">{METHOD_LABEL[m]}</p>
                    {range ? (
                      <p className="t-caption flex flex-wrap items-center gap-2 text-fg-3">
                        Fabricante: <span className="num">{range.min}–{range.max}</span>
                        {range.status === 'inferido' ? <TrustBadge status="inferido" inline /> : null}
                      </p>
                    ) : null}
                  </div>
                  <Stepper
                    aria-label={`Clicks para ${METHOD_LABEL[m]}`}
                    value={g.base[m]}
                    min={g.minClicks}
                    max={g.maxClicks}
                    onChange={(v) => setGrinder({ base: { ...g.base, [m]: v } })}
                  />
                </div>
              )
            })}
          </div>
        ) : null}
      </Section>

      <Section title="Donde preparas">
        <TextField
          label="Altitud (opcional)"
          numeric
          suffix="m"
          value={altitudeText}
          onChange={(e) => {
            setAltitudeText(e.target.value)
            setAltitudeError(undefined)
          }}
          onBlur={commitAltitude}
          error={altitudeError}
        />
        <p className="t-caption text-fg-3">
          {boiling !== null ? (
            <>
              A esta altitud el agua hierve a ~<span className="num">{formatNumber(boiling)}</span> °C: en V60 y AeroPress la receta no pasa de ahí.
            </>
          ) : (
            'En altura el agua hierve antes; con este dato Bloom ajusta la temperatura máxima.'
          )}
        </p>
      </Section>

      <Section title="Brew Mode">
        <Toggle
          label="Vibración"
          checked={haptics}
          onChange={async (v) => {
            await setHapticsEnabled(getDb(), v)
            setHaptics(v)
            setStatus('Guardado')
          }}
        />
        <p className="t-caption text-fg-3">El aviso en pantalla siempre está, con o sin vibración.</p>
      </Section>
    </AppShell>
  )
}
